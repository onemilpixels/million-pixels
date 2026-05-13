# Million Pixels 🟦

Buy a pixel. Own a piece of the internet. $0.01–$1.00 per pixel.

## Tech Stack (zero-budget, 48h MVP)

| Layer       | Choice                          | Why                                              |
|-------------|---------------------------------|--------------------------------------------------|
| Frontend    | Vanilla HTML/JS + Canvas        | Zero build step, sub-second load, 10k pixels easy |
| Backend     | Vercel Serverless Functions     | Free tier, auto-scales, native Stripe support     |
| Database    | Supabase (Postgres + Realtime)  | Free tier 500MB, realtime subscriptions built-in  |
| Payments    | Stripe Checkout                 | Hosted, PCI-compliant, no card handling           |
| Hosting     | Vercel                          | Free, auto-deploy from Git, edge CDN              |
| Analytics   | Vercel Analytics + Supabase     | Free, privacy-friendly                            |

## Architecture

```
Browser (Canvas grid)
   ├── GET  /api/pixels       → all sold pixels (cached 10s)
   ├── POST /api/checkout     → creates Stripe session, returns URL
   ├── POST /api/webhook      → Stripe → marks pixel paid, credits referrer
   ├── GET  /api/stats        → total sold, revenue, top buyers
   └── GET  /api/referral/:code → resolve referral, set cookie
       │
       └── Supabase Postgres
              ├── pixels      (x, y, owner, color, link, price, paid_at)
              ├── buyers      (email, name, pixel_count, total_spent)
              └── referrals   (code, owner_email, conversions, earned_cents)
```

## 48h Deployment Plan

**Hour 0–6 (DONE):** Scaffold, grid renderer, mock data.
**Hour 6–18:** Supabase schema + Stripe Checkout + webhook.
**Hour 18–30:** Leaderboard, referral links, real-time counter.
**Hour 30–42:** Mobile polish, error handling, rate limiting.
**Hour 42–48:** Deploy to Vercel, smoke-test live payments with test keys.

## Required Secrets (provide via Vercel env vars)

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...   # exposed to client
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...          # server-side only
NEXT_PUBLIC_SUPABASE_URL=...         # client read-only
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Local Dev

```bash
npm install
vercel dev          # runs serverless funcs locally on :3000
```

## Deploy

```bash
vercel --prod
# Add env vars in Vercel dashboard, then redeploy
```

Set Stripe webhook endpoint to: `https://yourdomain.com/api/webhook`
Event: `checkout.session.completed`
