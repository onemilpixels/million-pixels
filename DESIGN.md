# Million Pixels — Design Philosophy

> "The Daily Canvas." Editorial, printed, deliberate.

## Why this direction

The product is a **cultural artifact**: a million-pixel canvas you stake a claim on, descended from the *Million Dollar Homepage* (2005). It's not a SaaS dashboard. It's not a crypto launchpad. So it shouldn't *look* like one.

The previous design — saturated cyan + magenta gradients, glassmorphism, pulsing glows on every element — is the visual fingerprint of "AI generated this in 90 seconds." It's also what every Vercel-hosted product looks like in 2026.

This redesign goes the other way: **printed matter**. Black ink, cream paper, one accent in vermillion red — like a magazine editor's correction pen. The site reads like an editorial column with a tear-out order form, not a neon casino.

## The three rules

1. **No glow. No gradient. No glass.** Every effect from the previous design is gone. Effects are replaced with *structure* — rules, dotted lines, hairline borders, drop shadows in solid ink.
2. **Typography does the work.** Three intentional typefaces, each with a job:
   - **Fraunces** (serif, italic-leaning) — display, drop caps, prices, emphasis
   - **Inter** (humanist sans) — UI labels, buttons, body
   - **JetBrains Mono** — all numbers, codes, tickers, form inputs
3. **One accent, used like a pen mark.** `#c0392b` (vermillion) appears only on: the masthead logo offset, the live-ticker tag, hover-state buttons, the order total, drop caps, and a few list bullets. Nowhere else. Restraint is the point.

## Palette

```
Paper        #f3ece1   warm cream (aged newsprint)
Paper-2      #ece4d6   panel backgrounds
Paper-edge   #d9cfbd   hairline column rules
Ink          #18140f   primary text & frames
Ink-2        #3a342b   body text
Ink-3        #6b6356   meta / captions
Rule         #1a1611   hard horizontal rules
Mark         #c0392b   the accent (vermillion)
Mark-ink     #8a2a1f   accent hover
```

Background is a faint SVG-noise paper texture (~6% opacity, repeated 240px tiles). It's there to break the digital flatness — barely perceptible, never distracting.

## Font stack

```
Display:  'Fraunces', 'Times New Roman', serif
Body:     'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif
Mono:     'JetBrains Mono', ui-monospace, monospace
```

All three are loaded from Google Fonts in one `@import`. No icon fonts, no design system libraries, no Tailwind, no React. Total CSS: ~22KB.

## Signature elements

These are the things that make it feel *designed*, not computed:

- **Offset drop shadows in solid ink** instead of soft blurs. The canvas frame, the sidebar, and the buy button all sit on a hard 4–8px ink shadow. It reads as a print artifact (registration offset, letterpress impression) rather than digital depth.
- **The "ORDER FORM · NO. 001" perforation strip** at the top of the sidebar. Tear-out card from a magazine. Dashed border on the bottom edge. Tiny, but it's the kind of detail you don't get from a default theme.
- **The LIVE ticker** is set between two horizontal rules with a subtle vertical-line repeating gradient (like the ticker tape in a stock-page strap). A red "LIVE" tag punches it.
- **Drop cap** on the first paragraph of the About panel. Vermillion. Fraunces italic. 4.4rem. Floats left.
- **Em-dash credit lines.** Captions under the canvas plate are prefixed with a colored em-dash, like a photo credit.
- **The total price is set in Fraunces italic, vermillion, 1.5rem.** It looks like a handwritten figure on a printed receipt — the single moment of warmth in an otherwise rigorous order form.
- **Hover states use solid color swaps**, never glows. Buttons translate -1px and the shadow shifts color. It feels physical.

## Rhythm

- **Baseline:** 8px. All vertical spacing is a multiple of 8.
- **Body line height:** 1.55–1.65 for prose, 1.1 for data.
- **Max measure:** 64ch for body copy. Anything wider is uncomfortable.
- **Headings** use small-caps + tracking (0.14–0.22em) for UI-level h3s, full-size italic Fraunces for display h2s. Two distinct voices, no in-between.

## Layout

- **Header**: 3-column grid (brand · nav · stats), sticky, double-rule under it.
- **Grid page**: 1fr + 340px sidebar (the order form).
- **Canvas**: white plate inside a black ink frame with an 8px offset shadow.
- **Mobile (<760px)**: header stacks, sidebar drops below, shadows shrink. Same hierarchy, just compressed.

## What was killed

- All `--glow-*` variables.
- Every `linear-gradient(135deg, accent, accent-2)` heading.
- The pulsing logo animation.
- The shimmering button-sweep effect.
- The glassmorphic backdrop-filter blur.
- The ticker pulse-scale animation.
- The rounded corners (everywhere — radius is 0).
- The hover scale-up on stat cards.

## What was added

- Paper-noise background texture (inline SVG, no external request).
- Drop cap on About.
- Live ticker tag.
- Order-form perforation strip.
- Colophon footer with a ❦ ornament.
- A vermillion stamp shadow under the primary buy button.
- Drop shadows in solid ink everywhere shadows make sense.

## Accessibility

- Contrast: ink-on-paper is 14:1 (well past AAA).
- Vermillion on cream is 5.6:1 (AA large text). Used only for accents, not body.
- `prefers-reduced-motion: reduce` strips all animations to near-zero.
- Selection color is high-contrast (paper on vermillion).
- Focus state on inputs is a 3px vermillion offset shadow — visible without color alone (the shape changes).

## Performance

- Three Google Font families, one request.
- ~22KB CSS, uncompressed.
- One inline SVG noise pattern, no image requests.
- No JS changes — the existing `app.js` is untouched.

## The pitch in one sentence

It looks like a 1960s art-magazine commissioned the Million Dollar Homepage, and the editor used a red pen to mark up the layout.
