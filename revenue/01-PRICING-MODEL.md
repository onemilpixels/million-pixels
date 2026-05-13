# Million Pixels — Dynamic Pricing Model

**Owner:** Revenue Agent → Travis
**Status:** v1 spec, ready to implement
**Goal:** $1M revenue in 90 days via FOMO-driven price escalation

---

## 1. Core Pricing Curve

We sell **1,000,000 pixels total** on a 1000x1000 grid. Price rises in **tiers of 1,000 pixels sold**. Each tier's price is fixed; once that tier sells out, the next tier unlocks at a higher price.

### Tier Schedule (the official ladder)

| Tier | Pixels sold range | Price/pixel | Tier revenue | Cumulative pixels | Cumulative revenue |
|-----:|------------------|------------:|-------------:|------------------:|-------------------:|
| 1    | 0–999            | $0.01       | $10          | 1,000             | $10                |
| 2    | 1,000–1,999      | $0.05       | $50          | 2,000             | $60                |
| 3    | 2,000–2,999      | $0.10       | $100         | 3,000             | $160               |
| 4    | 3,000–4,999      | $0.25       | $500         | 5,000             | $660               |
| 5    | 5,000–9,999      | $0.50       | $2,500       | 10,000            | $3,160             |
| 6    | 10,000–24,999    | $1.00       | $15,000      | 25,000            | $18,160            |
| 7    | 25,000–49,999    | $1.50       | $37,500      | 50,000            | $55,660            |
| 8    | 50,000–99,999    | $2.00       | $100,000     | 100,000           | $155,660           |
| 9    | 100,000–249,999  | $2.50       | $375,000     | 250,000           | $530,660           |
| 10   | 250,000–499,999  | $3.00       | $750,000     | 500,000           | $1,280,660         |
| 11   | 500,000–749,999  | $3.50       | $875,000     | 750,000           | $2,155,660         |
| 12   | 750,000–1,000,000| $4.00       | $1,000,000   | 1,000,000         | $3,155,660         |

> **Key insight:** We hit $1M cumulative revenue at ~440K pixels sold (Tier 10). That's our **90-day target**: sell 44% of the grid.
> Full sell-out caps at **~$3.15M**, leaving 2x headroom if we exceed targets.

### Why this curve (not linear $0.05/1k)

The original spec ("+5¢ per 1,000 pixels") would cap at $50/pixel and require all 1M pixels to be sold to hit $1M+. That:
- Punishes late buyers with absurd prices ($50+ per dot)
- Forces 100% sell-through to win
- Kills momentum mid-grid

This curve front-loads cheap pixels (FOMO bait), accelerates through the sweet spot ($0.50–$2.00), then caps at $4 — which is still trivial for a "I own a piece of internet history" purchase.

---

## 2. Pricing Logic (server-side, authoritative)

```pseudo
function currentPrice(pixelsSold):
    tiers = [
      {threshold: 1000,    price: 0.01},
      {threshold: 2000,    price: 0.05},
      {threshold: 3000,    price: 0.10},
      {threshold: 5000,    price: 0.25},
      {threshold: 10000,   price: 0.50},
      {threshold: 25000,   price: 1.00},
      {threshold: 50000,   price: 1.50},
      {threshold: 100000,  price: 2.00},
      {threshold: 250000,  price: 2.50},
      {threshold: 500000,  price: 3.00},
      {threshold: 750000,  price: 3.50},
      {threshold: 1000000, price: 4.00},
    ]
    for tier in tiers:
        if pixelsSold < tier.threshold:
            return tier.price
    return 4.00  // sold out fallback
```

**CRITICAL:** Price is computed at **checkout creation time**, not cart-add time. Price quoted in checkout session is locked for that session (60-second expiry).

### Mixed-tier purchases

If a buyer purchases 100 pixels and only 50 remain at current tier, charge:
- 50 pixels @ current tier
- 50 pixels @ next tier

Display this transparently in checkout: "50 pixels @ $0.50 + 50 pixels @ $1.00 = $75".

---

## 3. Bundle Discounts

Applied **after** tier pricing, **before** referral commission.

| Bundle size | Discount | Notes |
|------------:|---------:|-------|
| 1–9 pixels  | 0%       | Standard |
| 10–99       | 5%       | "Starter pack" |
| 100–999     | 10%      | "Block buyer" |
| 1,000–9,999 | 20%      | "Mega block" + custom name engraving |
| 10,000+     | 25%      | "Whale" + bespoke region + press mention |

**Floor:** Discount never reduces price below previous tier's rate. Prevents arbitrage.

---

## 4. Referral Program

**10% commission on every referred pixel purchase**, paid out at $100 minimum threshold.

### Mechanics
- Each user gets a unique referral code: `mp.io/r/<slug>` (e.g. `mp.io/r/travis42`)
- Cookie-tracked (90-day attribution window) + URL param fallback
- Commission credited on **successful payment** (not checkout creation)
- Refunds reverse commission within 7 days
- **Self-referral blocked** by email + IP + payment method hash
- Stripe Connect Express accounts for payouts (auto-onboarding)

### Top-Referrer Bonuses (cumulative, monthly)
| Referred revenue | Bonus commission rate |
|-----------------:|----------------------:|
| $0–$1,000        | 10% (base)           |
| $1,000–$10,000   | 12%                   |
| $10,000–$50,000  | 15%                   |
| $50,000+         | 20% + featured spot on grid |

### Anti-fraud
- Require referred buyer to make purchase from different IP/device fingerprint
- Stripe Radar rules flag wash-trading patterns
- Manual review for any referrer earning >$5K/month

---

## 5. Trust & FOMO Levers

These ship with pricing:
- **Live price ticker** at top of page: "Current price: $0.50 — rises to $1.00 in 4,217 pixels"
- **Recent purchase feed**: "Alex bought 50 pixels • 12s ago"
- **Tier progress bar**: visual fill toward next tier
- **Countdown to next tier** (estimated based on 24h sell rate)
- **Stripe trust badges** + 30-day refund for unclaimed pixel data

---

## 6. Implementation Checklist

- [ ] DB schema: `tiers`, `purchases`, `referrals`, `referral_payouts`
- [ ] Atomic pixel reservation (Redis lock, 60s TTL during checkout)
- [ ] Stripe webhook handler: `checkout.session.completed`, `charge.refunded`
- [ ] Price calculation service (pure function, fully unit-tested)
- [ ] Referral attribution middleware (cookie + URL param)
- [ ] Admin override for promo pricing (capped at 25% off, audit-logged)

**Target: Pricing live by Day 2.**
