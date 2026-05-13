# Million Pixels — Payment Tracking Dashboard (Sprint 2)

**Owner:** Revenue Agent → Tech Agent for build
**Status:** Sprint 2 deliverable
**Goal:** Single pane of glass for money flowing in, refunds going out, commissions accruing.

---

## Stack

- **Frontend:** Next.js page at `/admin/dashboard` (basic-auth gated)
- **Data source:** Supabase `orders`, `pixels`, `referrals`, `sponsors`, `events`
- **Cache:** Materialized views refreshed every 5 minutes via cron
- **Realtime:** Supabase realtime subscription on `orders` (last-hour panel)

For richer BI later: connect Supabase → Metabase (free) for ad-hoc queries.

---

## Page Layout

### Header strip (always visible)

```
┌────────────────────────────────────────────────────────────────────┐
│  💰 $XXX,XXX  →  $1M  [▓▓▓▓░░░░░░░ 32%]   |  📅 Day 28 of 90       │
│  Pixels sold: 87,250 / 1,000,000  |  Current price: $1.83/pixel    │
└────────────────────────────────────────────────────────────────────┘
```

### Row 1: Today snapshot

| Card | Value | Subtext |
|---|---|---|
| Revenue today | $14,250 | vs yesterday +12% |
| Pixels sold today | 6,840 | vs daily target (11,111) -38% ⚠️ |
| Orders today | 142 | AOV $100 |
| Avg conversion rate | 3.2% | last 7 days |

### Row 2: Health & risk

| Card | Value | Color |
|---|---|---|
| Refund rate (30-day rolling) | 1.4% | 🟢 healthy |
| Dispute rate (30-day rolling) | 0.2% | 🟢 healthy (Stripe threshold 1%) |
| Pending payouts (Gumroad) | $34,200 | next Friday |
| Pending commissions to pay | $4,120 | next 5th of month |

### Row 3: Charts

- **Cumulative revenue vs $1M target** — line chart, 90-day x-axis
- **Daily revenue + pixels sold** — dual-axis bar+line, last 30 days
- **Revenue by UTM source** — stacked bar, top 10 sources, last 7 days
- **Refunds vs sales** — overlay line chart, last 30 days

### Row 4: Live activity (last 100 events)

Realtime feed:

```
14:23 PURCHASE  alex@ex.com  10 pixels  $9.50  (utm: tiktok_creator_42)
14:21 REFUND    bob@ex.com   1 pixel   -$1.00  reason: changed mind
14:18 SPONSOR   acme corp    Leaderboard Logo  $500  active until 2026-06-12
14:14 PURCHASE  carol@ex.com 100 pixels  $80.00 (no utm)
14:11 DISPUTE   dave@ex.com  50 pixels  -$45.00 reason: fraudulent
...
```

### Row 5: Leaderboards (collapsed by default)

- **Top buyers** — by pixels owned + $ spent
- **Top referrers** — by commission earned this month
- **Top UTM sources** — by attributed revenue
- **Top sponsor brands** — by $ spent

---

## API Endpoints

```
GET /admin/api/dashboard/summary       → header strip + row 1 + row 2 cards
GET /admin/api/dashboard/charts        → row 3 data, 30d/90d aggregates
GET /admin/api/dashboard/activity?n=100 → row 4 live feed
GET /admin/api/dashboard/leaderboards  → row 5 (4 lists)
GET /admin/api/dashboard/refunds       → detail page (drill-down)
GET /admin/api/dashboard/commissions   → detail page (drill-down)
GET /admin/api/dashboard/sponsors      → detail page (drill-down)
```

All endpoints require `Authorization: Bearer <ADMIN_TOKEN>` (env var, rotate weekly).

---

## Materialized Views

Refresh every 5 min (Vercel Cron):

```sql
-- v_daily_revenue
create materialized view v_daily_revenue as
select date_trunc('day', paid_at) as day,
       count(*) as orders,
       sum(price_cents) as revenue_cents,
       sum(pixel_count) as pixels_sold,
       round(avg(price_cents)::numeric, 2) as avg_order_cents
from orders
where status = 'paid'
group by 1
order by 1;

-- v_utm_attribution
create materialized view v_utm_attribution as
select coalesce(utm_source, 'direct') as source,
       count(*) as orders,
       sum(price_cents) as revenue_cents,
       sum(pixel_count) as pixels,
       round(avg(price_cents)::numeric, 2) as avg_order_cents
from orders
where status = 'paid' and paid_at > now() - interval '30 days'
group by 1
order by 2 desc;

-- v_refund_rate
create materialized view v_refund_rate as
select date_trunc('day', refunded_at) as day,
       count(*) as refunds,
       sum(refund_amount_cents) as refunded_cents
from refunds
where refunded_at > now() - interval '90 days'
group by 1;

-- v_top_referrers
create materialized view v_top_referrers as
select utm_source,
       count(*) as conversions,
       sum(price_cents) as gmv_cents,
       sum(commission_cents) as commission_cents
from orders
join referral_credits using (sale_id)
where status = 'paid' and paid_at > now() - interval '30 days'
group by 1
order by 4 desc
limit 50;

-- Refresh: select refresh_dashboard_views();
create or replace function refresh_dashboard_views() returns void as $$
begin
  refresh materialized view concurrently v_daily_revenue;
  refresh materialized view concurrently v_utm_attribution;
  refresh materialized view concurrently v_refund_rate;
  refresh materialized view concurrently v_top_referrers;
end $$ language plpgsql;
```

---

## Alerts

Send to ops-alerts Slack channel (or Discord webhook) when:

| Condition | Severity | Action |
|---|---|---|
| Refund rate (24h) > 5% | 🟡 warn | DM Travis |
| Dispute rate (24h) > 0.5% | 🟠 high | DM + email Travis |
| Daily revenue < 50% of 7-day avg | 🟡 warn | DM Travis |
| Daily revenue < 25% of 7-day avg | 🟠 high | DM + email |
| Single buyer purchase > $10k | 🟢 info | Slack post (celebrate!) |
| Gumroad webhook 0 events in 1h (during business hours) | 🟠 high | Page Travis |
| Pending commissions > $10k accrued | 🟢 info | Reminder to schedule payout |
| Pixel queue stuck (unconfirmed > 1h) | 🟠 high | Auto-release + alert |

Alert implementation: `cron/alert-checker.js` runs every 5 min, posts to Slack webhook.

---

## Daily Report (auto-emailed at 08:00 PT to Travis)

Plain-text email summary:

```
🐌 Million Pixels Daily Report — Day 28
─────────────────────────────────────────
💰 Revenue yesterday: $14,250 (+12% vs prior day)
📊 Cumulative: $312,400 / $1M (31.2%)
🟢 On track: would hit $1M at Day 67 at current pace

🎨 Pixels sold yesterday: 6,840 (avg $2.08/pixel)
🪜 Current base price: $1.83 → next escalator at 91,400 pixels (~3 days)

📈 Top UTM source: tiktok_creator_42 — $3,200 (22% of yesterday)
🏆 Top buyer: alex@example.com — 250 pixels ($475)
🤝 Top referrer this week: chloe — 18 conversions, $1,840 commission

⚠️ Refund rate 30d: 1.4%
✅ Disputes 30d: 0.2%

🔮 Next 24h focus: ship newsletter, push 2 more TikTok creator outreach emails.
```

Implemented via `cron/daily-report.js` (Vercel Cron, 08:00 PT) → `RESEND_API_KEY` for email send.

---

## Build Order

1. **Day 1**: Header strip + Row 1 (today snapshot) — 90% of value
2. **Day 2**: Row 3 charts + materialized views + cron refresh
3. **Day 3**: Row 4 live activity (realtime) + alerts wired
4. **Day 4**: Row 5 leaderboards + daily report email
5. **Day 5**: Drill-down pages (refunds, commissions, sponsors)

Day 1 ships an MVP that's useful immediately.
