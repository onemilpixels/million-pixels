# Million Pixels — Leaderboard Spec

**Purpose:** Drive competitive purchasing + viral referrals via public recognition.
**Live by:** Day 5

---

## 1. The Three Boards

### 🏆 Top Buyers
By total pixels owned + total $ spent.

| Rank | Display name | Pixels | Spent | Time windows |
|-----:|--------------|-------:|------:|--------------|
| 1 | @whale_alex | 12,400 | $18,600 | Daily / Weekly / All-time |

### 🚀 Top Referrers
By revenue driven via their referral code.

| Rank | Display name | Referred buyers | Revenue driven | Commission earned |
|-----:|--------------|----------------:|---------------:|------------------:|
| 1 | @alice_pix | 47 | $24,000 | $2,400 | Daily / Weekly / All-time |

### 💎 Latest Whales (sidebar, scrolling)
Real-time stream: "🐋 @bob just bought 500 pixels for $750"
Threshold: any single purchase > $100.

---

## 2. Opt-in & Privacy

**Default:** anonymous (`anon-7f3a` format, deterministic hash of user_id).
**Opt-in display name:** any string + optional URL. Profanity filter.
**Show on leaderboard toggle:** users choose to appear or stay anon.
**Avatar:** optional upload, max 256x256, content-moderated.

**Why opt-in:** GDPR + reduces trolls + makes display-name a privilege ("I'm proud to be on the board").

---

## 3. Time Windows

All three boards support tabs:
- **Today** (rolling 24h)
- **This week** (rolling 7d)
- **This month** (calendar month)
- **All-time** (since launch)

Default tab: **Today** (drives daily engagement).

---

## 4. Bonus Rewards (gamification layer)

### Buyer tiers (by total $ spent)
| Tier | Threshold | Badge | Perk |
|------|----------:|-------|------|
| Pixel | $1+ | 🟢 | Listed on board |
| Block | $100+ | 🔵 | Custom display name |
| Patch | $500+ | 🟣 | Profile link on grid |
| Region | $2,500+ | 🟠 | Founder-signed thank-you note |
| Whale | $10,000+ | 🔴 | Bespoke region + press feature |
| Kraken | $50,000+ | ⚫ | Co-marketing + lifetime support |

### Referrer tiers (by revenue driven)
| Tier | Threshold | Bonus rate | Perk |
|------|----------:|-----------:|------|
| Friend | $0 | 10% | Standard |
| Champion | $1K | 12% | Featured spot |
| Ambassador | $10K | 15% | Direct line to founder + custom assets |
| Partner | $50K | 20% | Co-branded landing page |

Display badges next to display name on board.

---

## 5. Anti-Gaming

- Same-IP / same-card combos counted as one entity
- Self-referral blocked (we already enforce in commission logic)
- Refunds reverse leaderboard position (must hold pixels to count)
- Suspicious patterns (e.g. 1 buyer + 50 referrals from same IP) auto-flagged for review

---

## 6. Tech Implementation

### Data
Materialized view, refreshed every 60 seconds:
```sql
CREATE MATERIALIZED VIEW leaderboard_buyers AS
SELECT
  user_id,
  display_name,
  avatar_url,
  COUNT(DISTINCT pixel_id) AS pixels_owned,
  SUM(amount_paid) AS total_spent,
  MAX(purchased_at) AS last_purchase
FROM purchases
WHERE NOT refunded
  AND display_on_leaderboard = true
GROUP BY user_id, display_name, avatar_url;

CREATE INDEX ON leaderboard_buyers (total_spent DESC);
```

Refresh: `REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_buyers;` every 60s via pg_cron.

### API
- `GET /api/leaderboard/buyers?window=today&limit=100`
- `GET /api/leaderboard/referrers?window=week&limit=100`
- `GET /api/leaderboard/whales?since=2026-05-12T00:00:00Z` (live feed, server-sent events)

### Frontend
- Realtime SSE for "Latest Whales" stream
- Polling every 60s for ranking boards (or WebSocket if traffic warrants)
- Animated rank-changes (smooth row reordering)
- Confetti when a user enters top 10

---

## 7. Social Sharing Hooks

Each leaderboard entry has a shareable card:
- OG image: "I'm #4 on the Million Pixels referrer board — $2,400 earned"
- Tweet template: pre-filled with their stats
- Profile URL: `mp.io/u/<display_name>` shows their owned pixels + referrals

When user enters top 10: auto-trigger "share your win" modal.

---

## 8. Edge Cases

- **Tied rankings:** order by earliest achievement (first to hit total wins)
- **Display-name change:** allowed every 30 days, old name reserved
- **User deletes account:** entries marked as `anon-deleted`, not removed (preserves history)
- **Referrer of someone who got refunded:** commission reversed if within 7-day window, leaderboard updates on next refresh
