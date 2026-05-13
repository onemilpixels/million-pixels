# Million Pixels — Stripe Backup Payment Flow

**Owner:** Revenue Agent → Tech Agent
**Status:** Sprint 2 deliverable
**Goal:** Hot-swap fallback when Gumroad fails, plus optional A/B path.

---

## When to fall back

| Trigger | Action |
|---|---|
| Gumroad webhook silent >30 min (during business hrs) | Auto-switch via feature flag |
| Gumroad checkout error rate > 5% (5 min window) | Auto-switch |
| Gumroad account hold | Manual switch (Travis flips flag) |
| GMV milestone $50K | Begin planned migration to Stripe primary |
| Customer requests invoice / B2B sale | Use Stripe (Gumroad doesn't do B2B invoices well) |

---

## Feature Flag

Single env var: `PAYMENT_PROVIDER=gumroad|stripe|both`

- `gumroad` — only Gumroad path active
- `stripe` — only Stripe path active
- `both` — show both checkout options, let user pick (used for A/B testing)

Front-end fetches `/api/config` on load → renders correct CTA button(s).

```javascript
// api/config.js
export default async function handler(req, res) {
  res.json({
    payment_provider: process.env.PAYMENT_PROVIDER || 'gumroad',
    show_stripe_b2b_option: true,  // always offer for >$500 orders
    grid_size: 1000,
    base_price_cents: 100,
  });
}
```

---

## Stripe Setup (v2 — re-uses existing v1 code)

Good news: **v1's Stripe integration is already built** (`api/checkout.js`, `api/webhook.js`). We just need to:

1. Update pricing to use v2 model (`pricing-v2.js`) instead of v1 tier ladder
2. Make sure both providers can coexist
3. Ensure webhooks from either provider update the same `orders` + `pixels` tables

### Code changes

```javascript
// api/v2/stripe-checkout.js
import Stripe from 'stripe';
import { quoteOrder } from './pricing-v2.js';
import { supabase, validatePayload } from '../_lib.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { email, name, color, link, pixels, utm_source } = req.body;
  const err = validatePayload(req.body);
  if (err) return res.status(400).json({ error: err });
  
  // Conflict check
  const sold = await checkSoldConflict(pixels);
  if (sold) return res.status(409).json({ error: `Pixel ${sold} already sold` });
  
  // v2 pricing
  const soldCount = await db.pixels.countPaid();
  const quote = quoteOrder(soldCount, pixels.length);
  
  // Soft-reserve
  await db.pixels.softReserve(pixels, email, null, color, link, name);
  
  // Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: email,
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `Million Pixels: ${pixels.length} pixel${pixels.length > 1 ? 's' : ''}`,
          description: pixels.length <= 5
            ? pixels.map(p => `(${p.x},${p.y})`).join(', ')
            : `${pixels.length} pixels — view your art at millionpixels.com`,
        },
        unit_amount: quote.subtotal_cents,
      },
      quantity: 1,
    }],
    metadata: {
      provider: 'stripe',
      email,
      pixel_count: String(pixels.length),
      pixel_coords: JSON.stringify(pixels.map(p => [p.x, p.y])).slice(0, 480),
      color, link: link || '',
      utm_source: utm_source || '',
      base_price_cents: String(quote.base_price_cents),
      per_pixel_cents: String(quote.per_pixel_cents),
    },
    success_url: `${process.env.SITE_URL}/?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SITE_URL}/?canceled=1`,
    // For larger orders, allow invoice
    invoice_creation: pixels.length >= 500 ? { enabled: true } : undefined,
  });
  
  // Link session_id to reservation
  await supabase.from('pixels')
    .update({ stripe_session_id: session.id })
    .in('x', pixels.map(p => p.x)).in('y', pixels.map(p => p.y))
    .eq('owner_email', email).eq('paid', false);
  
  await db.events.insert({
    type: 'checkout_start',
    metadata: { provider: 'stripe', email, ...quote, utm_source: utm_source || null },
  });
  
  res.json({ sessionId: session.id, url: session.url, total_cents: quote.subtotal_cents });
}
```

### Stripe webhook (already exists, light tweak)

```javascript
// api/v2/stripe-webhook.js — extends existing
import { broadcastPixelUpdate, creditCommission } from '../_lib.js';

export default async function handler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook signature mismatch: ${err.message}`);
  }
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const s = event.data.object;
      const { email, pixel_coords, color, link, utm_source } = s.metadata;
      const coords = JSON.parse(pixel_coords);
      
      // Idempotency
      if (await db.orders.findBySaleId(s.id)) return res.json({ ok: true, dup: true });
      
      await db.pixels.markPaid(coords, s.id, email);
      await db.orders.insert({
        sale_id: s.id, provider: 'stripe', email,
        price_cents: s.amount_total, pixel_count: coords.length,
        utm_source: utm_source || null, status: 'paid',
        paid_at: new Date(),
      });
      if (utm_source) await creditCommission(utm_source, s.id, s.amount_total);
      await broadcastPixelUpdate(coords);
      await db.events.insert({ type: 'purchase', metadata: { provider: 'stripe', ...s.metadata } });
      break;
    }
    
    case 'charge.refunded':
      await handleRefund('stripe', event.data.object);
      break;
    
    case 'charge.dispute.created':
      await handleDispute('stripe', event.data.object);
      break;
  }
  
  res.json({ received: true });
}
```

---

## Cost Comparison

| Provider | Fee structure | Effective cost on $1 sale | On $80 sale |
|---|---|---:|---:|
| Stripe | 2.9% + $0.30 | $0.33 (33%) | $2.62 (3.3%) |
| Gumroad | 10% flat | $0.10 (10%) | $8.00 (10%) |

**Insight:** Gumroad wins on **small orders ($1–$10)**, Stripe wins above ~$30. Since v2 has lots of small orders early, Gumroad starts cheaper but Stripe becomes cheaper as AOV rises (and we'll be in $100+ AOV by Day 30).

**Migration trigger:** When AOV crosses $30 sustained for 7 days, switch primary to Stripe.

---

## Shared Data Layer

Both providers write to the **same** `orders` table:

```sql
alter table orders add column if not exists provider text not null default 'gumroad';
alter table orders add column if not exists processor_fee_cents int;
create index if not exists orders_provider_idx on orders (provider, paid_at desc);
```

Dashboard splits revenue by provider for visibility but treats them as one revenue stream.

---

## Coexistence — Front-end UX

When `PAYMENT_PROVIDER=both`:

```
┌─────────────────────────────────────────────────┐
│  Choose how to pay:                             │
│                                                 │
│  [ Pay with Card (instant) ]   ← Stripe         │
│  [ Pay with Gumroad ]                           │
│                                                 │
│  Need an invoice? [Buy on Stripe →]             │
└─────────────────────────────────────────────────┘
```

For order ≥ $500: nudge toward Stripe (invoice option). Both work either way.

---

## Migration plan (Gumroad → Stripe primary)

When triggered:

1. **Day 1**: Set `PAYMENT_PROVIDER=both`, monitor split for 48h
2. **Day 3**: If Stripe handling >50% with no incidents, set `PAYMENT_PROVIDER=stripe`
3. **Day 4**: Pause new Gumroad sales (variants set to "out of stock")
4. **Day 7**: Reconcile remaining Gumroad webhook events
5. **Day 14**: Final Gumroad payout received → mark migration complete
6. Keep Gumroad account dormant as ongoing fallback

---

## Test Plan

- [ ] Stripe test mode end-to-end: 1 pixel, 10 pixels, 100 pixels
- [ ] Refund test in Stripe dashboard → verify pixel released
- [ ] Dispute test (Stripe gives test card `4000000000000259`) → verify freeze
- [ ] Both providers active: pick Stripe at checkout, verify webhook fires correctly
- [ ] Both providers active: pick Gumroad, verify Gumroad webhook fires correctly
- [ ] Switch flag mid-flight: ensure in-flight Gumroad orders complete even after flag flip
