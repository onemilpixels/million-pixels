# Million Pixels — Payment Flow Diagram

**Owner:** Revenue Agent
**Status:** Sprint 1 + 2 deliverable

---

## End-to-End Sequence (happy path)

```
┌─────────────┐        ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│   Visitor   │        │ millionpixels│        │   Gumroad    │        │  Supabase    │
│  (browser)  │        │  .com (Next) │        │  /Stripe     │        │  (Postgres)  │
└──────┬──────┘        └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                      │                       │                       │
       │ 1. GET /              │                       │                       │
       ├─────────────────────>│                       │                       │
       │                      │  2. Read pixels, base │                       │
       │                      │     price, stats      │                       │
       │                      ├──────────────────────────────────────────────>│
       │                      │<──────────────────────────────────────────────┤
       │ 3. Render grid + UX  │                       │                       │
       │<─────────────────────┤                       │                       │
       │                      │                       │                       │
       │ 4. Pick pixels,      │                       │                       │
       │    enter email/color │                       │                       │
       │    color, link, name │                       │                       │
       │                      │                       │                       │
       │ 5. POST /api/claim   │                       │                       │
       ├─────────────────────>│                       │                       │
       │                      │  6. Conflict check    │                       │
       │                      ├──────────────────────────────────────────────>│
       │                      │<──────────────────────────────────────────────┤
       │                      │  7. Compute quote     │                       │
       │                      │     (pricing-v2.js)   │                       │
       │                      │  8. Soft-reserve      │                       │
       │                      │     pixels + claim    │                       │
       │                      ├──────────────────────────────────────────────>│
       │                      │  9. Return            │                       │
       │                      │     { gumroad_url,    │                       │
       │                      │       claim_token }   │                       │
       │ 10. Redirect →       │                       │                       │
       │<─────────────────────┤                       │                       │
       │                      │                       │                       │
       │ 11. Open Gumroad URL │                       │                       │
       │     with ?claim=...  │                       │                       │
       ├──────────────────────────────────────────────>                       │
       │                      │                       │                       │
       │ 12. Pay (card form)  │                       │                       │
       ├──────────────────────────────────────────────>                       │
       │                      │                       │                       │
       │ 13. Success page     │                       │                       │
       │<──────────────────────────────────────────────┤                       │
       │                      │                       │                       │
       │                      │ 14. POST              │                       │
       │                      │   /api/gumroad-webhook│                       │
       │                      │<──────────────────────┤                       │
       │                      │ 15. Verify sale via   │                       │
       │                      │    Gumroad API        │                       │
       │                      ├──────────────────────>│                       │
       │                      │<──────────────────────┤                       │
       │                      │ 16. Idempotency check │                       │
       │                      ├──────────────────────────────────────────────>│
       │                      │<──────────────────────────────────────────────┤
       │                      │ 17. Mark pixels paid, │                       │
       │                      │    insert order,      │                       │
       │                      │    credit commission  │                       │
       │                      ├──────────────────────────────────────────────>│
       │                      │ 18. Broadcast realtime│                       │
       │                      │    (Supabase channel) │                       │
       │                      ├──────────────────────────────────────────────>│
       │                      │ 19. 200 OK            │                       │
       │                      ├──────────────────────>│                       │
       │                      │                       │                       │
       │ 20. Realtime push:   │                       │                       │
       │    pixel appears on  │                       │                       │
       │    grid (live)       │                       │                       │
       │<──────────────────────────────────────────────────────────────────────
       │                      │                       │                       │
       │ 21. Gumroad emails   │                       │                       │
       │   confirmation       │                       │                       │
       │<──────────────────────────────────────────────┤                       │
       │                      │                       │                       │
       │ 22. Refresh/visit /  │                       │                       │
       │   sees their pixels  │                       │                       │
       │   live on grid       │                       │                       │
```

---

## Branching Scenarios

### A. Buyer abandons checkout (no payment within 15 min)

```
[soft-reserved pixels in DB]
       ↓ (15 min passes, no webhook)
[cron: release-expired-claims runs every 1 min]
       ↓
[pixels: paid=false, owner_email=null, stripe_session_id=null]
       ↓
[broadcast: pixels available again (channel update)]
```

### B. Refund issued via Gumroad dashboard

```
[Travis clicks Refund in Gumroad]
       ↓
[Gumroad webhook: refunded=true]
       ↓
[POST /api/gumroad-webhook]
       ↓
[lookup order by sale_id]
       ↓
[mark order status='refunded', refunded_at=now]
       ↓
[release pixels: paid=false, ...]
       ↓
[reverse commission_credits for sale_id]
       ↓
[insert refunds table row]
       ↓
[broadcast: pixels removed from grid]
       ↓
[Gumroad emails refund confirmation]
```

### C. Chargeback / Dispute opened

```
[Buyer disputes via card issuer]
       ↓
[Gumroad/Stripe webhook: dispute.created OR refunded=true]
       ↓
[POST /api/gumroad-webhook OR stripe-webhook]
       ↓
[mark order status='disputed', freeze pixels]
       ↓
[insert disputes row, status='pending']
       ↓
[alertOps Slack/email]
       ↓
[Travis submits evidence via Stripe/Gumroad UI within 48h]
       ↓
[Outcome webhook arrives later (days–weeks)]
       ↓ won → restore pixels, mark dispute outcome='won'
       ↓ lost → release pixels (already frozen), mark outcome='lost', clawback commission
```

### D. Provider failover (Gumroad outage)

```
[Cron monitoring: 0 webhooks in 30 min during business hours]
       ↓
[alertOps + auto-flip PAYMENT_PROVIDER=stripe]
       ↓
[front-end fetches /api/config → renders Stripe button]
       ↓
[new orders go via Stripe path]
       ↓
[in-flight Gumroad claims still complete normally (webhooks still accepted)]
       ↓
[when Gumroad recovers → manually flip back, or stay on Stripe]
```

### E. Concurrent purchase (race condition)

```
[Buyer A picks pixel (5,5), POST /api/claim]
[Buyer B picks pixel (5,5), POST /api/claim — SAME instant]
       ↓
[Postgres unique (x,y) constraint on soft-reserve]
       ↓
[Buyer A inserts first → succeeds]
[Buyer B inserts → conflict 409 returned]
       ↓
[Buyer B sees "Pixel already being purchased" → picks different pixel]
```

### F. Variant price stale (race during escalator)

```
[Sold count crosses 5,000 threshold]
[Cron updates Gumroad variants from $1.00 → $1.05]
       ↓ (60-sec window between threshold crossing and cron run)
[Buyer with stale page tries to buy at $1.00]
       ↓
[Gumroad variant updated mid-checkout]
       ↓
[Webhook arrives with price=$1.00 paid]
       ↓
[We accept it — last-mile race is acceptable cost (≤5 min window)]
       ↓
[Sale recorded at $1.00; minor revenue leakage (<$5)]
```

---

## Component Inventory

### Frontend
- `/` — grid + checkout UX
- `/pixel/:x/:y` — individual pixel detail page
- `/refund-policy` — public refund policy page
- `/creator/dashboard?token=...` — influencer dashboard
- `/admin/dashboard` — internal dashboard (basic-auth)

### API endpoints
- `GET  /api/config` — payment provider flag + grid info
- `GET  /api/stats` — public stats (sold, current price)
- `POST /api/claim` — pre-checkout, returns redirect URL
- `POST /api/gumroad-webhook/<secret>` — Gumroad event receiver
- `POST /api/stripe-webhook` — Stripe event receiver (signature verified)
- `GET  /admin/api/dashboard/*` — internal analytics endpoints

### Cron jobs (Vercel Cron)
- `cron/escalator.js` — every 5 min: check sold count, update Gumroad variants
- `cron/release-expired-claims.js` — every 1 min: clear soft-reserves >15 min old
- `cron/alert-checker.js` — every 5 min: threshold-based alerting
- `cron/refresh-dashboard-views.js` — every 5 min: materialized view refresh
- `cron/daily-report.js` — daily at 08:00 PT: email summary to Travis
- `cron/standard-referral-payouts.js` — monthly on 5th: pay standard referrers
- `cron/influencer-payouts.js` — twice monthly (15th, last day): pay influencer affiliates
- `cron/cash-management.js` — monthly on 1st: generate cash movement report

### Database (Supabase)
- `pixels` — every pixel with paid/reserved state
- `buyers` — customer records
- `orders` — purchase ledger (one row per sale)
- `claims` — short-TTL pre-checkout reservations
- `referrals` — standard referral attribution + earnings
- `influencers` — vetted creator records
- `commission_credits` — per-sale commission entries
- `commission_payouts` — payout history
- `refunds` — refund ledger
- `disputes` — chargeback ledger
- `sponsors` — sponsor purchases + placements
- `events` — analytics event stream
- materialized views for dashboard
