# Million Pixels — Pricing Model v2 (Simple Track)

**Owner:** Revenue Agent → Travis
**Status:** Sprint 1 deliverable, ready for activation
**Relationship to v1:** Alternative track. See `99-V1-VS-V2-RECONCILIATION.md` for the choice.

---

## TL;DR

Per Sprint 1 brief: a **simpler, more legible** pricing model than v1's 12-tier ladder.

- **1 pixel = $1** (base)
- **Bulk discounts:** 10 = $9 (10% off), 100 = $80 (20% off)
- **Dynamic escalator:** Every 5,000 pixels sold, base price rises +5%
- **Referral commission:** 10% of referred sales, tracked via UTM params
- **Sponsor add-ons** (separate from pixel sales) priced as tier menu

This model is **easier to communicate** ("just $1 a pixel!") and maps cleanly to **Gumroad's product-tier model** (variants), which has zero integration cost.

---

## 1. Core Price Curve

```
base_price(soldCount) = 1.00 * (1.05 ^ floor(soldCount / 5000))
```

| Pixels sold | Multiplier | Price/pixel |
|------------:|-----------:|------------:|
| 0           | 1.00x      | $1.00       |
| 5,000       | 1.05x      | $1.05       |
| 10,000      | 1.1025x    | $1.10       |
| 25,000      | 1.276x     | $1.28       |
| 50,000      | 1.629x     | $1.63       |
| 100,000     | 2.653x     | $2.65       |
| 200,000     | 7.040x     | $7.04       |
| 500,000     | 131.5x     | (cap engages — see §3) |

**Hard cap: $10.00/pixel.** Once `base_price > $10`, freeze at $10.

### Why compound +5%/5k

- Creates **continuous, gentle FOMO** — no scary cliff edges
- Average price across first 100k pixels ≈ $1.55 → predictable LTV math
- Self-limiting: by the time price would hit absurd levels, we've cleared $1M

### Cumulative revenue projection (no discounts, no cap)

| Pixels sold | Avg price | Cumulative revenue |
|------------:|----------:|-------------------:|
| 25,000      | $1.13     | $28.1K             |
| 50,000      | $1.36     | $67.8K             |
| 100,000     | $1.83     | $182.6K            |
| 200,000     | $3.42     | $683K              |
| **~250,000**| ~$4.00    | **~$1.0M** ✅       |
| 500,000     | ~$13.50   | $6.7M (cap kicks in) |

**Hits $1M at ~250K pixels sold (25% of grid). Target: 250K in 90 days = 2,778 pixels/day.**

This is **looser** than v1 (which needed 440K). Trade-off: v2 has lower avg price early but better scaling.

---

## 2. Bundle Discounts (per Sprint brief)

| Qty | Price | Per-pixel | Discount |
|----:|------:|----------:|---------:|
| 1   | $1.00 | $1.00     | 0%       |
| 10  | $9.00 | $0.90     | 10%      |
| 100 | $80.00| $0.80     | 20%      |

### Extension (filling gaps)

The brief specifies 1/10/100. To prevent weird arbitrage at 11 pixels = $11 > 10 pixels = $9, I extend smoothly:

| Bundle range | Per-pixel rate | Discount |
|-------------:|---------------:|---------:|
| 1–9          | $1.00 × base   | 0%       |
| 10–49        | $0.90 × base   | 10%      |
| 50–99        | $0.85 × base   | 15%      |
| 100–499      | $0.80 × base   | 20%      |
| 500–999      | $0.75 × base   | 25%      |
| 1,000+       | $0.70 × base   | 30%      |

**Floor:** Discount never reduces price below $0.50/pixel regardless of bundle. (Protects margin during early tiers.)

### Order math

```
price_per_pixel = max(0.50, base_price * bundle_multiplier)
order_subtotal  = qty * price_per_pixel
order_total     = order_subtotal  (taxes added by Gumroad)
```

**Mixed-tier handling:** If buying 100 pixels and base price changes mid-purchase (crossed a 5,000-pixel boundary), use the base price *at checkout creation time*. Don't try to split across boundaries — keeps it simple and matches Gumroad's static variant model.

---

## 3. Hard Price Cap

- Per-pixel price never exceeds **$10.00** before bundle discount
- Per-pixel price never drops below **$0.50** after bundle discount
- These bounds prevent absurd late-stage pricing and predatory bulk arbitrage

---

## 4. Referral / UTM Commission

**10% of referred pixel revenue**, paid out monthly.

### Tracking via UTM

Standard URL: `https://millionpixels.com/?utm_source=<referrer_id>&utm_medium=referral&utm_campaign=<campaign>`

- **First-touch attribution** with 30-day cookie window
- Stored in `localStorage` + sent as hidden field in Gumroad checkout (via custom redirect)
- Webhook reads the UTM cookie value, credits the referrer
- Self-referral blocked by email match + IP/device fingerprint

### Referrer tiers (cumulative monthly)

| Referred GMV (monthly) | Commission rate |
|-----------------------:|----------------:|
| $0–$1,000              | 10%             |
| $1,000–$10,000         | 12%             |
| $10,000+               | 15%             |

### Payout

- Min payout threshold: **$50**
- Paid via PayPal or Wise (we don't use Stripe Connect in v2 — see Gumroad spec)
- Monthly batch on the 5th of each month for prior month's earnings
- Refund clawback: if a referred purchase is refunded within 30 days, commission is reversed

---

## 5. Pricing Logic (server-side)

```javascript
// revenue/v2/pricing-v2.js
const BASE_PRICE_CENTS = 100;        // $1.00
const ESCALATOR_BPS = 500;           // +5% per step
const ESCALATOR_STEP = 5000;         // every 5,000 pixels
const PRICE_CAP_CENTS = 1000;        // $10.00 cap
const PRICE_FLOOR_CENTS = 50;        // $0.50 floor after discount

function basePriceCents(soldCount) {
  const steps = Math.floor(soldCount / ESCALATOR_STEP);
  const multiplier = Math.pow(1 + ESCALATOR_BPS / 10000, steps);
  return Math.min(PRICE_CAP_CENTS, Math.round(BASE_PRICE_CENTS * multiplier));
}

function bundleMultiplierBps(qty) {
  if (qty >= 1000) return 7000;   // 30% off → 70% of base
  if (qty >= 500)  return 7500;
  if (qty >= 100)  return 8000;
  if (qty >= 50)   return 8500;
  if (qty >= 10)   return 9000;
  return 10000;                   // no discount
}

function quoteOrder(soldCount, qty) {
  const base = basePriceCents(soldCount);
  const mult = bundleMultiplierBps(qty);
  const perPixel = Math.max(PRICE_FLOOR_CENTS, Math.round(base * mult / 10000));
  return {
    base_price_cents: base,
    per_pixel_cents: perPixel,
    qty,
    subtotal_cents: perPixel * qty,
    discount_pct: 100 - (mult / 100),
  };
}

module.exports = { basePriceCents, bundleMultiplierBps, quoteOrder };
```

---

## 6. Display rules

- Always show: **"Current price: $X.XX/pixel"** prominently at top of page
- Show: **"Next price increase at N,NNN pixels sold (X% rise)"**
- Show: live progress bar of pixels sold
- Show: bundle discount table on every product page
- Show: real-time recent-purchase ticker

---

## 7. Comparison to v1 at a glance

| Aspect | v1 (Stripe + 12 tiers) | v2 (Gumroad + 5% escalator) |
|--------|------------------------|------------------------------|
| Tiers | 12 fixed thresholds    | Continuous +5%/5k            |
| Min price | $0.01              | $1.00                        |
| Max price | $4.00              | $10.00 (capped)              |
| $1M at | 440K pixels (44%)     | 250K pixels (25%)            |
| Integration | Custom Stripe    | Gumroad SaaS (15 min setup)  |
| Time to live | Days 1–3        | **Hours 0–2**                |
| Commerce control | Full         | Limited (Gumroad UI)         |
| Recommended when | Long-term  | **Launch / validation phase**|

---

**See:** `09-GUMROAD-INTEGRATION.md` for activation steps.
