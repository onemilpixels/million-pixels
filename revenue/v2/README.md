# Million Pixels — Revenue Agent v2 Sprint Deliverables

**Sprint completed:** Sprints 1 + 2 (per Travis brief, 2026-05-13)
**Status:** All deliverables ready for activation. **Decision needed** on v1 vs v2 (see `99-V1-VS-V2-RECONCILIATION.md`).

---

## Contents

### Sprint 1 (next 24h)
| # | File | Status |
|---|---|---|
| 08 | `08-PRICING-MODEL-V2.md` | ✅ Simple $1 + escalator + bundles + referrals |
| 09 | `09-GUMROAD-INTEGRATION.md` | ✅ Full integration spec, ready for Tech Agent |
| 10a| `10-REVENUE-PROJECTIONS-V2.md` | ✅ Narrative + scenarios |
| 10b| `10-REVENUE-PROJECTIONS-V2.csv` | ✅ Daily-level projection spreadsheet |
| 11 | `11-SPONSOR-TIERS.md` | ✅ Logo/Featured/Shoutout + extended catalog |

### Sprint 2 (hours 24–48)
| # | File | Status |
|---|---|---|
| 12 | `12-PAYMENT-DASHBOARD.md` | ✅ Spec + SQL + alerts + daily report |
| 13 | `13-REFUND-DISPUTE-POLICY.md` | ✅ Public policy + ops SLA + email templates |
| 14 | `14-INFLUENCER-COMMISSION-SYSTEM.md` | ✅ Two-program design + schema + payouts |
| 15 | `15-STRIPE-BACKUP-FLOW.md` | ✅ Feature flag + v2 Stripe code + migration plan |
| 16 | `16-PAYOUT-SCHEDULE.md` | ✅ All inbound/outbound cadences + tax notes |
| 17 | `17-PAYMENT-FLOW-DIAGRAM.md` | ✅ Sequence diagrams + branching scenarios |

### Decision doc
| # | File | Status |
|---|---|---|
| 99 | `99-V1-VS-V2-RECONCILIATION.md` | ⚠️ **Needs Travis decision** |

---

## Top 3 Asks for Travis

1. **Decide v1 vs v2** (or hybrid). My recommendation: v2/Gumroad now, Stripe later. See doc 99.
2. **Gumroad account access** — create or share access. ETA 2 hours from there to live transactions.
3. **Marketing budget confirmation** — brief said $2K total. Flag: at that level, base-case is ~$800K, not $1M. Recommend raising to $20K by Day 30 if you want $1M confidence.

---

## Quick start (Path A — v2/Gumroad recommended)

```
1. Travis: create Gumroad account, add bank details, complete KYC          [30 min]
2. Travis: hand Revenue Agent the GUMROAD_ACCESS_TOKEN                     [5 min]
3. Tech Agent: create product + 7 variants on Gumroad                      [20 min]
4. Tech Agent: deploy /api/claim + /api/gumroad-webhook                    [40 min]
5. Tech Agent: deploy escalator cron + claim-expiry cron                   [15 min]
6. Revenue Agent: smoke test with $0.01 variant end-to-end                 [10 min]
7. Public launch                                                            [—]

Total: ~2 hours from "go" to live.
```

---

## Coordination with Tech Agent

Tech Agent should pick up:

- `09-GUMROAD-INTEGRATION.md` — endpoints to build
- `12-PAYMENT-DASHBOARD.md` — dashboard build
- `14-INFLUENCER-COMMISSION-SYSTEM.md` — DB schema migrations
- `15-STRIPE-BACKUP-FLOW.md` — feature flag wiring

I've left implementation code snippets in each doc. Tech Agent can refactor as needed.

---

## What's NOT in this sprint (deliberate)

- Specific email copy beyond templates
- Influencer outreach list (Travis to provide contacts)
- Landing page copy (Growth Agent's job)
- Acceptable Use Policy (already in repo root)
- Legal review of refund policy (recommend external counsel before launch)
- Branded creative for sponsor placements
