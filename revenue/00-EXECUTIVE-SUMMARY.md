# Million Pixels — Revenue Strategy Executive Summary

**From:** Revenue Agent
**To:** Travis (Chief Orchestrator)
**Date:** Day 0 (planning), executing toward Day 90
**Headline ask:** Stripe keys + tech stack confirmation, then we ship.

---

## TL;DR

- **$1M revenue in 90 days achievable** via a tiered FOMO pricing model
- **Sell 440K of 1M pixels** to hit target (44% of grid)
- **Avg pixel price escalates** $0.01 → $4.00 across 12 tiers
- **Referral program** drives 35% of revenue; 10% commission base, up to 20% for top referrers
- **Day 30 target: $55K** (overshoots spec's $30K — model is healthier than original plan)
- **All specs ready to build**; pricing live by Day 2, dashboard live by Day 3

---

## Documents Produced

| # | Document | Purpose |
|--:|----------|---------|
| 00 | Executive Summary (this) | Top-level orientation |
| 01 | Pricing Model | Tier ladder, bundles, referral mechanics |
| 02 | Revenue Projections | 90-day forecast, channel mix, sensitivity |
| 03 | Stripe Integration | Checkout, webhooks, edge cases, payouts |
| 04 | Analytics Dashboard | Metrics, alerts, daily report, A/B tests |
| 05 | Conversion Optimization | Landing page, checkout flow, trust signals |
| 06 | Leaderboard Spec | Buyers, referrers, gamification |
| 07 | Bundles & Tiers | All discount logic, recognition tiers, promos |

All files: `million-pixels/revenue/`

---

## Critical Path (Day 1–7)

```
Day 0: Travis confirms tech stack + provides Stripe keys + business entity status
Day 1: Stripe account, Radar, Tax setup. Backend skeleton + pricing service.
Day 2: Checkout endpoint + webhook handler + Redis locks. Pricing LIVE.
Day 3: Postgres analytics + Metabase + public stats page. Dashboard LIVE.
Day 4: Referral attribution + Stripe Connect onboarding.
Day 5: Leaderboards (buyers, referrers, whales feed). Trust signals on landing page.
Day 6: Reconciliation job + alerts wired. End-to-end test in Stripe test mode.
Day 7: Soft launch. Pre-sell to friends/community for $50–$100 of revenue (proves system).
```

**By Day 7, we should have $1K+ revenue and zero pricing/checkout bugs.**

---

## Key Decisions Needed from Travis

1. **Stripe keys** — secret + publishable + webhook secret + connect client ID (test + live)
2. **Tech stack** — Node.js + Postgres + Redis is my recommendation. Pivotable.
3. **Hosting** — Vercel/Railway (fast) vs AWS (control). Affects webhook latency.
4. **Business entity** — LLC formed? Required for Stripe Tax + Connect payouts.
5. **Domain** — mp.io vs millionpixels.com vs other. Affects branding everywhere.
6. **Brand voice** — playful vs serious. Affects copy on landing, emails, social.
7. **Content policy** — pre-decide what images are banned (nudity, hate, brands) so we don't scramble at scale.
8. **Refund window** — I propose 30 days for "unclaimed pixels," shorter once image uploaded. Confirm?

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------:|-------:|------------|
| Flat launch week (no FOMO ignition) | Medium | Severe | Pre-sell to friends, $5K paid ads ready Day 7 |
| Stripe account holds funds (high-risk classification) | Low | Severe | Set up Stripe support contact early, clear business description |
| Viral scale crashes infra | Medium (good problem) | Medium | Vercel/Cloudflare CDN, Postgres read replicas, Redis cluster |
| Refund/dispute rate spikes | Medium | High | Clear refund policy, fast support, content moderation pre-upload |
| Referral fraud / wash trading | Medium | Medium | IP + payment-method fingerprinting, manual review >$5K/mo referrers |
| Tax/legal issues | Low | High | Stripe Tax handles auto, LLC formed before launch |

---

## What I Need to Move Faster

- **Engineering capacity:** I've written specs. Who builds? (Travis solo? Another agent? Contractor?)
- **Stripe keys** (blocking)
- **Stack decision** (blocking)
- **First $1K of pre-sales** lined up (5–10 friends ready to buy on Day 7)
- **Press/influencer outreach list** — I can draft if you brief me on contacts

---

## Daily Reporting Format

Once live, I'll deliver this every morning (also auto-posted to Slack/Discord):
- 💰 Revenue: yesterday + cumulative vs target
- 🎯 Pixels: sold + current tier + next tier ETA
- 🚀 Top referrer + top buyer + top traffic source
- ⚠️ Alerts: anything red
- 🔥 Wins / 📉 Misses (qualitative)
- 🎬 Next 24h focus

---

## My Recommendation

**Ship the pricing model + dashboard first (Days 1–3), then iterate based on real data.**
Don't over-build before launch. Get to "buyer can purchase 1 pixel and we see it on the dashboard" within 7 days. Everything else is fast follow.

The model is sound. The math works. Execution is the only question.

Standing by for keys + go-decision.

— Revenue Agent
