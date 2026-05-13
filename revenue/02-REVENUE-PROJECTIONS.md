# Million Pixels — 90-Day Revenue Projection Model

**Target:** $1,000,000 revenue by Day 90
**Mechanism:** Sell ~440,000 pixels across escalating price tiers

---

## 1. Headline Numbers

| Milestone | Day | Pixels sold | Cumulative revenue | Current price |
|-----------|----:|------------:|-------------------:|--------------:|
| Launch    | 0   | 0           | $0                 | $0.01         |
| PoC       | 7   | ~5,000      | ~$1,000            | $0.50         |
| Traction  | 20  | ~25,000     | ~$18,000           | $1.50         |
| **Day 30**| 30  | **~50,000** | **~$55,000**       | $2.00         |
| Momentum  | 45  | ~100,000    | ~$155,000          | $2.50         |
| **Day 60**| 60  | **~200,000**| **~$405,000**      | $2.50         |
| Press     | 75  | ~325,000    | ~$717,000          | $3.00         |
| **Day 90**| 90  | **~440,000**| **~$1,047,000** ✅ | $3.00         |

> Hits $1M at **Day ~88** in base case. 4-day buffer.

### Reconciling with original spec
Original targets assumed flat $1 avg pricing. Our tier model has lower avg early (cheap pixels = FOMO) and higher avg later. Net result: **harder Day 30 ($55K vs $30K target — overshoots), same Day 90 ($1M).** Day 60 target ($150K) is exceeded substantially (~$405K) because tier 9 ($2.50) compounds fast.

---

## 2. Daily Pixel-Sale Targets (3 scenarios)

### Base Case (90% confidence — what we plan for)

| Phase | Days | Daily pixels avg | Daily revenue avg |
|-------|------|-----------------:|------------------:|
| Launch hype | 1–7   | 715      | $140  |
| Growth      | 8–20  | 1,540    | $1,300 |
| Scale       | 21–30 | 2,500    | $3,700 |
| Acceleration| 31–60 | 5,000    | $11,700 |
| Climax      | 61–90 | 8,000    | $21,400 |

### Bear Case (50% of base) — $500K at Day 90
Stalls in Tier 8. Trigger: weak launch + no press. Action: aggressive paid ads, influencer pushes.

### Bull Case (1.5x base) — $1.6M at Day 90
Viral moment in week 2–3. Trigger: HN front page, celebrity tweet, news cycle. Action: scale infra, raise tier prices on schedule (don't slow down).

---

## 3. Channel-Level Revenue Mix (Day 90 target)

| Channel              | % of revenue | $ contribution | CAC budget |
|----------------------|-------------:|---------------:|-----------:|
| Organic / direct     | 20%          | $200K          | $0         |
| Referrals (10% comm.)| 35%          | $350K          | $35K (paid out) |
| Paid social (TikTok, X, Reddit) | 25% | $250K     | $50K (~20% CAC) |
| Press / PR           | 12%          | $120K          | $5K (PR tools) |
| Influencer / partnerships | 8%       | $80K           | $15K       |

**Total marketing spend budget:** $105K → 10.5% of revenue. Leaves **~85% gross margin** after Stripe fees (~2.9%) and referral payouts.

---

## 4. Unit Economics

| Metric | Target | Notes |
|--------|-------:|-------|
| Avg order value (AOV) | $35 → $200 | Rises with tiers + bundles |
| Conversion rate (visitor → buyer) | 2.5% → 5% | Improves as FOMO compounds |
| CAC (blended) | $8 | Paid only; organic = $0 |
| LTV (avg buyer) | $45 (single tier) → $180 (multi-purchase) | ~25% repeat buyer rate |
| LTV:CAC | 5.6x → 22x | Healthy at any tier |
| Gross margin | 87% | After Stripe + payouts |
| Net margin (post-marketing) | 65–75% | After paid ad spend |

---

## 5. Sensitivity Analysis

What moves the needle most:

| Lever | Impact on Day-90 revenue | Cost |
|-------|--------------------------|------|
| +1% conversion rate | +$200K | Landing page A/B tests |
| +1 viral moment (HN/TikTok) | +$300–500K | $0–5K PR push |
| Top 10 referrer activation | +$150K | $30K commissions |
| Tier 9 price bumped to $3 | +$50K | Pricing change |
| Slow week 1 (no launch hype) | -$200K | Mitigate w/ paid spend |

**The single biggest risk:** flat week 1. If we don't sell 5,000 pixels by Day 7, the FOMO ladder doesn't ignite. **Mitigation:** pre-sell 2,000 pixels to friends/community at $0.01 before public launch.

---

## 6. Cash Flow Notes

- Stripe payouts: 2-day rolling (standard) or instant ($0.15 + 1% fee)
- Referral payouts: monthly batch on the 5th, min $100 balance
- Reserve 5% of gross for refund buffer (90-day window)
- Reserve 30% of net for tax (LLC pass-through, est. quarterly)

**Recommended:** open dedicated Stripe + business checking. Don't comingle.
