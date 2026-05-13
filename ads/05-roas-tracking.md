# 📊 ANALYTICS, CAC/LTV/ROAS TRACKING FRAMEWORK

## CORE METRICS (Definitions)

| Metric | Formula | Target |
|--------|---------|--------|
| CAC | Total ad spend ÷ new customers | <$2.50 |
| AOV | Total revenue ÷ orders | >$25 |
| LTV (30d) | Revenue per customer in 30d window | >$40 |
| ROAS | Revenue from ads ÷ ad spend | >10:1 |
| Conversion Rate | Purchases ÷ landing page visits | >3% (paid), >2% (organic) |
| CTR (paid) | Clicks ÷ impressions | >2% TikTok, >5% Google search, >1% Reddit |
| CPM | (Spend ÷ impressions) × 1000 | <$10 TikTok, <$5 Reddit |

## TRACKING INFRASTRUCTURE

### Must-Have Setup (Pre-Launch Paid)
1. **Google Analytics 4** — site-wide, all events
2. **TikTok Pixel** — base + custom events (view, add_to_cart, purchase)
3. **Google Ads Tag** — conversion tracking + enhanced conversions
4. **Reddit Pixel** — basic + custom events
5. **Server-side tagging** (GTM server-side) — for iOS 14+ tracking reliability
6. **UTM discipline** — every ad has source/medium/campaign/content tagged
7. **Stripe webhook** → push purchase events to all pixels server-side
8. **Customer.io or similar** — for retargeting list management

### Critical Events to Track
- `view_landing_page`
- `view_pixel_grid`
- `start_pixel_selection`
- `add_pixels_to_cart`
- `initiate_checkout`
- `purchase` (with value, currency, pixel_count, batch_price)
- `pixel_art_uploaded`
- `share_pixel` (social share)

## ROAS CALCULATION RULES

**Last-click attribution** for paid ads (Google, TikTok, Reddit native).
**Linear attribution** for cross-channel cohorts (GA4 model comparison).
**View-through window:** 1 day (TikTok), 1 day (Reddit), 1 day (Google Display). Search: click-only.
**Click window:** 7 days all platforms.

**Why this matters:** Organic + paid will overlap heavily. Use modeled attribution to avoid double-counting revenue.

**Truth-test method:** Run "incrementality holdout" — pause paid in one geo for 1 week each month, measure revenue delta. Real ROAS = (revenue with ads – revenue without ads) ÷ spend.

## DASHBOARD STRUCTURE

### Daily Dashboard (Auto-refreshed)
```
┌─────────────────────────────────────────────┐
│ MILLION PIXELS - DAY [X] OF 90              │
├─────────────────────────────────────────────┤
│ Revenue Today:        $X,XXX                │
│ Cumulative Revenue:   $XX,XXX / $1,000,000  │
│ % to Goal:            XX%                   │
│ Days Remaining:       XX                    │
│ Required Daily Run-Rate: $X,XXX             │
├─────────────────────────────────────────────┤
│ PAID PERFORMANCE                            │
│ Total Ad Spend Today:    $XXX               │
│ Total Ad Revenue Today:  $X,XXX             │
│ Blended ROAS:            X.X:1              │
│                                             │
│ TikTok:   Spend $XX | ROAS X:1 | CPA $X.XX │
│ Google:   Spend $XX | ROAS X:1 | CPA $X.XX │
│ Reddit:   Spend $XX | ROAS X:1 | CPA $X.XX │
├─────────────────────────────────────────────┤
│ ORGANIC PERFORMANCE                         │
│ Visitors Today:          X,XXX              │
│ Org. Conversion Rate:    X.X%               │
│ Top Traffic Source:      [Platform]         │
│ Viral Hit Today?:        [Yes/No]           │
├─────────────────────────────────────────────┤
│ ALERTS                                      │
│ • [Any ad set <3:1 ROAS]                    │
│ • [Any creative fatigued (>30% CTR drop)]   │
│ • [Conv. rate dropped vs 7d avg]            │
└─────────────────────────────────────────────┘
```

### Weekly Cohort Report
- New customers by source
- 7-day LTV by source
- 30-day LTV by source (rolling)
- Repeat purchase rate by source
- Average pixels per customer by source

## DECISION RULES (Automated where possible)

### Scale-Up Triggers
- Ad set ROAS >10:1 over 3 days + statistically significant (>50 conversions) → +50% budget
- Creative CTR >2x ad set avg → duplicate into new ad set, increase budget

### Kill Triggers
- Ad spend >$50, ROAS <3:1 → pause
- CTR <0.5% after 10,000 impressions → kill creative
- CPM >2x platform avg → check audience overlap, consider new targeting

### Pivot Triggers
- Blended ROAS <5:1 for 5 consecutive days → strategy review
- Landing page conv. rate <2% sustained → emergency CRO sprint
- Organic traffic <50% of paid sustained → reinvest in content team

## REPORTING CADENCE

| Frequency | Audience | Content |
|-----------|----------|---------|
| Hourly (Phase 2-3) | Internal | Auto-alerts on ROAS drops |
| Daily | Chief Orchestrator | Dashboard snapshot + 3 bullets |
| Weekly | All agents | Cross-channel performance + cohorts |
| Bi-weekly | Phase review | Strategy adjustments + budget shifts |

## SAMPLE WEEKLY REPORT TEMPLATE

```
WEEK [X] - ADS REPORT

REVENUE:
- This week: $X,XXX
- Last week: $X,XXX (+X%)
- Cumulative: $XX,XXX / $1M (XX%)

PAID:
- Spend: $X,XXX
- Revenue (attributed): $XX,XXX
- ROAS: X.X:1 (target 10:1)
- Best performer: [Platform/Campaign] @ X:1
- Worst performer: [Platform/Campaign] @ X:1 (action: [kill/optimize])

ORGANIC:
- Top viral hit: [Video] @ X views
- Top conversion source: [Platform]
- New influencer partnerships: X

LEARNINGS:
- [What worked]
- [What didn't]
- [What to test next week]

NEXT WEEK:
- [Budget shifts]
- [New tests planned]
- [Risks/dependencies]
```
