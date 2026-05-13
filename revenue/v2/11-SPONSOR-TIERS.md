# Million Pixels — Sponsor / Premium Tier Pricing

**Owner:** Revenue Agent
**Status:** Sprint 1 deliverable
**Purpose:** Monetize beyond pixel sales. Capture brand/advertiser budgets that wouldn't translate to pixel purchases.

---

## TL;DR

Pixel sales are the engine. **Sponsor tiers are pure-margin add-ons** sold alongside (or instead of) pixel buys to brands, influencers, and ego-buyers.

Per brief, three core SKUs:

| SKU | Price | What you get |
|---|---:|---|
| Logo on Leaderboard | $500 | Logo + link on top-of-page leaderboard for 30 days |
| Featured Pixel Notification | $100 | Push/email notification to all buyers when pixel goes live |
| Daily Shoutout | $200 | Featured slot on social + email for 24 hours |

I'm extending with **6 more tiers** below to capture larger budgets and create an upsell ladder.

---

## Full Sponsor Catalog

### Tier 0 — Free / Built-in

| SKU | Price | What you get |
|---|---:|---|
| Pixel display | $0 (included with pixel) | Color + link on grid |

### Tier 1 — Awareness ($100–$500)

| SKU | Price | Duration | What you get |
|---|---:|---|---|
| Featured Pixel Notification | $100 | one-time | Push notification + email blast to all buyers when your pixel goes live |
| Hover Card Upgrade | $150 | permanent | Custom 200x100 hover preview when someone hovers over your pixels (instead of default tooltip) |
| Daily Shoutout | $200 | 24h | Featured spot in daily email + 1 tweet from official @ + Discord/Slack pin |
| Live Stream Mention | $300 | one-time | 30-second shoutout during weekly Twitch/YouTube grid stream |
| Leaderboard Logo | $500 | 30 days | Logo (40x40) + link in top-10 leaderboard sidebar |

### Tier 2 — Presence ($500–$5,000)

| SKU | Price | Duration | What you get |
|---|---:|---|---|
| Weekly Newsletter Sponsor | $1,000 | 1 week | Top banner in weekly email (target ~10k buyers by week 4) |
| Grid Region Sponsor | $2,500 | 90 days | Subtle "Powered by [you]" badge on a 100x100 sub-region of grid you own |
| Site-wide Banner | $3,000 | 7 days | Top-of-page banner (728x90) site-wide |
| Custom Color Palette | $1,500 | one-time | Site-wide accent color matches your brand for 24 hours |

### Tier 3 — Whale ($5,000+)

| SKU | Price | What you get |
|---|---:|---|
| Title Sponsor — Day | $5,000 | Site name appears as "Million Pixels presented by [You]" for one full day |
| Title Sponsor — Week | $25,000 | Same, for 7 days |
| Naming Rights — Section | $10,000 | A named 200x200 region: "The [You] Quarter" forever |
| Custom Activation | $25,000+ | Bespoke — e.g., contest, sweepstakes, integration, etc. Quote per case. |

---

## Bundle Discounts (sponsorship)

| Bundle | Discount | Contents |
|---|---:|---|
| Starter Pack | 15% off | Featured Pixel + Daily Shoutout + Leaderboard Logo = $680 (saves $120) |
| Brand Activation Pack | 20% off | Leaderboard Logo + Newsletter Sponsor + Region Sponsor = $3,200 (saves $800) |
| Whale Pack | 25% off | Title Sponsor Week + Naming Rights + Custom Activation = $45,000 (saves $15,000) |

---

## Sales Process

- **Self-serve:** Tier 1 SKUs are on Gumroad as one-off products. Anyone can buy.
- **Inbound:** Tier 2 SKUs require email-to-purchase via `sponsors@millionpixels.com`. We send invoice.
- **Outbound:** Tier 3 SKUs we proactively pitch. Target: agencies, fintech, NFT-adjacent brands, podcasts.

---

## Estimated Revenue Contribution (Day 90)

Assuming we close:

| Tier 1 SKUs |  $/mo target | Day 90 contribution |
|---|---:|---:|
| 20× Featured Pixel Notification | $2K/mo | $6K |
| 10× Daily Shoutout | $2K/mo | $6K |
| 5× Leaderboard Logo | $2.5K/mo | $7.5K |
| 5× Hover Card | $750/mo | $2.3K |
| **Tier 1 subtotal** | $7.25K/mo | **~$22K** |

| Tier 2 SKUs | qty Day 90 | revenue |
|---|---:|---:|
| Newsletter Sponsor | 6 | $6K |
| Region Sponsor | 3 | $7.5K |
| Site-wide Banner | 4 | $12K |
| **Tier 2 subtotal** | | **~$25K** |

| Tier 3 SKUs | qty Day 90 | revenue |
|---|---:|---:|
| Title Sponsor Day | 5 | $25K |
| Title Sponsor Week | 1 | $25K |
| Naming Rights | 2 | $20K |
| Custom Activation | 1 | $25K |
| **Tier 3 subtotal** | | **~$95K** |

**Total sponsor revenue by Day 90 (target): ~$142K (~14% of $1M goal)**

This is pure upside that doesn't consume pixel inventory.

---

## Implementation Notes

- Each SKU = separate Gumroad product (or variant)
- Sponsor purchases write to `sponsors` table:

```sql
create table sponsors (
  id bigserial primary key,
  sku text not null,
  buyer_email text not null,
  brand_name text not null,
  brand_logo_url text,
  link_url text,
  starts_at timestamptz,
  ends_at timestamptz,
  price_cents int not null,
  gumroad_sale_id text unique,
  status text default 'pending',  -- pending | active | expired | cancelled
  custom_fields jsonb,
  created_at timestamptz default now()
);
create index sponsors_active_idx on sponsors (sku, status, starts_at, ends_at);
```

- Cron job promotes `pending → active` when `starts_at <= now()`, and `active → expired` when `ends_at <= now()`
- Frontend reads active sponsors per slot type at render time
- All sponsor placements clearly labeled "Sponsor" or "Featured" per FTC guidelines

---

## Sponsor Content Policy

- No competitor pixel-art sites
- No ToS-prohibited categories (CSAM, hate, illegal weapons, etc.)
- Reserve right to reject any sponsor with 48h refund
- All ad creative reviewed before placement (manual, 24h SLA)
