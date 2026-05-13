# Million Pixels — Conversion Optimization Strategy

**Goal:** Move visitor → buyer conversion from 2.5% baseline → 5%+ by Day 60.
**Why it matters:** Each +1% conversion = ~$200K added by Day 90.

---

## 1. Landing Page Architecture

### Above the fold (the 5-second decision)
1. **Hero headline:** "Own a piece of internet history — before it gets expensive."
2. **Sub-head:** "1 million pixels. Prices rise as they sell. Buy now or pay more later."
3. **Live counter:** "🔥 32,150 / 1,000,000 sold • Price now $1.50 • Rising to $2.00 in 17,850 pixels"
4. **Primary CTA button:** "🎨 Pick your pixels" (jump to grid)
5. **Trust microline:** "Stripe-secured • 30-day refund • As seen on [logo strip]"

### Below the fold
6. **The grid** (interactive, immediate, no friction)
7. **Recent purchases feed** (live, anonymized)
8. **How it works** (3 steps, illustrated)
9. **FAQ** (price, refunds, what you own, image specs)
10. **Founder story** (humanize, trust, why 1M pixels)
11. **Press strip** (when we get it)
12. **Final CTA** + email capture for "price-rise alerts"

---

## 2. The Grid (the conversion engine)

The grid IS the product. Optimize it ruthlessly.

### Features that drive purchases
- **Click-to-select** with multi-select (drag to box-select)
- **Live price calculator** updates as you select: "47 pixels selected = $70.50"
- **Bundle hint** when near a discount threshold: "Add 53 more pixels → save $7 (10% off)"
- **Heatmap toggle:** show recently-sold areas (proves momentum)
- **Zoom levels:** 1x, 4x, 10x, 50x — different abstraction layers
- **Search/jump:** "find empty 10x10 block"
- **Hover preview:** show who owns sold pixels (+ their link, if provided)

### Friction killers
- No account required to browse the grid
- Account creation is **after** payment (one-click magic link)
- Email-only auth (no passwords)
- Apple/Google Pay in checkout (skip card entry)
- Saved selection if user navigates away (sessionStorage + email recovery)

---

## 3. Checkout Flow Optimization

### The 3-screen Stripe Checkout
```
Screen 1 (our app): "Confirm your pixels"
  - Visual: grid preview of selected pixels (highlighted)
  - Breakdown: 47 pixels × $1.50 = $70.50
  - Bundle bonus: 0% (under 10 pixels)
  - Total: $70.50
  - [Continue to payment] (Stripe Checkout)

Screen 2 (Stripe Checkout, hosted):
  - Apple/Google Pay buttons prominent
  - Card entry below
  - Email
  - Tax line auto-calculated

Screen 3 (our app): "🎉 You own 47 pixels!"
  - Confetti animation
  - Pixel coordinates listed
  - Upload image CTA (or "later" link)
  - Share buttons: "Tell your friends, earn 10% commission"
  - Personal referral link displayed prominently
```

### Cart abandonment recovery
- If checkout session expires without payment, send email after 30 min:
  > "Your pixels are still available — but the price is rising. [Resume checkout]"
- 2nd email at 24h with 5% discount code (one-time use)
- 3rd email at 72h: "Last chance — current price is $X, was $Y when you started"

---

## 4. Trust Signals (eliminate purchase anxiety)

### Visible everywhere
- 🔒 Stripe-secured checkout badge
- 💸 30-day refund guarantee
- ⭐ Customer testimonials (collect from day 1)
- 📰 Press logos (once secured)
- 👤 Real founder face + Twitter link
- 📊 Live stats page link (transparency)
- 📧 Visible support email + <24h response promise
- 🌐 Custom domain + valid SSL (no subdomains)

### Risk reducers
- **What you get** explainer: "You own X pixel coordinates. Upload any image (within content policy). It stays live forever, hosted by us."
- **Content policy** linked in footer (clear, simple)
- **Permanence guarantee:** "We commit to hosting the canvas for minimum 10 years. Open-source archive if we shut down."
- **Resale clause:** "You can transfer ownership to anyone (no fee from us)."

---

## 5. FOMO & Urgency (ethical, real)

Real scarcity > fake scarcity. Everything below is true:
- **Live tier countdown:** "Price rises to $2.00 in 17,850 pixels"
- **Hourly pace:** "212 pixels sold in the last hour at this price"
- **Estimated time to next tier:** "Next price increase in ~14 hours at current pace"
- **Permanent supply cap:** "Only 1,000,000 pixels will ever exist. 32,150 are already taken."
- **Tier finality:** "Once the price rises, it never goes back down."

### Avoid (these backfire)
- Fake countdown timers that reset
- "Only X spots left!" when not true
- Pop-ups that block the grid
- Email-required-to-browse walls

---

## 6. Mobile Optimization (50%+ of traffic)

- Grid must work on touch (pinch zoom, tap to select)
- Checkout must use mobile wallet (Apple/Google Pay) by default
- Page weight < 500KB initial load
- LCP < 2.5s, CLS < 0.1, INP < 200ms (Core Web Vitals)
- Stripe Checkout is mobile-optimized out of box ✅

---

## 7. Pricing Psychology Tricks (use sparingly)

- **Anchor with the top tier:** "Today $0.50 — tomorrow could be $4.00"
- **Frame in bundles:** "100 pixels = $50 (a coffee per day for two weeks)"
- **Loss framing:** "Buy now to avoid +$0.50 increase coming soon"
- **Round-number magnetism:** highlight nearby round totals: "$100 = 200 pixels"
- **Decoy bundle:** offer 50-pixel bundle that's slightly bad value to make 100-pixel bundle look great

---

## 8. Email Capture (for non-converters)

70%+ of visitors won't buy on first visit. Capture them:

### "Price rise alert" — high-converting opt-in
> "Get notified when the price changes. We'll email you once per tier — no spam."

Triggers email when:
- New tier starts (price rises)
- 50% to next tier
- Final 10% to next tier ("LAST CHANCE at $1.50")

Expected: 15–20% of email subscribers convert within 14 days.

---

## 9. Post-Purchase Optimization (drive repeat + referral)

The 5 minutes after purchase = highest-value moment in the funnel.

### Success page must include
1. 🎉 Visual confirmation (their pixels highlighted on grid)
2. 📤 Upload image flow (or "do it later" — send email reminder)
3. 🔗 Personal referral link with social share buttons (pre-filled tweet/text)
4. 🎁 "Refer 3 friends, get 50 free pixels" carrot
5. 📣 Discord/community invite
6. 🛒 "Add more pixels at the same price" — 60-min lock on current tier price for them

### Day 1, 3, 7 post-purchase emails
- Day 1: "Welcome + upload your image"
- Day 3: "Your referral link — here's how much others have earned"
- Day 7: "Your friends are buying pixels — see who's referred"

---

## 10. Optimization Cadence

| Cadence | Activity |
|---------|----------|
| Daily   | Check funnel metrics, refund rate, decline rate |
| Weekly  | One A/B test concludes, one starts |
| Biweekly| Review session replays (PostHog), find friction |
| Monthly | Comprehensive funnel audit, NPS survey, refresh testimonials |

---

## 11. Conversion Targets by Phase

| Phase | Visitor → buyer conv | AOV | Revenue/visitor |
|-------|--------------------:|----:|----------------:|
| Launch (D1–7)   | 2.0% | $20  | $0.40 |
| Growth (D8–30)  | 3.0% | $50  | $1.50 |
| Scale (D31–60)  | 4.0% | $120 | $4.80 |
| Climax (D61–90) | 5.0% | $200 | $10.00 |

Revenue per visitor compounds with price tier increases — even flat conversion = more $/visitor.
