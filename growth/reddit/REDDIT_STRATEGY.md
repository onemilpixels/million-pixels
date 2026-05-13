# Reddit Growth Strategy

**Reality check:** Reddit punishes promo hard. Half of all "growth strategies" get the OP shadowbanned within a week. We will play the long game: contribute first, post sparingly, and let the story do the work.

---

## Subreddit Map (Priority Order)

| Subreddit | Subs | Mod-strictness | Angle | Posting risk |
|---|---|---|---|---|
| r/InternetIsBeautiful | 17M | High | "I'm rebuilding the 2005 Million Dollar Homepage" | LOW — perfect fit, but only ONE post allowed |
| r/SideProject | 350K | Low | Build-in-public, transparent metrics | LOW |
| r/Entrepreneur | 4M | Medium | "$1M in 90 days" launch journey | MEDIUM — promo allowed only if educational |
| r/startups | 2M | High | Lessons learned, no direct CTA | HIGH — promo-allergic |
| r/IndieHackers | 60K | Low | Direct build-in-public | LOW |
| r/SmallBusiness | 2M | Medium | Marketing playbook educational | MEDIUM |
| r/InternetMysteries / r/nostalgia | 1M+ | Medium | History post about original MDHP | LOW (no direct CTA) |
| r/web_design | 800K | Medium | Canvas design behind the scenes | MEDIUM |
| r/PixelArt | 800K | Low | Showcase pixel art created on canvas | LOW |
| r/InternetHistory (small) | 30K | Low | Direct fit | LOW |
| r/marketing | 2M | Medium | Case study post (post-launch) | MEDIUM |
| r/GrowthHacking | 50K | Low | Tactic write-up | LOW |
| r/sidehustle | 2M | Medium | "How I'm trying to make $1M in 90 days" | MEDIUM |
| r/Bootstrapped | 4K | Low | Direct fit | LOW |

**Skipped intentionally:** r/all-front-page chasers (r/funny, r/pics) — wrong audience, mod-banned almost certainly.

---

## Phase 1 — Karma & Credibility (Days 1–7, BEFORE first promo post)
Each subreddit we want to post in: contribute 3+ genuine, helpful comments and 1 non-promotional post first. Build flair / mod recognition. **Skip this and posts get instantly removed.**

Travis: this requires a real account with 90+ day age and 100+ karma. If we don't have that, identify an account that fits or build credibility over the first 2 weeks before any promo post.

---

## Phase 2 — Launch Posts (Days 7–14)

### Post 1: r/InternetIsBeautiful (Day 7) — HIGHEST LEVERAGE
**Title:** I rebuilt the 2005 Million Dollar Homepage for 2026 — same 1,000×1,000 grid, live counter, no NFTs

**Body:**
> Remember the Million Dollar Homepage? 21-year-old kid sold 1 million pixels at $1 each in 2005, made $1M, paid for college.
>
> I always wondered if it would still work. Not as crypto / NFT / web3 — just the original concept, modernized: 1,000×1,000 grid, $1/pixel, live counter, leaderboard, referral codes for fun.
>
> Live now: [URL]
>
> Building it in public. Daily metrics here: [Discord URL or Twitter]. If it fails, the post-mortem is going to be a good read either way.

**Rules:** Don't mention the Discord/referral in the title. Don't reply with promotional CTAs in comments — answer questions only. Don't repost if it gets removed; DM mods and ask.

---

### Post 2: r/SideProject (Day 8)
**Title:** Trying to make $1M in 90 days by rebuilding the 2005 Million Dollar Homepage — daily metrics open

**Body:**
> [Same backstory as above, plus:]
> Posting the metrics dashboard publicly: visitors, conversion, $/pixel, referral splits. Building in public, full transparency. Critique welcome.
>
> Site: [URL]
> Discord (live counter, leaderboard): [Discord URL]
> Open metrics: [URL]

---

### Post 3: r/IndieHackers (Day 9)
**Title:** $0 → $1M in 90 days, week 1 metrics from rebuilding the Million Dollar Homepage

**Body:** Lead with metrics. Numbers from week 1: pixels sold, visitors, conversion, CAC ($0), top referral source. Tactical write-up of what worked / didn't. Soft CTA at the end.

---

### Post 4: r/Entrepreneur (Day 14, AFTER initial traction)
**Title:** A case study from the first 14 days of trying to do $1M in 90 days

**Body:** Educational, retrospective. What's working: [specifics]. What's not: [specifics]. The honest middle is what gets upvoted here. CTA at the bottom only.

---

### Post 5+: r/PixelArt, r/InternetMysteries, r/web_design (Day 14+)
Different framing per sub:
- r/PixelArt: showcase the best user-created pixel art on the canvas. No purchase CTA.
- r/InternetMysteries: history of the original MDHP, current state, and "what happens if we rebuild it" link.
- r/web_design: tech / design behind the canvas. Performance numbers, rendering tricks.

---

## Comment Engagement Playbook

When a launch post goes live:
1. First 15 minutes: monitor every comment, reply in <5 min.
2. Top comment usually decides post fate — engage substantively (not "thanks!").
3. Common objections + canned-but-personalized responses:
   - **"Isn't this just an NFT?"** → "No NFTs, no crypto, no wallet. Just a $1 charge for a pixel and a link. Mostly because I think the simplicity is what made the original work."
   - **"This was already done."** → "Yep — by Alex Tew in 2005, exactly. He made $1M. Curious if the model still works 21 years later. Worst case: a really fun failure post-mortem."
   - **"Scam?"** → "Fair. Stripe checkout, refundable, Terms here: [URL]. Daily metrics public: [URL]. Happy to answer specifics."
4. Never argue with downvoters publicly. Move on.

## Cross-Post Discipline
- Never cross-post the SAME wording to multiple subs. Each sub gets a custom framing per the table above.
- Wait ≥24h between posts in different subs.
- If a post is removed: DM mods politely, ask why, comply, do not repost.

## Tracking
Every Reddit post gets a unique UTM:
- `?utm_source=reddit&utm_medium=organic&utm_campaign=launch_iib_2026-05-19` (subreddit + date)
- Tracked in `metrics/REDDIT_TRACKER.csv`

## Long-tail (Days 30–90)
- Weekly "metric drop" posts in r/IndieHackers / r/SideProject ("Week 4 of $1M-in-90-days, here are the numbers")
- Reply-to-relevant-threads playbook: when MDHP is mentioned anywhere on Reddit, we have a member ready to share their experience (NOT us — must be organic).
