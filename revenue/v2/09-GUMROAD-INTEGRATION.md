# Million Pixels — Gumroad Integration Spec (Sprint 1)

**Owner:** Revenue Agent → Tech Agent
**Goal:** Ship a working payment flow in **under 2 hours** with zero PCI scope.
**Status:** Ready to activate. Awaiting Travis's Gumroad account + API key.

---

## Why Gumroad

| Pro | Con |
|---|---|
| 15-min setup, no PCI scope | 10% flat fee (~3x Stripe's 2.9%) |
| Built-in checkout UX, tax, VAT | Limited customization |
| Webhooks for order events | No native referral/affiliate API (we wrap it) |
| Discount codes built in | No fine-grained tier pricing — we use variants |
| EU/global tax handled | Variants must be pre-created (not dynamic) |

**Verdict:** Use Gumroad for **launch + first $50K** of revenue. Migrate to Stripe (v1 spec) once we hit $50K and have data to justify custom build.

---

## 1. Product Setup

### Main product: "Million Pixels"

- **URL:** `https://gumroad.com/l/millionpixels` (or custom domain `buy.millionpixels.com`)
- **Description:** Short, FOMO-heavy. "Own a pixel of internet history. 1,000,000 pixels. Price rises every 5,000 sold."
- **Cover image:** Live snapshot of the grid (refreshed daily via cron)
- **Refund policy:** 7 days, no questions asked, BEFORE pixel image is uploaded; non-refundable after upload (we own the art)

### Variants (pricing tiers)

Gumroad doesn't do dynamic pricing, so we **pre-create variants** for common bundle sizes at each escalator step. Update them via API when escalator advances.

| Variant SKU | Qty | Display name | Initial price |
|-------------|----:|--------------|--------------:|
| px-1        | 1   | 1 pixel      | $1.00         |
| px-10       | 10  | 10 pixels (10% off) | $9.00  |
| px-50       | 50  | 50 pixels (15% off) | $42.50 |
| px-100      | 100 | 100 pixels (20% off) | $80.00 |
| px-500      | 500 | 500 pixels (25% off) | $375.00 |
| px-1000     | 1000| 1,000 pixels (30% off) | $700.00 |
| px-custom   | -   | Custom (contact us)  | $5,000+ |

When escalator fires (every 5,000 sold), an automated cron job patches all variant prices via Gumroad API:

```javascript
// cron/escalator.js — runs every 5 min
async function checkAndUpdateVariants() {
  const sold = await db.pixels.countPaid();
  const newBase = basePriceCents(sold);
  if (newBase !== currentBaseInDB) {
    for (const variant of VARIANTS) {
      const newPrice = Math.max(50, Math.round(newBase * variant.bundleMultBps / 10000)) * variant.qty;
      await gumroad.patchVariant(variant.id, { price_cents: newPrice });
    }
    await db.setCurrentBase(newBase);
    await notifySlack(`Escalator fired! Base price now ${newBase/100}, sold=${sold}`);
  }
}
```

### Custom fields (per Gumroad order)

Capture at checkout via Gumroad custom fields:

- `pixel_coords` (string) — JSON array of (x,y) coords customer picked. Filled by our pre-checkout page.
- `pixel_color` (string) — hex color
- `pixel_link` (string) — destination URL when pixel is clicked
- `pixel_name` (string) — display name on hover
- `utm_source` (hidden) — auto-populated from cookie

**Limitation:** Gumroad custom fields are limited to ~10 per product. Pixel coords above ~50 pixels won't fit in one field. **Workaround:** for orders ≥50 pixels, use our pre-checkout page to create a **claim token** (short UUID), pass that in the Gumroad field, and resolve it server-side on webhook.

---

## 2. Pre-Checkout Flow

Pixel picking happens on **our** site, not Gumroad's. Flow:

```
1. Customer picks pixels on millionpixels.com
2. Customer enters email, color, link, display name
3. We call POST /api/claim → returns { claim_token, gumroad_url, variant_id, total_cents }
4. We redirect to gumroad_url with ?claim=<token>&qty=<n>
5. Customer pays on Gumroad
6. Gumroad fires webhook to /api/gumroad-webhook
7. We look up claim_token, mark pixels paid, render them on grid
```

### `POST /api/claim` endpoint

```javascript
// api/v2/claim.js
export default async function handler(req, res) {
  const { email, pixels, color, link, name, utm_source } = req.body;
  
  // Validate (same as Stripe path)
  if (!email || !pixels?.length) return res.status(400).json({ error: 'Missing data' });
  if (pixels.length > 10000) return res.status(400).json({ error: 'Max 10k pixels' });
  
  // Check none sold
  const sold = await checkSoldConflict(pixels);
  if (sold) return res.status(409).json({ error: `Pixel ${sold} already sold` });
  
  // Get current pricing
  const soldCount = await db.pixels.countPaid();
  const quote = quoteOrder(soldCount, pixels.length);
  
  // Pick correct variant
  const variant = selectVariant(pixels.length);
  
  // Generate claim token, soft-reserve pixels (15-min TTL)
  const claim_token = crypto.randomBytes(16).toString('hex');
  await db.claims.insert({
    token: claim_token,
    email, color, link, name, pixels,
    utm_source: utm_source || null,
    expected_cents: quote.subtotal_cents,
    expires_at: Date.now() + 15 * 60 * 1000,
  });
  await db.pixels.softReserve(pixels, email, claim_token, color, link, name);
  
  // Build Gumroad redirect URL
  const gumroad_url = `https://gumroad.com/l/millionpixels?` +
    `variant=${variant.id}` +
    `&wanted=true` +
    `&claim=${claim_token}` +
    `&email=${encodeURIComponent(email)}`;
  
  res.json({ claim_token, gumroad_url, variant_id: variant.id, total_cents: quote.subtotal_cents });
}
```

### Soft reservation TTL

- 15 minutes from `/api/claim` to webhook confirmation
- Background job clears expired reservations every minute
- If buyer abandons, pixels released back into pool

---

## 3. Webhook Handler

Gumroad fires `POST` to our webhook on:
- `sale` (purchase completed)
- `refund` (refund issued)
- `dispute` (chargeback opened)
- `cancellation` (subscription canceled — N/A for us)

### Webhook security

Gumroad does **not** sign webhooks by default. Mitigations:
1. **Use a long, random URL path** as a shared secret: `/api/gumroad-webhook/<32-char-secret>`
2. **Verify sale_id via Gumroad API** (call `GET /v2/sales/:id` with our access token; if it 404s, drop the webhook)
3. **Allowlist Gumroad IPs** (current list: pull from their docs, refresh quarterly)
4. **Idempotency:** check `sale_id` in DB before processing; ignore duplicates

### Handler

```javascript
// api/v2/gumroad-webhook.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  // Verify path secret
  const secret = req.query.secret;
  if (secret !== process.env.GUMROAD_WEBHOOK_SECRET) return res.status(401).end();
  
  const { sale_id, email, price, custom_fields, product_permalink, refunded, disputed } = req.body;
  
  // Verify sale via API (anti-spoofing)
  const verified = await gumroad.getSale(sale_id);
  if (!verified || verified.product_permalink !== 'millionpixels') {
    await db.events.insert({ type: 'webhook_spoofed', metadata: req.body });
    return res.status(400).json({ error: 'Sale not verified' });
  }
  
  // Idempotency check
  const existing = await db.orders.findBySaleId(sale_id);
  if (existing && !refunded && !disputed) {
    return res.json({ ok: true, duplicate: true });
  }
  
  if (refunded) return handleRefund(sale_id, res);
  if (disputed) return handleDispute(sale_id, res);
  
  // New sale
  const claim_token = custom_fields?.claim;
  if (!claim_token) {
    // Customer bypassed our pre-checkout. Mark order as "needs manual resolution".
    await db.orders.insert({ sale_id, email, price_cents: price, status: 'needs_manual', raw: req.body });
    await alertOps('Gumroad order without claim_token', { sale_id, email });
    return res.json({ ok: true, needs_manual: true });
  }
  
  const claim = await db.claims.findByToken(claim_token);
  if (!claim) {
    await db.orders.insert({ sale_id, email, price_cents: price, status: 'expired_claim', raw: req.body });
    await alertOps('Gumroad order with expired claim', { sale_id, claim_token, email });
    return res.json({ ok: true, expired: true });
  }
  
  // Confirm pixels paid
  await db.pixels.markPaid(claim.pixels, sale_id, claim.email);
  await db.orders.insert({
    sale_id, email, price_cents: price,
    pixel_count: claim.pixels.length,
    claim_token,
    utm_source: claim.utm_source,
    status: 'paid',
    paid_at: new Date(),
  });
  await db.claims.markUsed(claim_token);
  
  // Referral commission
  if (claim.utm_source) {
    const commission_cents = Math.round(price * commissionRate(claim.utm_source) / 100);
    await db.referrals.creditCommission(claim.utm_source, sale_id, commission_cents);
  }
  
  // Realtime broadcast: new pixels live
  await broadcastPixelUpdate(claim.pixels);
  
  // Analytics
  await db.events.insert({
    type: 'purchase',
    metadata: { sale_id, email, pixel_count: claim.pixels.length, total_cents: price, utm_source: claim.utm_source },
  });
  
  res.json({ ok: true });
}
```

---

## 4. Test Plan

### End-to-end test (run before public launch)

1. Set up Gumroad test mode (or use a $0.01 test variant)
2. Pick 1 pixel on our site → claim flow
3. Pay $0.01 on Gumroad
4. Verify:
   - Webhook fires
   - Pixel marks paid in DB
   - Pixel appears on grid (realtime)
   - Email confirmation arrives from Gumroad
   - UTM commission credited (if `?utm_source=test123` was set)
5. Issue a refund in Gumroad dashboard
6. Verify:
   - Refund webhook fires
   - Pixel marked unpaid + released
   - Commission reversed
7. Repeat with bundle (10 pixels) and large bundle (100 pixels)
8. Test dispute: contact Gumroad support to simulate

### Load test

- 100 concurrent claim requests → no double-reservations
- Webhook handler throughput: 50/sec sustained
- Variant-update cron: must run under 30s end-to-end

---

## 5. Required Environment Variables

```bash
# .env additions
GUMROAD_ACCESS_TOKEN=...        # OAuth access token (Gumroad settings → Advanced → Apps)
GUMROAD_PRODUCT_ID=...          # numeric ID of "Million Pixels" product
GUMROAD_PRODUCT_PERMALINK=millionpixels
GUMROAD_WEBHOOK_SECRET=...      # random 32-char string, included in webhook URL
GUMROAD_VARIANT_IDS=...         # JSON map of qty → variant_id
PAYMENT_PROVIDER=gumroad        # 'gumroad' | 'stripe' (feature flag)
```

---

## 6. Activation Checklist

- [ ] Travis creates Gumroad account (or shares existing)
- [ ] Travis adds bank/PayPal payout info
- [ ] Travis verifies identity (Gumroad KYC)
- [ ] Tech Agent: create "Million Pixels" product + 7 variants
- [ ] Tech Agent: generate OAuth app + access token
- [ ] Tech Agent: deploy `/api/claim` + `/api/gumroad-webhook` endpoints
- [ ] Tech Agent: configure webhook URL in Gumroad dashboard
- [ ] Tech Agent: deploy `cron/escalator.js` (Vercel Cron, every 5 min)
- [ ] Revenue Agent: run end-to-end test with $0.01 variant
- [ ] Revenue Agent: smoke-test refund flow
- [ ] Revenue Agent: confirm UTM commission tracking works
- [ ] **GO/NO-GO call** before public launch

**ETA from "Travis hands over keys" → live in production: 2 hours.**

---

## 7. Feature flag for Stripe fallback

Keep v1 Stripe code in tree. Toggle with `PAYMENT_PROVIDER=stripe|gumroad`. Front-end checks `GET /api/config` for active provider. Allows clean A/B if we want it.

---

## 8. Known Gumroad limitations / risks

| Issue | Mitigation |
|-------|------------|
| No webhook signing | Path-secret + API verification |
| No native affiliate system | Our UTM cookie + referrals table |
| 10% fee vs Stripe 2.9% | Acceptable for launch; migrate when GMV justifies |
| Custom field char limit | Claim-token pattern |
| Variant prices not real-time dynamic | Cron + atomic patch every 5 min |
| Tax handled but adds latency to checkout | Acceptable |
| Gumroad payouts: weekly (Friday) | See payout schedule doc |
| Account hold risk on viral spike | Have Stripe backup ready (Sprint 2) |
