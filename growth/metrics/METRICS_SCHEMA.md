# Growth Metrics — Schema & Tracking

**Principle:** Track what we'll act on. Tracking metrics you won't change = waste.

---

## North-Star
**Pixels sold per day** (and the $1-to-$1 revenue equivalent). Everything else is a leading indicator.

## Daily Tracker (logged in `DAILY_METRICS.csv`)

### Top-line
- `date` (YYYY-MM-DD)
- `pixels_sold_today`
- `pixels_sold_cumulative`
- `revenue_today_usd`
- `revenue_cumulative_usd`
- `unique_buyers_today`
- `unique_buyers_cumulative`
- `avg_order_size_pixels`
- `refunds_today`
- `chargebacks_today`

### Traffic
- `site_visitors_today`
- `unique_visitors_today`
- `bounce_rate_pct`
- `avg_session_seconds`
- `signup_to_purchase_pct`

### Channel attribution (UTM-tagged)
- `visitors_by_source` (JSON: `{ "twitter": 1234, "reddit": 567, "discord": 89, "direct": 200, "partner_LEVELSIO": 50, ... }`)
- `purchases_by_source` (same shape)
- `revenue_by_source` (same shape)

### Discord
- `discord_members_total`
- `discord_members_joined_today`
- `discord_dau` (daily active = posted/reacted/voiced in last 24h)
- `discord_messages_today`
- `discord_voice_minutes_today`

### Twitter / X
- `twitter_followers_total`
- `twitter_followers_gained_today`
- `twitter_impressions_today`
- `twitter_engagements_today`
- `twitter_engagement_rate_pct`
- `twitter_profile_clicks_today`
- `twitter_link_clicks_today`

### Reddit
- `reddit_post_upvotes_total_today` (sum across our posts that have activity today)
- `reddit_post_comments_today`
- `reddit_dm_inquiries_today`

### Influencer Pipeline
- `outreach_sent_today`
- `outreach_responses_today`
- `outreach_in_talks_count`
- `partners_signed_total`
- `partners_signed_today`
- `partners_active_today` (partners whose code drove ≥1 sale)
- `partner_driven_revenue_today_usd`
- `partner_driven_pct_of_revenue`

### Referrals (organic ambassadors)
- `ambassadors_total` (anyone with ≥1 referral)
- `ambassadors_active_this_week`
- `referrals_today`
- `referred_revenue_today_usd`
- `referred_pct_of_revenue`
- `top_referrer_today_handle`
- `top_referrer_today_count`

### Engagement / Sentiment
- `support_tickets_opened_today`
- `support_tickets_closed_today`
- `avg_response_time_minutes`
- `nps_responses_today` (when surveys live)
- `nps_score`

---

## Weekly Roll-up (logged in `WEEKLY_REPORT.md` every Sunday)
- 7-day pixel sales total + DoD growth %
- 7-day revenue total + DoD growth %
- Channel mix shift WoW
- Top 5 wins
- Top 3 problems
- Top 3 experiments next week
- Cash-on-hand / runway implications (for Travis)

---

## Targets vs Actuals

| KPI | Day 7 | Day 14 | Day 30 | Day 60 | Day 90 |
|---|---|---|---|---|---|
| Pixels sold (cum) | 2,000 | 8,000 | 50,000 | 250,000 | 1,000,000 |
| Revenue (cum, $) | 2,000 | 8,000 | 50,000 | 250,000 | 1,000,000 |
| Partners signed | 5 | 25 | 100 | 150 | 200 |
| Partner-driven % | 5% | 15% | 30% | 35% | 40% |
| Discord members | 500 | 1,500 | 5,000 | 15,000 | 30,000 |
| Discord DAU | 50 | 150 | 1,000 | 3,000 | 6,000 |
| Twitter followers | 1,000 | 5,000 | 15,000 | 30,000 | 50,000 |
| DoD growth (rolling 7d) | 30% | 15% | 5% | 5% | 5% |
| Refund rate | <2% | <2% | <2% | <2% | <2% |
| Chargeback rate | <0.5% | <0.5% | <0.5% | <0.5% | <0.5% |

**Reality check on targets:** 1M pixels in 90 days = ~11,000/day average. That requires sustained viral pressure. If by Day 30 we're at 50K cum sold, we're tracking. If we're at 10K cum, we need to either (a) ship paid acquisition, (b) hard-pivot the partner deal economics, or (c) extend the timeline. Honest checkpoint.

---

## Daily Report Format (auto-post to #metrics-dashboard at 9pm PT)

```
🟪 MILLION PIXELS — DAY [N] METRICS

Pixels:  [today] today · [cum]/[1M] cum ([pct]%)
Revenue: $[today] today · $[cum] cum
DoD growth (7d rolling): [pct]%

Top channel today: [channel] ([visitors] visitors · [purchases] buyers)
Top partner today: [@handle] ([sales] sales)
Top referrer today: [@handle] ([refs] referrals)

Discord: [+joined] new members ([dau] DAU)
Twitter: [+followers] new followers ([impressions] impressions)

Tickets: [opened] opened / [closed] closed (avg resp [min]m)

Today's win: [note]
Tomorrow's focus: [note]
```

---

## Data Pipeline (target architecture)
- **Stripe** → webhook → DB (orders, refunds, chargebacks)
- **GA4 / Plausible** → API → daily snapshot
- **Twitter API** → daily snapshot
- **Discord bot** → daily snapshot
- **Reddit** → manual + scraped weekly
- **Partner tracking** → referral DB (codes → orders)
- Aggregator script writes to `DAILY_METRICS.csv` + posts the Discord report.

Until pipeline exists: manual CSV update by community manager at end of day. (See `DAILY_METRICS.csv` for the header row.)
