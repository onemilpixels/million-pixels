# Million Pixels Discord — Build Plan

**Goal:** 500 seeded members by Day 7, 1,000 DAU by Day 30, 5,000+ members by Day 90.

**Vibe:** Indie internet weirdos building together. Half marketplace, half clubhouse. Energy somewhere between Indie Hackers + early Genesis NFT Discord + a college campus radio station. Not corporate. Not crypto-grifty.

---

## Server Identity
- **Name:** Million Pixels HQ
- **Icon:** 🟪 (pixel square) with subtle animation on boost
- **Banner:** Live-updating pixel-counter screenshot (refresh weekly)
- **Vanity URL:** discord.gg/millionpixels
- **Verification level:** Medium (verified email + 5min wait for new accounts) — filters bots without choking growth
- **Community server:** ON (so we get welcome screen, discovery, insights)

## Channel Structure

```
📌 START HERE
  ├─ #welcome (read-only, auto-tour bot post)
  ├─ #rules (read-only)
  ├─ #announcements (mod-only, opt-in role pings)
  └─ #how-it-works (FAQ + buying guide)

🎯 THE CANVAS
  ├─ #live-counter (auto-posts every 1,000 pixels sold, hourly summary)
  ├─ #pixel-showcase (members post their pixel art, must include canvas link)
  ├─ #buying-help (Q&A on how to buy, tech support)
  └─ #refund-and-issues (private staff ticket creation)

🏆 LEADERBOARDS & CHALLENGES
  ├─ #leaderboard-buyers (top 10 buyers weekly auto-update)
  ├─ #leaderboard-referrers (top 10 referrers weekly)
  ├─ #weekly-challenge (theme of the week: "Smallest Story in 10 Pixels", "Best Logo Pixel", etc.)
  └─ #challenge-archive (past winners hall of fame)

💬 COMMUNITY
  ├─ #general
  ├─ #introductions (welcome new arrivals, role earned: "Introduced")
  ├─ #memes-and-shitposting
  ├─ #show-your-project (members plug their own stuff — builds reciprocity)
  └─ #off-topic

🎤 INFLUENCER & PARTNER WING
  ├─ #partner-hub (private; signed influencers only)
  ├─ #partner-resources (graphics, copy, tracking links)
  └─ #partner-leaderboard (commission earnings, top 10 partners)

🛠️ BUILD IN PUBLIC
  ├─ #devlog (founder posts daily build updates)
  ├─ #metrics-dashboard (auto-posts daily KPIs)
  └─ #feedback-and-feature-requests

🎙️ VOICE
  ├─ 🎧 Lounge
  ├─ 🛠️ Build Sessions (weekly Friday voice chats)
  └─ 🏆 Leaderboard Live (weekly Sunday voice — announce winners)
```

## Roles

| Role | Color | How earned | Perks |
|---|---|---|---|
| 👑 Founder | gold | manual | n/a |
| 🛡️ Mod | blurple | manual | mod tools |
| 🌟 Pixel Partner | violet | sign influencer agreement | access to partner channels |
| 💎 Top 10 Buyer | pink | top 10 by pixels owned | featured on leaderboard, profile tag |
| 🏆 Top 10 Referrer | green | top 10 by referrals | same |
| 🎨 Pixel Artist | aqua | post in #pixel-showcase + 5 reactions | showcase priority |
| ✅ Verified Buyer | white | linked purchase | can post buy/sell |
| 🌱 Introduced | grey | posted in #introductions | unlocks #general |
| 🐤 New | none | default on join | read-only most channels |

## Bots

| Bot | Purpose |
|---|---|
| MEE6 or Carl-bot | Auto-role on intro, welcome msg, moderation, leveling (XP for non-spammy participation) |
| Statbot | Member growth + activity tracking for our metrics |
| Custom webhook → #live-counter | Auto-post every 1,000 pixels |
| Custom webhook → #metrics-dashboard | Daily KPI auto-post |
| Custom webhook → #leaderboard-* | Weekly Sunday auto-post |
| Tickets bot (Ticket Tool) | #refund-and-issues |

## Seeding Plan (Days 1–7)
Goal: 500 members, 50+ daily active.

**Sources (in priority order):**
1. **Personal network** — Travis + early supporters, ~50 invites. Day 1.
2. **Twitter announce** — "We're building MP in public; here's the Discord." Day 1. Target +100.
3. **Reddit posts** — r/SideProject, r/InternetIsBeautiful launch post with Discord CTA. Day 2. Target +150.
4. **IndieHackers post** — full build-in-public thread + Discord CTA. Day 3. Target +100.
5. **HackerNews Show HN** — soft mention only (HN dislikes Discord-pushing). Target +50.
6. **Influencer first-wave** — first 5 signed influencers each share. Day 5–7. Target +100.
7. **Cross-promo** — trade shoutouts with 3 similar-sized indie communities (Sukh Sandhu's Build in Public, etc.). Day 7.

## First-Week Programming
- **Day 1:** Live "Server Launch" voice chat, 8pm PT. Founder AMA.
- **Day 2:** First weekly challenge launches → "Tell your origin story in 25 pixels." Prize: 500 free pixels + featured.
- **Day 3:** First user spotlight in #announcements.
- **Day 4:** Devlog drops in #devlog with first metrics screenshot.
- **Day 5:** First leaderboard snapshot pinned.
- **Day 7:** Weekly review voice chat + winner announce.

## Daily Operating Rhythm
- **8am PT:** Mod sweep — check overnight DMs/tickets, clean spam.
- **10am PT:** #devlog post (build update or metric).
- **2pm PT:** Engage in #general — ask a question, react to art, hype a buyer.
- **6pm PT:** Spotlight a member or pixel art piece.
- **9pm PT:** End-of-day metric post → "147 pixels sold today, 12 new members, leaderboard shifts: ..."

## Moderation Playbook
- **Auto-mod:** AutoMod for slurs, mass-mentions, invite links from non-partners.
- **Crypto/NFT scams:** Zero tolerance, instant ban. (Will be the #1 attack vector.)
- **Self-promo:** Allowed only in #show-your-project; nowhere else.
- **DM harassment reports:** Ticket → review within 24h → ban + reach out to victim.
- **Tone:** Friendly, fast, transparent. Public ban announcement only for repeat scammers ("user X was removed for repeated NFT-pump DMs in our members' DMs. Block + report any similar.").

## Risks & Mitigations
| Risk | Mitigation |
|---|---|
| Bot raids on launch | Verification level 2, 5-min new-account hold, CAPTCHA on join |
| NFT/crypto scam DMs to members | Pinned warning, fast ban, public examples |
| Dead-channel feeling | Tight channel list to start (open more as activity warrants), founder presence 3×/day |
| Influencer ego clashes in #partner-hub | Private channels per top-tier partner if needed |
| Drama / pile-ons | "Disagree without dunking" rule, mod intervention within 30 min |

## Success Metrics (tracked weekly)
- Members joined / week
- 7-day-active members
- Messages / day (median + p90)
- Voice-chat hours / week
- Discord → site click-throughs (UTM-tagged invites)
- Discord → buyer conversion rate
