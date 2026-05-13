# Referral Ambassador Program

**Goal:** Turn the top-of-funnel into a self-replicating engine. Top 10 referrers each week = featured, rewarded, and given status they can't get with cash.

---

## The Core Loop
1. Every buyer automatically gets a referral code at checkout.
2. Code tracked via cookie (30d) + signed referral param `?r=CODE`.
3. Referred buyer → original referrer earns:
   - 10 free pixels per $10 of referred sales (10%-equivalent in pixel value)
   - Position on the live leaderboard
   - At 50 referrals: "Verified Ambassador" tag on Discord + on-canvas badge
   - At 100 referrals: featured pixel cluster + Twitter co-promo
   - At Top 10 weekly: cash bonus pool (see below)

## Tiers

| Tier | Threshold | Reward |
|---|---|---|
| Spark | 1 referral | Discord role "Sparked", thank-you DM |
| Ember | 10 referrals | 100 bonus pixels, custom URL slug |
| Flame | 25 referrals | 250 bonus pixels, profile badge |
| Blaze | 50 referrals | Verified Ambassador, on-canvas mention, partner-hub access |
| Inferno | 100 referrals | Featured pixel block, weekly co-tweet, $100 bonus (one-time) |
| Supernova | 500 referrals | Permanent leaderboard wall, $500 bonus (one-time), founder-call |

## Weekly Top-10 Bonus Pool

Every Sunday, top 10 referrers (by net referred revenue that week) split a $1,000 pool by rank:
- #1: $300
- #2: $200
- #3: $150
- #4: $100
- #5: $75
- #6–10: $35 each ($175 total)

**Funding:** Pool comes from 2% of net weekly revenue, capped at $1,000 until Day 30 revenue justifies higher.

**Caveat (Travis, decide):** Cash bonuses contradict the stated "no cash" influencer policy. The split here is intentional: **influencers get pixels-only**, **organic ambassadors get the cash pool**. Influencer pixels often dwarf $300/wk in value anyway. If you want strict no-cash, replace the pool with $1,000 in pixels — but the cash incentive is what drives Reddit/forum sharers who don't care about pixel inventory.

## Anti-Gaming Rules
- Self-referral = ban + revoke all earned rewards.
- Same-IP / same-card duplicate buys = filtered, doesn't count.
- New accounts <7d old don't count toward the referrer's tier (delayed credit).
- Stripe Radar + custom rules for chargeback patterns.
- Manual review for >50 referrals/week from one ambassador.

## Top 10 Wall ("The Hall")
A permanent page at millionpixels.example/hall that lists:
- Top 10 all-time referrers (with handle + total referred)
- Top 10 all-time buyers (with handle + total pixels)
- Top 10 partners (with handle + commission earned)

Updated daily. The status engine.

## Communication Cadence
- **Weekly:** Sunday 9pm PT — Top 10 announced in #leaderboard-referrers and on Twitter.
- **Tier-up:** Instant DM + Discord role grant + public shoutout (opt-out available).
- **Monthly:** "Ambassador Roundup" — newsletter to all ambassadors with metrics, what's working, what new rewards are coming.

## Tracking & Payout
- Referral data in `growth/metrics/REFERRALS.db` (SQLite or Postgres in prod)
- Bonus pool payouts via Stripe Connect or PayPal (whichever is set up)
- Ambassadors must verify identity for >$100 in bonuses (W-9 if US, equivalent abroad)

## Sunset / Adjustment Triggers
- If <20 unique referrers in a week by Day 14: increase pool to $1,500, add a "first 5 referrals" instant unlock.
- If gaming detected at scale: switch to manual-approval payouts.
- If pool consumes >5% of revenue past Day 60: rebalance.
