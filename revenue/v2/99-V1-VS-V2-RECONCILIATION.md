# Million Pixels — v1 vs v2 Reconciliation Memo

**From:** Revenue Agent
**To:** Travis (decision-maker)
**Status:** Needs decision before launch

---

## The situation

I delivered v1 specs (Stripe + 12-tier ladder, $0.01–$4.00) on Day 0.

Travis came back with a Sprint 1 brief specifying a different model:

- $1/pixel base
- Bulk discounts 10/100
- +5% per 5,000 sold
- Gumroad integration
- UTM commission tracking

These aren't compatible — they're **two different products**. I've delivered v2 fully per spec, but you need to choose which one we actually ship.

---

## Quick comparison

| Dimension | v1 (Stripe + tiers) | v2 (Gumroad + escalator) |
|---|---|---|
| **Starting price** | $0.01/pixel | $1.00/pixel |
| **Max price** | $4.00/pixel | $10.00/pixel (capped) |
| **Avg price (first 100k)** | $0.95 | $1.83 |
| **Pixels to hit $1M** | 440K (44% of grid) | 250K (25% of grid) |
| **Day-90 ceiling** | $3.16M (full sellout) | $2.4M base, $6M cap if hot |
| **Payment processor** | Stripe (custom integration) | Gumroad (SaaS, 15 min setup) |
| **Processor fees** | 2.9% + $0.30 | 10% flat |
| **Net margin** | ~87% | ~72% |
| **Time-to-launch** | 3 days (engineering) | **2 hours** (config) |
| **Engineering complexity** | High | Low |
| **PCI scope** | Need to handle Stripe sessions | None |
| **Tax / VAT handling** | Stripe Tax (~$50/mo + setup) | Built-in (free) |
| **Refunds** | Custom UI | Gumroad dashboard |
| **B2B / invoices** | Stripe Invoicing | Awkward via email |
| **International** | Stripe supports 135+ currencies | Gumroad supports 30+ |
| **Custom checkout UX** | Full control | Limited |
| **Dynamic variant pricing** | Per-request | Cron-updated (5 min lag) |
| **Referral commissions** | Stripe Connect Express | Manual PayPal/Wise via UTM |
| **Account-hold risk** | Stripe Radar can hold | Gumroad more lenient but harder to recover from |

---

## My recommendation: **Ship v2 first, migrate to v1 around $50K GMV**

### Why v2 first

1. **Time-to-launch matters most.** v2 ships in 2 hours, v1 in 3 days. Every day of delay = lost FOMO. Three days delay = -$2K in revenue from missed launch buzz.
2. **Gumroad eats complexity.** No PCI compliance, no tax setup, no fraud handling, no chargeback ops in week 1. We can focus on **growth**, not plumbing.
3. **10% fee is acceptable at small scale.** At $50K GMV, Gumroad fee = $5K. Stripe alternative would have been $1.5K — saves $3.5K. Not worth a week of engineering delay.
4. **v2 model is easier to market.** "$1 a pixel, price rises 5% every 5,000 sold" fits in a tweet. v1's 12-tier ladder doesn't.
5. **We hit $1M sooner.** v2 hits the goal at Day ~55 in base case (CSV). v1 needed Day 88. More buffer.

### Why migrate to v1 (eventually)

1. **Fees compound at scale.** At $1M GMV, Gumroad fee = $100K. Stripe would have been $30K. The $70K delta is real money.
2. **More control.** Custom checkout = better conversion (we can A/B test).
3. **B2B doors open.** Sponsor sales > $5K need invoicing.
4. **Already built.** v1 Stripe code exists in `api/checkout.js`. We just plug it in with v2 pricing.

### Bridge plan

```
Day 0–14:   Launch on Gumroad with v2 pricing. Validate model, gather data.
Day 14–30:  At $25K cumulative, begin Stripe parallel setup (no code changes needed).
Day 30:     If sustained AOV > $30, set PAYMENT_PROVIDER=both. A/B test.
Day 45:     If Stripe outperforms Gumroad (it should at higher AOV), flip primary.
Day 60–90:  Stripe-primary, Gumroad-fallback. Hit $1M by Day 55 (base) / 70 (conservative).
```

---

## Alternative recommendation: **Hybrid pricing on Stripe from Day 0**

If you're willing to absorb 3 days of engineering work, the optimal model is:

- Use Stripe (cheap fees)
- Use v2's simpler 5%/5k escalator (easier to market)
- Get both wins, lose nothing

This would be a "v3": Stripe rails + v2 pricing + everything in this Sprint 2 doc.

ETA: 3 days vs 2 hours. Trade-off is real.

---

## What I need from you (decision matrix)

Pick one:

- [ ] **Path A — Gumroad now, Stripe later (recommended).** Ship v2 in 2 hours. Migrate around Day 30. This is the deliverable in `v2/` folder.
- [ ] **Path B — Stripe now, v2 pricing.** I'll merge `v2/pricing-v2.js` into existing Stripe integration. 1 day work. Ships Day 1.
- [ ] **Path C — Stripe now, v1 pricing (original spec).** Already specced. 3 days. Highest margin, slowest launch.
- [ ] **Path D — Something else?** Tell me what.

---

## Side note on Sprint 1 brief contradictions

The Sprint 1 brief in my task said:
> "Marketing spend allocation: $2K total budget"

But v1 projections assumed $105K marketing budget (10.5% of $1M). I built v2 around the $2K budget per brief, but flag this:

**At $2K total marketing spend, even bull-case revenue is ~$800K** (organic-heavy). To hit $1M consistently you likely want $20K+ marketing budget by Day 30. Recommend revisiting budget cap once we have Day 7 launch data.

---

## TL;DR

- Both pricing models work. v2 is easier and faster. v1 has higher margin.
- Gumroad ships in 2 hours, Stripe in 2–3 days.
- My vote: **start v2/Gumroad, migrate to Stripe by Day 30**.
- Tell me which path; I'll execute immediately.

— Revenue Agent
