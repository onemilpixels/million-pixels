# Million Pixels — Pricing Tiers & Bundles

**Purpose:** Codify all discount logic, bundles, and tier rewards. Single source of truth.

---

## 1. Tier Price Schedule (from PRICING-MODEL.md)

Already defined. Summary:

| Tier | Pixels sold up to | Price/pixel |
|-----:|------------------:|------------:|
| 1    | 1,000             | $0.01       |
| 2    | 2,000             | $0.05       |
| 3    | 3,000             | $0.10       |
| 4    | 5,000             | $0.25       |
| 5    | 10,000            | $0.50       |
| 6    | 25,000            | $1.00       |
| 7    | 50,000            | $1.50       |
| 8    | 100,000           | $2.00       |
| 9    | 250,000           | $2.50       |
| 10   | 500,000           | $3.00       |
| 11   | 750,000           | $3.50       |
| 12   | 1,000,000         | $4.00       |

---

## 2. Bundle Discount Schedule

Applied to per-pixel price after tier calculation.

| Bundle name | Quantity | Discount | Extras |
|-------------|---------:|---------:|--------|
| Single      | 1–9      | 0%       | — |
| Starter     | 10–99    | 5%       | — |
| Block       | 100–999  | 10%      | Custom display name unlocked |
| Mega Block  | 1,000–9,999 | 20%   | Custom name engraving + leaderboard badge |
| Whale       | 10,000+  | 25%      | Bespoke region (pick coords) + press feature + founder thank-you |

### Examples
- Buying 50 pixels in Tier 5 ($0.50/px): 50 × $0.50 × 0.95 = **$23.75**
- Buying 500 pixels in Tier 7 ($1.50/px): 500 × $1.50 × 0.90 = **$675**
- Buying 1,200 pixels spanning Tier 7→8: (50 × $1.50 + 1150 × $2.00) × 0.80 = **$1,900**
  - Note: bundle discount applies to total, not per-tier

### Discount stacking rules
- Bundle discount: yes (auto-applied at qty thresholds)
- Promo codes: can stack with bundles, max combined 30% off
- Referral commission: paid on **post-discount** revenue
- Floor: total discount can't drop avg price below previous tier's price

---

## 3. Promo Codes (admin-issued)

For partnerships, influencers, press, recovery flows.

| Code type | Discount | Use case | Limit |
|-----------|----------|----------|-------|
| FRIEND10  | 10% off  | Friends & family pre-launch | 200 uses |
| PRESS25   | 25% off  | Press contacts | 50 uses, single-use per email |
| RECOVERY5 | 5% off   | Cart abandonment recovery (24h) | 1-use per email |
| INFL_<name>| custom (10–20%) | Influencer-specific tracking | tied to a referrer |

All codes:
- Single-use per email (configurable)
- Expire (configurable)
- Logged with reason in admin panel
- Auditable: every redemption traces back to creator

---

## 4. Buyer Recognition Tiers

(Mirrors leaderboard, but applied at purchase time, not periodically)

| Tier | Lifetime $ spent | Auto-perks |
|------|-----------------:|-----------|
| Pixel    | $1+      | Welcome email |
| Block    | $100+    | Custom display name + referral kit |
| Patch    | $500+    | Founder DM thank-you + early access to future drops |
| Region   | $2,500+  | Bespoke region selection + signed certificate (PDF) |
| Whale    | $10,000+ | Press feature + co-marketing post + 30% referral comm rate |
| Kraken   | $50,000+ | Custom co-branded canvas section + lifetime founder access |

Triggered automatically on each qualifying purchase webhook.

---

## 5. Referral Bonus Tiers

(From PRICING-MODEL.md, recapped)

| Monthly referred revenue | Commission rate |
|-------------------------:|----------------:|
| $0–$1K                  | 10% |
| $1K–$10K                | 12% |
| $10K–$50K               | 15% |
| $50K+                   | 20% |

Resets monthly. Cumulative perks (leaderboard badge, featured spot) persist.

---

## 6. Time-Limited Offers (Day 1–90 plan)

| Day | Offer | Goal | Limit |
|----:|-------|------|-------|
| 1–3 | Founder bonus: 2x referral commission first 72h | Launch buzz | All early referrers |
| 7   | "Week 1 milestone" — free 10 pixels for any $50+ buyer | Reward early supporters | First 200 |
| 14  | Refer-3 bonus: 50 free pixels if 3 friends purchase | Referral acceleration | Unlimited |
| 30  | "Tier 7 unlocked" — $1 off any bundle for 24h | Drive momentum at first wall | 24h |
| 60  | "Halfway party" — pixel art contest, $1K prize pool | Press/PR moment | One winner |
| 75  | "Final 250K" — Tier 10 launch announcement | FOMO climax | Single broadcast |
| 90  | "Million Pixel Day" celebration | Press + community | Whatever it takes |

---

## 7. Edge Case: Gift Purchases

Buyer enters recipient's email at checkout. Pixels transferred on payment. Both parties emailed. Bonus: gifter earns commission on future purchases from that recipient (10% in perpetuity, capped 12 months).

---

## 8. Implementation Notes

- All discount logic in single pure function: `calculatePrice(pixelIds, bundleQty, promoCode, currentTier)`
- Unit-test exhaustively — pricing bugs = revenue leaks or buyer rage
- Display breakdown transparently in checkout: tier × qty × discount × promo = total
- Store final price calc as JSONB on `purchases.price_breakdown` for audit
