# Million Pixels — UX Strategy

> Audit + roadmap for making a 1,000,000-pixel canvas actually usable. May 2026.

---

## TL;DR

The product is beautiful (editorial/newsprint design) and the mechanics are solid (Stripe checkout, tier pricing, referrals). But the **core interaction** — finding a pixel you want, on a 1000×1000 grid, on any device — is brutal. A user lands on the page, sees a mostly-white square, and has no idea where to look, what's hot, who's there, or what to do next.

**Three things will move the needle the most:**

1. **Mini-map + zoom presets** — orientation in a 1M-pixel space (Quick win, 1 day)
2. **Search + "Find pixels by owner/keyword"** — discovery, not just placement (Quick win, 1 day)
3. **Mobile-native pan/zoom with pinch gestures** — half the traffic is mobile, currently broken (Medium, 2 days)

Then layer in heatmap, hover preview, "Random pixel" / "Hot zone" entry points, leaderboard sorting, and a post-purchase share moment. None of this requires a redesign — the editorial aesthetic is a strength. We're filling in the navigation that a million-cell grid demands.

---

## 1. Friction Audit — What's Hard Right Now

I walked through the site as five user types. Here's what breaks.

### 1.1 The Curious Lander ("what even is this?")

- Lands on page, sees a mostly-white 1000×1000 canvas.
- Doesn't know what to look at first. No featured pixels, no "explore" path.
- Hover info only appears on a specific cell — invisible by default at 1× zoom.
- The price ticker is informative but says nothing about *where* the action is.
- **Outcome:** bounces, never selects a pixel.

### 1.2 The Buyer-with-Intent ("I want pixels next to X")

- Wants pixels near a friend, a brand, or a popular zone.
- No way to search by owner name. No way to find existing pixels by link domain.
- Has to zoom in manually, scan visually, and hope to spot what they want.
- **Outcome:** picks an arbitrary corner, feels like a lottery.

### 1.3 The Speculator ("where will value accrue?")

- Wants to buy near hot zones — pixels appreciate by adjacency.
- No heatmap, no "trending area," no recent-sales feed.
- Leaderboard exists but lists *people*, not *places*. Can't click a leaderboard entry to see where their pixels are.
- **Outcome:** can't make an informed bet.

### 1.4 The Mobile Visitor (about half of all traffic)

- Pinch-zoom probably zooms the *page*, not the canvas (wheel handler only, no `gesturestart` / touch pinch).
- Shift-drag-to-pan is a desktop gesture; doesn't exist on touch.
- A 1000×1000 canvas fit to a 360px viewport = 0.36px per cell. Selecting a single pixel is physically impossible.
- The buy form sits *below* the canvas after the responsive collapse — you select, scroll, fill the form, scroll back to verify, scroll down again to submit.
- **Outcome:** mobile user gives up before they pick a pixel.

### 1.5 The Existing Owner ("where's my pixel? did anyone visit it?")

- Once you buy, there's no "My pixels" page, no link back to your block, no stats.
- You can't even find your own pixels without remembering the (x,y) coords from the receipt email.
- **Outcome:** no return visits, no second purchases.

### 1.6 Other paper cuts

- **Pan gesture is hidden behind Shift** — users won't discover it. Default click-drag should pan; click without drag should select.
- **No undo on selection** when you misclick at high zoom — you have to click the exact same pixel again to deselect, easy to miss.
- **No keyboard nav** — `+/-` for zoom, arrows to pan, `R` for random would all be free wins.
- **Hover tooltip flashes off every time** the cursor crosses a sold/unsold boundary because the innerHTML is rewritten.
- **Bundle discount UX** is silent until you've selected ≥10. Users don't know it exists.
- **Tab navigation loses canvas state** — switching to Leaderboard and back resets your zoom/pan visually if the user expected persistence (it actually persists, but the panels swap mid-interaction with no indication).
- **The "click owned pixel = open link" behavior is invisible**. Users learn this by accident, if at all.
- **No address-bar deep linking** — you can't share `/?at=420,500` or `/?owner=alice`.

---

## 2. The Ten Ideas, Ranked

Scoring rubric: **Impact** (1–5, how much it lifts conversion / engagement / retention) × **Feasibility** (1–5, ease to ship in current stack — vanilla JS, no framework, single `app.js`).
"Effort" is engineering days for one frontend dev.

| # | Idea | Impact | Effort | Feasibility | Score | Tier |
|---|---|---|---|---|---|---|
| 1 | **Mini-map + zoom presets** (Hot, Center, Random, Corner) | 5 | 1d | 5 | **25** | 🟢 Quick win |
| 2 | **Search by owner / link / coordinates** | 5 | 1d | 5 | **25** | 🟢 Quick win |
| 3 | **Mobile pinch-zoom + drag-pan + sticky buy bar** | 5 | 2d | 4 | **20** | 🟢 Quick win |
| 4 | **Heatmap overlay** ("show where pixels sold") | 4 | 1d | 5 | **20** | 🟡 Medium |
| 5 | **Sticky hover preview card** (owner, link, sold-when, "Buy next to this") | 4 | 1d | 5 | **20** | 🟡 Medium |
| 6 | **"My pixels" page** + deep links `/?at=x,y` and `/?owner=…` | 4 | 1.5d | 4 | **16** | 🟡 Medium |
| 7 | **Leaderboard upgrades** — sort by recency / size / spend, click row → zoom to their pixels | 3 | 0.5d | 5 | **15** | 🟢 Quick win |
| 8 | **Post-purchase share moment** — auto-generated card with their pixel + URL | 4 | 1.5d | 3 | **12** | 🟡 Medium |
| 9 | **Default-drag-to-pan** (remove the Shift modifier) + keyboard shortcuts | 3 | 0.25d | 5 | **15** | 🟢 Quick win |
| 10 | **Color filter / "show only red pixels"** | 2 | 0.5d | 5 | **10** | 🔵 Nice-to-have |

### Top 3 quick wins (ship this week)

1. Mini-map + zoom presets
2. Search bar
3. Default-drag-to-pan + keyboard shortcuts (this is half a day and unlocks everything else)

### Top 3 medium-term (next 2 weeks)

1. Mobile pinch/pan/sticky-bar rewrite
2. Heatmap overlay + hover preview card
3. "My pixels" + deep links + post-purchase share card

---

## 3. Wireframes (ASCII, but they tell the story)

### 3.1 Mini-map + Zoom Presets (desktop)

The mini-map sits in the top-right corner of the canvas plate. Always visible. The lit rectangle shows the current viewport. Click anywhere on it to teleport. Below the canvas, a row of *preset* buttons.

```
 ┌──────────────────────────────── canvas plate ────────────────────────────────┐
 │                                                                  ┌────────┐  │
 │                                                                  │ ░░░░░  │  │
 │                                                                  │ ░██░░  │  │  ← mini-map (180×180)
 │                                                                  │ ░░░░░  │  │     red rect = viewport
 │                  (1000 × 1000 canvas, panned/zoomed)             │ ░░░▓░  │  │     dots = sold pixels
 │                                                                  │  ▓▓ ░  │  │
 │                                                                  └────────┘  │
 │                                                                              │
 │                                                                              │
 │                                                                  [＋][－][⤢]  │
 └──────────────────────────────────────────────────────────────────────────────┘
   ── jump to ─────────────────────────────────────────────────────────────────
   ⌖ Center    🔥 Hot zone    🎯 Trending    🎲 Random spot    ◧ Corner
```

**Behavior:**
- Mini-map: renders a 100× downsample of the pixel grid (10,000 cells → 100×100 imageData). Updates whenever pixels load. Cheap.
- Red outline shows current viewport in mini-map space. Click to recenter pan to that point.
- Hot zone = densest 50×50 region of recent purchases. Trending = highest sales velocity last 24h.
- Random spot = pick an *empty* pixel at random with a fresh selection seeded.

### 3.2 Search bar (slot into the existing ticker rail)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ LIVE  Current: $1.00 / pixel · 12,847 sold of 1,000,000                     │
│ ─────────────────────────────────────────────────────────────────────────── │
│ 🔍  [ Search owners, links, or x,y       ]   [ ↳ Find ]                     │
└─────────────────────────────────────────────────────────────────────────────┘

  Search "alice" →  3 results
  ┌─ alice         · 482 pixels    · last bought 2h ago   → [ Zoom to ] ─┐
  ├─ alice.eth     · 12 pixels     · linked to alice.eth  → [ Zoom to ] ─┤
  └─ Alice Cooper  · 1 pixel       · (420, 690)           → [ Zoom to ] ─┘
```

**Behavior:**
- One input. Recognizes:
  - `alice` → owner_name fuzzy match
  - `alice.eth` or `https://...` → link substring match
  - `420,690` or `420, 690` → jump to coordinates
- "Zoom to" sets zoom = 12, pan = centered on that owner's bounding box, draws a temporary 2px vermillion outline around their pixels.

### 3.3 Mobile rewrite (sticky buy bar)

The current layout: canvas, then sidebar collapses below. On mobile, instead:

```
 ┌──────────────────────────────────────┐
 │   HEADER (collapsible)               │
 ├──────────────────────────────────────┤
 │                                      │
 │                                      │
 │         CANVAS (full width)          │
 │        with pinch / pan / tap        │
 │                                      │
 │              ┌─────┐                 │
 │              │mini │ (collapsible)   │
 │              └─────┘                 │
 ├──────────────────────────────────────┤  ← sticky bottom sheet
 │ 7 pixels · $7.00     [ Pick color ▾ ]│     when selection > 0
 │                          [ Buy → ]   │     expands on tap
 └──────────────────────────────────────┘
```

**Behavior:**
- Replace shift-drag with default drag-to-pan (single touch), tap to select.
- Two-finger pinch zooms (handle `touchstart`/`touchmove` with two touches, compute distance ratio against pinch start, apply to `zoom`).
- A sticky bottom sheet appears the instant selection is non-empty. Tap to expand the full order form as a sheet — never makes the user scroll past the canvas.

### 3.4 Hover preview card (desktop, on owned pixels)

```
                         ╔════════════════════════╗
                         ║ (420, 690)             ║
                         ║ ━━━━━━━━━━━━━━━━━━━━━━ ║
                         ║ Alice Cooper           ║
                         ║ alice.example          ║
                         ║ bought 2h ago · $1.00  ║
                         ║                        ║
                         ║ [ Visit ↗ ] [ Buy next ]║
                         ╚════════════════════════╝
                              ▼
                            ░██░ ← cursor
```

**Behavior:**
- Replaces the current micro tooltip on sold pixels.
- "Buy next" pre-selects an adjacent empty pixel and opens the sidebar.
- Throttled to 60ms; hidden when cursor leaves canvas.

### 3.5 Heatmap toggle

```
  ┌─ Overlay ──────────────────────────────────┐
  │  ○ Off    ● Heatmap    ○ Recent (24h)      │
  └────────────────────────────────────────────┘
```

Heatmap: render a second canvas on top, alpha ~0.35, using a vermillion-to-cream gradient based on sales density in 20×20 blocks. Off by default to preserve the editorial whiteness. Toggle as a quiet control under the canvas.

---

## 4. Implementation Notes (for Frontend Agent)

These are constraints to respect and concrete plays to make.

### 4.1 Architectural constraints

- Single `app.js`, vanilla JS, no framework. **Keep it that way.** Don't introduce React for these features.
- `style.css` is ~22KB and intentionally restrained. Stay on-palette: paper, ink, vermillion. No new colors. No glows.
- Pixels are already cached in `pixels` Map and refreshed every 20s. Reuse it.
- The canvas is `width=1000 height=1000` and styled with CSS `transform: scale()`. The existing zoom logic works; we just need more on top.

### 4.2 Mini-map (small)

- Add `<canvas id="minimap" width="200" height="200">` positioned `absolute; top: 12px; right: 12px` inside `.grid-wrap`.
- On every `drawAll()`, also paint to minimap: for each owned pixel, paint to `Math.floor(x/5), Math.floor(y/5)` (5px → 1 minimap px). Single pass over the Map.
- Draw the viewport rect: rect at `(panX_canvas / 5, panY_canvas / 5)` with width = `(viewport_w / zoom) / 5`. (Need to be careful with the pan↔canvas-coordinate math.)
- Add click handler: convert minimap click → canvas coords → `panX/panY` recenter.

### 4.3 Search

- New API endpoint `/api/search?q=alice` — Supabase query against `pixels` (owner_name ilike, link ilike) and `buyers` (display_name ilike). Cap 20 results.
- Coord regex: `/^\s*(\d{1,4})\s*,\s*(\d{1,4})\s*$/`. If match, no API call, just zoom-to.
- "Zoom to owner" = compute bounding box from their pixels, set zoom such that the box fits with 20% padding, center pan.

### 4.4 Default drag-to-pan (one-line ergonomic win)

In `pointermove`, the current condition is:
```js
if (e.buttons & 1 && (e.shiftKey || e.metaKey || e.ctrlKey)) { /* pan */ }
```
Change to: **always pan if moved > 4px before pointerup**. The existing `didDrag` flag already prevents a pan-release from being treated as a click. The fix is one boolean.

### 4.5 Mobile pinch/zoom

- Listen for `touchstart`. If `touches.length === 2`, capture initial distance + midpoint, set a `pinching = true` flag.
- On `touchmove` with 2 touches, compute new distance, `newZoom = oldZoom * (newDist/startDist)`, clamp, recenter pan to keep midpoint stable. Same math as the wheel handler.
- Single touch → drag pans (use existing pointer events; they already fire on touch).
- Add `touch-action: none` on `.grid-wrap` so the browser doesn't intercept.

### 4.6 Sticky mobile buy bar

- Add `<div class="mobile-buybar" hidden>` outside `<main>`, fixed to bottom of viewport.
- When `selection.size > 0` and viewport <760px, show it. Three slots: count+total, color swatch, Buy button.
- Tap "Buy" expands the existing `#selectionPanel` as a `position:fixed` bottom sheet (slide up). Same DOM, different layout class.

### 4.7 Hover preview card

- Reuse `#hoverInfo` but expand it to a card when over a sold pixel.
- Throttle `mousemove` to 60ms. Skip re-render if the (x,y) cell hasn't changed.
- "Buy next to this" iterates 8 neighbors, picks the first empty one, calls `togglePixel(nx, ny)`, opens sidebar.

### 4.8 Heatmap overlay

- Second `<canvas>` stacked above the main grid, with `pointer-events: none`.
- Compute 20×20 block density once (or on `loadPixels`), render a 50×50 imageData with per-block alpha. Hidden by default.
- Tri-state toggle next to ticker: Off / Heatmap / Recent-24h.

### 4.9 Leaderboard upgrades (cheap)

- Add tabs to the leaderboard panel: **Top spenders** | **Most pixels** | **Newest buyers**.
- Each row gets a `→ View on canvas` button → triggers search-zoom-to flow.

### 4.10 Deep links

- On load, parse `?at=420,500` → zoom 12, center on (420,500), drop a vermillion ring.
- Parse `?owner=alice` → call search API, zoom to bounding box.
- This is also what we generate as the post-purchase share card URL.

### 4.11 Post-purchase share card (later)

- Server-rendered OG image at `/api/og?pixel=420,500` returning a PNG with the canvas, the pixel highlighted, and the owner's name. Vercel OG library does this well.
- Success banner adds: `Share your pixel: [ Twitter ] [ Copy link ]` with the deep link.

### 4.12 Things to NOT do

- Don't add a tutorial overlay/modal. The site is editorial — overlays would shred the tone.
- Don't add toasts for every action. The sidebar updates *are* the feedback.
- Don't introduce dark mode. The cream/ink palette is the brand.
- Don't add login. The email-on-purchase model is part of the charm. ("My pixels" can use a magic-link email if needed.)

---

## 5. Suggested Build Order

**Week 1 (quick wins, ~3 days):**
1. Default drag-to-pan + keyboard shortcuts (½ day) — unlocks everything else
2. Mini-map + zoom presets (1 day)
3. Search bar + coord-jump + deep links `?at=` and `?owner=` (1 day)
4. Leaderboard sort tabs + "View on canvas" (½ day)

**Week 2 (mobile + discovery, ~4 days):**
5. Mobile pinch/pan + sticky bottom sheet (2 days)
6. Heatmap toggle + recent-24h overlay (1 day)
7. Hover preview card with "Buy next" (1 day)

**Week 3 (retention, ~2 days):**
8. "My pixels" page (magic link or just `?email=` token) (1 day)
9. Post-purchase share card + OG image (1 day)

Skip color filter and other low-impact items unless they ride along for free.

---

## 6. Metrics to Watch

After shipping, instrument these. The `events` table already exists — add event types:

- `pixel_view` (already planned) — fired on canvas first paint
- `search_query` — what people search for tells us what naming conventions matter
- `zoom_preset_used` — which presets are useful, which aren't
- `selection_started` / `selection_abandoned` — funnel from click to buy
- `mobile_pinch_used` — confirms the mobile rewrite is paying off
- `share_card_view` — viral coefficient

**North-star metric:** % of canvas visitors who add at least one pixel to selection. Currently unmeasured — likely under 5%. Target after these changes: 15%.

**Conversion metric:** selection → paid checkout. Likely ~30% today (the order form is well-designed). Target: 40%.

---

## 7. Handoff Notes for the Frontend Agent

- Everything in this doc is additive. Don't refactor existing code unless it's literally one line (e.g., the Shift-drag fix).
- All new UI elements must use the existing CSS variables (`--paper`, `--ink`, `--mark`, `--paper-edge`, etc.) — see DESIGN.md.
- New numeric values must be set in `JetBrains Mono`. New labels in `Inter`. New display text in `Fraunces`.
- Solid ink shadows (`4px 4px 0 var(--ink)`), zero border-radius, no gradients, no glows.
- For each feature, start with the desktop wireframe in §3 and degrade gracefully to mobile.
- Commit each quick-win as its own PR so we can ship them independently.

— UX Agent · May 13, 2026
