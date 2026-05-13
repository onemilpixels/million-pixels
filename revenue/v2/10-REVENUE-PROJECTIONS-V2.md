# Million Pixels — v2 Revenue Projection Model

**Companion:** `10-REVENUE-PROJECTIONS-V2.csv` (daily-level spreadsheet)
**Status:** Sprint 1 deliverable

---

## Headline

- **Target:** $1M revenue by Day 90 → **$11,111/day average**
- **At $1/pixel base** → **11,111 pixels/day** needed (pre-escalator)
- **Marketing budget:** $2,000 total (per brief)
- **v2 model hits $1M at Day ~55** in base case (per CSV) because escalator + bundles lift avg ticket faster than constant $1

---

## Daily Targets

| Phase | Days | Daily pixel target | Daily $ target | Cumulative $ at end |
|-------|------|-------------------:|---------------:|--------------------:|
| Launch | 1–7   | 500 → 2,500   | $425 → $2,350  | $9.3K  |
| Growth | 8–20  | 2,700 → 5,500 | $2,538 → $7,260 | $86.6K |
| Traction | 21–35 | 6,200 → 7,800 | $9,672 → $15,990 | $425K |
| Scale  | 36–60 | 8,500 → 9,300 | $20,145 → $37,758 | $1.28M |
| Climax | 61–90 | 9,300 → 3,200 | $40,392 → $24,224 | $2.37M |

Climax phase slows on pixel count but revenue stays high because per-pixel price is ~$7+.

---

## Marketing Spend Allocation ($2,000 total)

| Channel | Spend | Expected pixels driven | Expected $ revenue | CAC |
|---------|------:|----------------------:|-------------------:|----:|
| TikTok ads (UGC-style, $1/pixel hook) | $600 | 4,000 | $4,200 | $0.15/pixel |
| Reddit ads (r/InternetIsBeautiful, r/SideProject) | $400 | 2,500 | $3,000 | $0.16/pixel |
| Twitter/X ads | $400 | 2,000 | $2,400 | $0.20/pixel |
| Influencer micro-spots (3–5 creators @ $100–150) | $500 | 8,000 | $12,000 | $0.06/pixel |
| Press tools (HARO + 1 mo Notified.io) | $100 | (organic lift, not direct) | ~$5,000 indirect | n/a |

**Expected paid-channel ROI:** $26K revenue from $2K spend = **13x ROAS**. Conservative.

---

## Three Scenarios

### Base Case (what CSV reflects)

- Hits $1M at **Day ~55**
- Day 90: **$2.37M**
- Assumes: smooth growth, no viral moment, paid ads working at projected ROAS

### Bear Case (50% of base)

- Hits $1M at **Day ~95** (misses)
- Day 90: **~$850K**
- Trigger: weak launch, paid ads underperform, no press
- **Mitigation:** activate Stripe v1 model (longer ladder, more headroom)

### Bull Case (1.5x base)

- Hits $1M at **Day ~40**
- Day 90: **~$3.5M** (caps hit)
- Trigger: HN front page, celeb mention, news cycle
- **Mitigation:** raise hard cap from $10 to $20, lengthen escalator (every 10k instead of 5k) to avoid burning supply

---

## Unit Economics (v2)

| Metric | Value | Notes |
|--------|-------|-------|
| Avg order value (AOV) | $35 → $250 | Rises with escalator |
| Avg pixels per order | 25 | Bundle gravity at 10/50/100 |
| Conversion rate | 2.5–4% | Lower than v1 (less FOMO) but smoother |
| CAC (paid) | $5–8 per buyer | TikTok cheapest |
| LTV (repeat rate ~15%) | $50 | v2 buyers more single-purchase |
| Gumroad fee | 10% flat | vs Stripe 2.9% + $0.30 |
| Referral payout | 10–15% | UTM-based, monthly |
| Net margin after fees + payouts | ~72% | Worse than v1 (87%) due to Gumroad |

---

## Why v2 hits faster than v1

- v1 starts at $0.01/pixel → 1M pixels of cheap pricing eats first $3K of revenue
- v2 starts at $1.00/pixel → every pixel from minute 0 contributes meaningfully
- v2 escalator (+5%/5k) compounds faster than v1's discrete tier jumps for first 50k pixels

---

## Cash flow

- **Gumroad payouts:** Friday weekly (or daily once you've earned $1K total)
- **First payout:** Day 7 (assuming launch day = Day 0)
- **Reserve 5%** for refund buffer (rolling 30-day)
- **Reserve 30%** for tax (LLC pass-through, est. quarterly)
- **Pay referrals on 5th of next month** (matches Gumroad reconciliation)

---

## Daily KPIs (track in dashboard)

1. Pixels sold today / Cumulative
2. Revenue today / Cumulative / % to $1M
3. Current base price / Pixels to next escalator
4. Avg order value (rolling 7-day)
5. Conversion rate (visitors → purchases)
6. Top UTM source / Top referrer of week
7. Refund rate (30-day rolling)
8. Marketing spend → revenue attribution
