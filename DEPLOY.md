# Deploy Million Pixels

## 1. Create Supabase project (5 min)

1. Go to https://app.supabase.com → New project
2. Once ready, open **SQL Editor** → paste `schema.sql` → Run
3. Settings → API → copy:
   - `Project URL` → `SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_KEY` ⚠️ server-only

## 2. Set up Stripe (5 min)

1. https://dashboard.stripe.com → API keys
2. Copy:
   - Publishable key → `STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
3. Webhooks → Add endpoint
   - URL: `https://your-vercel-domain.vercel.app/api/webhook`
   - Events: `checkout.session.completed`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

## 3. Deploy to Vercel (5 min)

```bash
cd million-pixels
npm install
npm install -g vercel
vercel login
vercel --prod
```

In Vercel dashboard → Project → Settings → Environment Variables, add all the keys above. Then redeploy:

```bash
vercel --prod
```

## 4. Smoke test

1. Visit your site, click a pixel, fill in email
2. Click "Buy now" — in Stripe test mode use card `4242 4242 4242 4242`
3. After redirect, pixel should appear within ~10s (webhook → DB → polling)
4. Check `/api/stats` — should show 1 sold

## 5. Go live

- Switch Stripe keys from `sk_test_` to `sk_live_`
- Re-create webhook on live mode, update `STRIPE_WEBHOOK_SECRET`
- Redeploy

## Costs

- Vercel free tier: 100GB bandwidth, 100GB-hr functions — easily fits MVP
- Supabase free tier: 500MB DB, 50k MAU — fine for 10k pixels
- Stripe: 2.9% + 30¢ per transaction (factor in when pricing pixels)
