# Million Pixels — Influencer Commission Tracking System

**Owner:** Revenue Agent → Tech Agent for build
**Status:** Sprint 2 deliverable
**Goal:** Track, attribute, and pay out commissions to creators with zero manual reconciliation.

---

## Two Commission Programs

### 1. Standard Referral Program (anyone)

Anyone with a `referral_code` (auto-generated per buyer) earns **10–15%** on referred sales.

- Tracked via `referrals` table (already in schema)
- Self-serve dashboard at `/me/referrals`
- See pricing doc §4 for tier rates

### 2. Influencer Affiliate Program (vetted creators)

Hand-picked creators with elevated terms.

- **Custom UTM codes** (`utm_source=chloe_tiktok` instead of random slug)
- **Higher base commission**: 15% (vs 10% standard)
- **Performance bonuses**: cash bonus at GMV milestones
- **Promo discount codes**: their followers get 5% off (deducted from creator commission OR added cost)
- **First-touch attribution** with 60-day cookie (longer than standard 30d)
- **Net-15 payouts** instead of monthly batch
- **Direct relationship** — Slack DM, not just email

---

## Database Schema

```sql
create table influencers (
  id bigserial primary key,
  handle text not null,                    -- "chloe_tiktok"
  display_name text not null,              -- "Chloe (TikTok)"
  email text not null,
  utm_source text unique not null,         -- maps to ?utm_source=...
  commission_bps int not null default 1500, -- 15.00%
  promo_code text unique,                  -- "CHLOE5" — 5% off for fans
  promo_discount_bps int default 500,      -- 5%
  promo_cost_split text default 'creator', -- 'creator' | 'company' | 'split'
  payment_method text not null,            -- 'paypal' | 'wise' | 'stripe-connect'
  payment_handle text not null,            -- email/handle for payouts
  payout_frequency text default 'monthly', -- 'monthly' | 'net15' | 'instant'
  status text default 'active',            -- 'active' | 'paused' | 'terminated'
  notes text,
  signed_agreement_url text,
  created_at timestamptz default now()
);

create table influencer_promos (
  id bigserial primary key,
  influencer_id bigint references influencers(id),
  code text not null,
  discount_bps int not null,
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int,
  uses_count int default 0,
  unique (code)
);

create table commission_credits (
  id bigserial primary key,
  influencer_id bigint references influencers(id),
  sale_id text not null references orders(sale_id),
  sale_amount_cents int not null,
  commission_cents int not null,
  promo_code_used text,
  promo_discount_cents int default 0,
  earned_at timestamptz default now(),
  reversed boolean default false,
  reversed_at timestamptz,
  reversal_reason text
);

create table commission_payouts (
  id bigserial primary key,
  influencer_id bigint references influencers(id),
  amount_cents int not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text default 'pending',           -- 'pending' | 'sent' | 'failed' | 'reconciled'
  sent_at timestamptz,
  payment_method text,
  payment_reference text,                  -- PayPal txn ID, etc.
  notes text,
  created_at timestamptz default now()
);

create unique index commission_payouts_period_idx 
  on commission_payouts (influencer_id, period_start, period_end);

create index commission_credits_inf_idx 
  on commission_credits (influencer_id, earned_at desc);
```

---

## Attribution Flow

```
1. Creator shares: https://millionpixels.com/?utm_source=chloe_tiktok&utm_campaign=launch
2. Visitor lands on site
3. JS:
   - Parses UTM params
   - Stores { utm_source, utm_campaign, first_seen_at } in localStorage (60-day TTL)
   - Stores in cookie as well (in case localStorage cleared)
   - Sets utm_source as hidden form field on checkout
4. Visitor adds pixels, enters email, clicks "buy"
5. Pre-checkout (POST /api/claim) sends utm_source in payload
6. We persist utm_source on the claim record
7. Buyer pays on Gumroad/Stripe
8. Webhook handler:
   - Looks up influencer by utm_source
   - If found: insert commission_credits with commission_bps
   - If not found: insert as standard referral
9. Dashboard reflects new commission immediately
```

### Promo code path (alternative)

If buyer enters promo code `CHLOE5` at checkout:

1. We look up `influencer_promos` table
2. If valid + active + uses_left > 0:
   - Apply discount (5% off)
   - Increment `uses_count`
   - Set utm_source = influencer's utm_source even if not in URL
   - Set `promo_code_used` on commission credit
3. Webhook attributes commission to that influencer

---

## Commission Calculation

```javascript
// Standard
commission_cents = Math.round(sale_amount_cents * influencer.commission_bps / 10000);

// With promo (creator-cost split): creator absorbs the discount cost
if (promo_cost_split === 'creator') {
  commission_cents = Math.round((sale_amount_cents - promo_discount_cents) * commission_bps / 10000);
}

// With promo (company-cost split): company eats the discount
if (promo_cost_split === 'company') {
  commission_cents = Math.round(original_amount_cents * commission_bps / 10000);
}

// 50/50 split
if (promo_cost_split === 'split') {
  commission_cents = Math.round(
    (sale_amount_cents - promo_discount_cents / 2) * commission_bps / 10000
  );
}
```

Default: `creator` (their discount, their cost) — keeps incentives clean and protects company margin.

---

## Performance Bonuses (manual, configurable)

| GMV milestone (lifetime) | Bonus | Notes |
|------------------------:|------:|-------|
| $1,000               | $50    | First-blood bonus |
| $5,000               | $250   | Mid-tier creator unlock |
| $10,000              | $500   | Featured spotlight on site |
| $25,000              | $1,500 | Custom thank-you + perks |
| $50,000              | $3,000 | Profit-share consideration |
| $100,000+            | TBD    | Direct deal renegotiation |

Tracked via a cron job that compares `sum(commission_credits.sale_amount_cents)` per influencer against milestones; auto-creates a bonus `commission_credit` entry when crossed.

---

## Payout Workflow

### Standard referrals (monthly batch)

- **When:** 5th of each month, for prior month
- **Min threshold:** $50 USD
- **Method:** PayPal (auto, via PayPal Payouts API) or Wise (manual)
- **Carryover:** Balances <$50 roll over to next month

### Influencer payouts (Net-15)

- **When:** 15 days after end of weekly period
- **Min threshold:** $0 (always pay something to keep relationship warm)
- **Method:** Per influencer record's `payment_method`
- **Cron:** Every Monday at 09:00 PT, evaluates eligible payouts, queues sends

### Payout job

```javascript
// cron/influencer-payouts.js
async function runPayouts() {
  const now = new Date();
  const eligible = await db.influencers.findActiveDueForPayout(now);
  for (const inf of eligible) {
    const period_start = lastPaidThrough(inf);
    const period_end = now;
    const credits = await db.commission_credits.between(inf.id, period_start, period_end);
    const amount = credits
      .filter(c => !c.reversed)
      .reduce((s, c) => s + c.commission_cents, 0);
    if (amount < 1) continue;
    if (amount < inf.min_threshold_cents) continue;

    const payout = await db.commission_payouts.insert({
      influencer_id: inf.id, amount_cents: amount,
      period_start, period_end, status: 'pending',
    });

    try {
      const ref = await sendPayment(inf, amount);
      await db.commission_payouts.update(payout.id, {
        status: 'sent', sent_at: new Date(),
        payment_method: inf.payment_method, payment_reference: ref,
      });
      await emailReceipt(inf, payout, credits);
    } catch (e) {
      await db.commission_payouts.update(payout.id, {
        status: 'failed', notes: e.message,
      });
      await alertOps(`Payout failed for ${inf.handle}: ${e.message}`);
    }
  }
}
```

---

## Influencer-facing Dashboard

URL: `https://millionpixels.com/creator/dashboard?token=<creator-token>`

Shows:

- **Total earned** lifetime + this month
- **Pending payout** (next payout date)
- **Last 5 payouts** with status
- **Conversion stats** — clicks, conversions, conversion rate (last 30 days)
- **Top campaigns** — break out by `utm_campaign`
- **Promo code stats** — uses, GMV from promo, commission earned from promo
- **Quick share** — pre-built UTM links for their preferred platforms

(Read-only. No editing without admin approval.)

---

## Onboarding new influencers

### Self-serve application

`/creator/apply` form:

- Handle, social URLs, audience size, audience demo
- Why interested
- Preferred payout method

### Admin review (manual, 48h SLA)

- Verify follower count is real (not bot farm)
- Check audience-fit
- Approve → auto-create `influencers` row + email welcome with links + promo code

### Welcome email

```
Subject: You're in! Here are your Million Pixels links

Hey {handle},

You're approved for the Million Pixels creator program. Here's everything you need:

📊 Your dashboard: https://millionpixels.com/creator/dashboard?token={token}
🔗 Your tracking link: https://millionpixels.com/?utm_source={utm_source}
🎟️  Your promo code (5% off for fans): {promo_code}
💰 Your commission: 15% on every sale
📅 Payouts: every 2 weeks (Net-15), via {payment_method}

Recommended copy/hooks for your videos (pick one):
- "I bought 100 pixels for $80 — they're going to be worth $XXX by Day 90"
- "There are 1 million pixels and the price doubles every month — here's why"
- "Tag your friends who want to own internet history"

We'll DM you when you hit your first $1K. Questions: travis@millionpixels.com.

— Travis
```

---

## Anti-fraud

- **Self-referral block:** influencer's own email/IP can't be a referred buyer
- **Wash-trade detection:** flag if >30% of an influencer's GMV comes from <3 unique IPs
- **Refund clawback:** if referred sale is refunded within 30 days, commission is reversed
- **Chargeback clawback:** lost dispute = commission clawed back, deducted from next payout
- **Manual review threshold:** any influencer earning >$5K/month triggers a quarterly audit
- **Termination clause:** in agreement; we can pause/end relationship for fraud or ToS violations

---

## Initial Influencer Roster (target Day 0–30)

Travis to recruit (3–5 micro-creators @ $100–150 base + commission):

- 2 TikTok creators in tech/finance/internet-nostalgia niche (5k–50k followers)
- 1 Twitter/X creator in startup/indie hacker space
- 1 YouTube creator (Tom Scott-adjacent — internet curiosities)
- 1 Reddit power-user / mod (for organic posts)

Budget: $500 base + commissions = $2K total initial outlay.
