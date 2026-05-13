# Million Pixels — Analytics & Dashboard Spec

**Goal:** Real-time visibility into revenue, conversions, and momentum. Live by Day 3.

---

## 1. Dashboard Layout (v1)

```
┌─────────────────────────────────────────────────────────────┐
│ MILLION PIXELS REVENUE DASHBOARD              [refresh: 30s] │
├─────────────────────────────────────────────────────────────┤
│ TODAY: $4,217  (+18% vs yesterday)    GOAL DAY 30: $30K      │
│ TOTAL: $48,950 / $1,000,000 (4.9%)    DAYS LEFT: 65          │
│ ON-PACE: ✅ ahead by $3,200                                  │
├──────────────────┬──────────────────┬───────────────────────┤
│ PIXELS SOLD      │ AVG PIXEL VALUE  │ CONVERSION RATE       │
│ 32,150 (3.2%)    │ $1.52            │ 3.4% (target: 2.5%)   │
│ Today: 1,240     │ Today: $1.89     │ 24h: 3.8%             │
├──────────────────┴──────────────────┴───────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ REVENUE — Last 30 days (line chart)                     │ │
│ │   With overlay: target line + tier transition markers   │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ CURRENT TIER: 7 ($1.50/px)   NEXT TIER IN: 17,850 pixels    │
│ Tier progress: ████████░░░░░░░░░░░░░░░░░░░░░░░  28%         │
├──────────────────────────┬──────────────────────────────────┤
│ TOP REFERRERS (24h)      │ TOP BUYERS (24h)                 │
│ 1. @alice    $1,240      │ 1. anon-7f3a   $890              │
│ 2. @bob      $890        │ 2. @sarah      $620              │
│ 3. @carol    $670        │ 3. anon-2c1b   $450              │
│ ... see full leaderboard │ ... see full leaderboard         │
├──────────────────────────┴──────────────────────────────────┤
│ TRAFFIC (24h)            │ FUNNEL (24h)                     │
│ Visitors: 8,420          │ Visit → Grid: 78%                │
│ Sessions: 9,840          │ Grid → Checkout: 12%             │
│ Bounce: 42%              │ Checkout → Paid: 68%             │
├──────────────────────────┴──────────────────────────────────┤
│ ALERTS                                                       │
│ ⚠ Refund rate 6.2% (above 5% threshold)                      │
│ 📈 Conversion +0.8% vs 7d avg                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Metrics (track all, surface most)

### Revenue
- **Total revenue** (lifetime)
- **Revenue today** (rolling midnight PT)
- **Revenue this hour** (rolling)
- **Revenue by source** (organic / referral / paid ad UTM / direct)
- **Revenue by tier** (which tier generated the most $?)
- **MRR-equivalent**: revenue per day, 7d rolling avg
- **Revenue vs target** (cumulative + daily pace)

### Pixels
- **Pixels sold total / today / this hour**
- **Pixels available** (1,000,000 − sold − locked)
- **Pixels locked in active checkouts** (Redis count)
- **Avg pixel value** (revenue / pixels sold, lifetime + today)
- **Largest single purchase** (today, all-time)
- **Geographic distribution** (heatmap of buyer countries)

### Conversion
- **Visitor → buyer** (sessions / unique purchases)
- **Grid view → checkout started** (Stripe Checkout Sessions created / grid loads)
- **Checkout started → paid** (sessions completed / sessions created)
- **Cart abandonment rate** (sessions expired / sessions created)
- **Time-to-purchase** (median seconds from landing → paid)

### Referrals
- **Total referrers active** (>= 1 conversion)
- **Top 10 referrers** (by revenue driven, today + lifetime)
- **Referral revenue share** (% of total)
- **Commission paid out** (lifetime, this month, pending)
- **Avg revenue per referrer**
- **Self-referral attempts blocked** (fraud signal)

### Customer
- **Unique buyers total**
- **Repeat buyer rate** (% of buyers with 2+ purchases)
- **Customer Acquisition Cost (CAC)** = ad spend / new buyers
- **Lifetime Value (LTV)** = total revenue / unique buyers
- **LTV:CAC ratio**
- **Avg order value (AOV)** = revenue / number of orders

### Operational
- **Refund rate** (24h, 7d, 30d)
- **Dispute rate** (30d)
- **Payment decline rate**
- **Stripe webhook lag** (event time → processed time, p50/p95/p99)
- **Reconciliation drift** (Stripe records − DB records)
- **API error rate** (5xx responses)

---

## 3. Data Pipeline

```
[Web app + API] → events → [Postgres] (source of truth)
                        ↓
                  [PostHog] (product analytics, funnels, A/B tests)
                        ↓
                  [Grafana / Metabase] (operator dashboard)
                        ↓
                  [Public stats page] (live counters, transparency play)
```

### Recommended stack
- **Postgres** — primary OLTP, all purchases/referrals
- **PostHog** (self-host or cloud) — product analytics, funnels, session replay
- **Metabase** — SQL-driven internal dashboards (free)
- **Plausible** or **Fathom** — privacy-friendly page analytics (no GDPR cookie banner)
- **Slack/Discord webhook** — alerts + daily summary

### Event schema (events table)
```sql
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,    -- 'pageview', 'pixel_select', 'checkout_start', 'purchase', etc.
  user_id TEXT,                 -- anonymous_id or auth user
  session_id TEXT,
  referral_code TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  properties JSONB,             -- event-specific (price, pixel_ids, etc.)
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash TEXT,
  user_agent TEXT
);
CREATE INDEX ON events (event_type, occurred_at);
CREATE INDEX ON events (user_id, occurred_at);
CREATE INDEX ON events USING GIN (properties);
```

---

## 4. Public-Facing Stats (transparency = FOMO fuel)

Show these on `/stats` page (live, no auth):
- Total pixels sold (big number, animated counter)
- Current price (with countdown to next tier)
- Pixels sold in last 60 minutes
- Last 10 purchases (anonymized: "🟢 25 pixels purchased • 4s ago")
- Top 5 referrers (opt-in display names)
- Tier progress bar

**Why public:** social proof + FOMO + organic shares ("look how fast it's selling").

---

## 5. Daily Revenue Report (auto-posted)

Posted to Slack/Discord at 09:00 PT every morning:

```
📊 Million Pixels — Daily Report (Day 23/90)

💰 Revenue
  Yesterday: $4,217 (+18% vs prev)
  Total:     $48,950 / $1,000,000 (4.9%)
  Pace:      ✅ ahead by $3,200 (vs $30K Day-30 target)

🎯 Pixels
  Sold yesterday: 1,240
  Total sold:     32,150 (3.2%)
  Avg price:      $1.52 (rising)
  Current tier:   7 ($1.50/px)

🚀 Top performers (yesterday)
  Top referrer:   @alice — $1,240 → $124 commission
  Top buyer:      anon-7f3a — 600 pixels for $890
  Top source:     Twitter (38% of revenue)

⚠️ Watch
  Refund rate 6.2% (above 5% threshold) — investigate
  TikTok ads CAC up to $14 (target: $8) — review creative

🔥 Wins / 📉 Misses
  + HN front page drove 4,200 visitors (3.1% converted)
  − Email campaign sent late, low open rate (12%)
```

---

## 6. Alert Rules

Send to Slack/Discord immediately:
| Condition | Severity | Action |
|-----------|----------|--------|
| Hourly revenue $0 for 2h during US daytime | 🚨 P1 | Check site availability |
| Refund rate > 8% in 24h | 🚨 P1 | Pause ads, investigate |
| Webhook signature failure | 🚨 P1 | Possible attack, rotate secret |
| Conversion rate < 1% (24h) | ⚠️ P2 | Review landing page |
| Decline rate > 20% (1h) | ⚠️ P2 | Check Radar rules |
| Tier transition reached | 🎉 Info | Announce on social |
| Daily revenue target hit | 🎉 Info | Celebrate |
| New top-10 referrer | 📈 Info | Personal thank-you DM |

---

## 7. A/B Tests to Run (PostHog feature flags)

Prioritized list — run one at a time, 7-day windows:
1. **Landing page hero:** "Own a piece of internet history" vs "Buy pixels before they get expensive"
2. **Price display:** "$0.50/pixel" vs "$50 for 100 pixels"
3. **Urgency badge:** countdown timer vs progress bar vs both
4. **Bundle default:** 1 pixel vs 10 pixels vs 100 pixels
5. **Social proof:** recent purchases feed on vs off
6. **Checkout button color:** green vs orange vs default
7. **Referral CTA placement:** post-purchase modal vs email vs both

Track lift on: conversion rate, AOV, revenue per visitor.

---

## 8. Implementation (Day 1–3)

| Day | Task |
|----:|------|
| 1   | Postgres schema (events, purchases, referrals) |
| 1   | Server-side event logging (purchase, refund, checkout_start) |
| 2   | PostHog install + key events wired |
| 2   | Metabase install + connection to Postgres |
| 2   | First 5 dashboards: revenue, pixels, conversion, referrals, alerts |
| 3   | Public /stats page (live counters) |
| 3   | Daily report cron job → Slack/Discord |
| 3   | Alert rules wired |
