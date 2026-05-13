# Tech Agent Status — Hour 0 → 12 (initial scaffolding sprint)

**To:** Chief Orchestrator (Travis)
**From:** Tech Agent
**Status:** ✅ MVP code complete. Blocked on Stripe + Supabase keys to deploy.

## ✅ Done

- Full project scaffold at `million-pixels/`
- 1,000,000-pixel canvas (1000×1000) with zoom/pan/click — aligned with Revenue Agent's spec
- Tier-based pricing engine (`api/_pricing.js`) — 12 tiers, $0.01 → $4.00
- Bundle discounts (5%/10%/20%/25%) per Revenue Agent spec
- Stripe Checkout integration (`api/checkout.js`)
- Stripe webhook handler with signature verification (`api/webhook.js`)
- Soft-reservation logic (pending rows in DB, finalized by webhook)
- 10% referral system w/ cookie attribution + `/r/:code` redirect (`api/referral.js`)
- Leaderboard (top 25 buyers by revenue)
- Live price ticker ("Current: $0.01 — rises to $0.05 in 950 pixels")
- Real-time-ish counter (10s polling, ready to upgrade to Supabase realtime)
- Analytics event logging (checkout_start, purchase, referral_click)
- Supabase schema (`schema.sql`) — pixels, buyers, referrals, events + RLS
- Mobile-responsive CSS
- **23/23 pricing unit tests passing** ✅
  - Verified: full-grid total = **$3,155,660** (matches Revenue Agent's projection)

## 🟡 Blocked

- **Stripe keys** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`) — need from you
- **Supabase project** — I need to create one OR you provide URL + service key
- **Vercel account** — need login (or you create project + give me `VERCEL_TOKEN`)
- Domain name (millionpixels.app? mpix.io? Open to suggestions.)

## 📦 Deployment Plan (when unblocked, ~15 min)

1. Create Supabase project, run `schema.sql` (5 min)
2. Run `vercel --prod` to deploy frontend + functions (3 min)
3. Set env vars in Vercel dashboard (2 min)
4. Configure Stripe webhook to `/api/webhook` (3 min)
5. Smoke test with Stripe test card `4242 4242 4242 4242` (2 min)

Full instructions in `DEPLOY.md`.

## 🎯 Performance Targets (estimated)

- Initial page load: **~150KB total** (HTML + CSS + JS + Stripe.js)
- Time to interactive: **<1s** on 3G (no framework, no build)
- 1M pixel canvas renders in **<50ms** (1px-per-pixel direct fillRect)
- Pixel data API cached 10s edge → most users get sub-100ms response

## ⚠️ Known Gaps (will address Hour 12-24)

1. **No Redis lock** for atomic pixel reservation. Currently DB-level upsert with `paid=false`. Race-condition risk if two users select overlapping pixels simultaneously — first webhook wins, second gets refunded. Acceptable for MVP, hardenable later.
2. **No Stripe Connect** for referral payouts yet — earnings tracked in DB, manual payout for now (good enough until first $1k earned).
3. **No fraud detection** — Stripe Radar default rules only.
4. **No admin dashboard** — analytics queryable via Supabase SQL editor.
5. **No anti-self-referral check** beyond cookie. Easy to add IP/email match.
6. **Realtime updates** = 10s polling. Trivial to upgrade to Supabase realtime channels.

## 🚀 Next 12 Hours (Hour 12-24)

- Add Redis-equivalent lock via Postgres `SELECT FOR UPDATE` advisory locks
- Recent-purchase activity feed ("Alex bought 50 pixels · 12s ago")
- Tier progress bar visualization
- Mobile pinch-zoom (currently mouse wheel only)
- Email receipt template
- Admin route `/admin` with simple stats

## 📁 File map

```
million-pixels/
├── README.md           overview
├── DEPLOY.md           deployment runbook
├── STATUS-12H.md       this file
├── schema.sql          Supabase DB setup
├── package.json
├── vercel.json
├── .env.example
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js          frontend logic
├── api/
│   ├── _lib.js         Stripe + Supabase clients
│   ├── _pricing.js     tier pricing (pure, tested)
│   ├── config.js       /api/config — public keys
│   ├── pixels.js       /api/pixels — sold pixel feed
│   ├── stats.js        /api/stats — counters + leaderboard
│   ├── checkout.js     /api/checkout — Stripe session create
│   ├── webhook.js      /api/webhook — payment fulfillment
│   └── referral.js     /api/referral — code lookup + click track
└── test/
    └── pricing.test.js 23 tests, all passing ✅
```

**Need from you to ship:** Stripe keys + Vercel/Supabase account access. Once those land, we're live in 15 minutes.
