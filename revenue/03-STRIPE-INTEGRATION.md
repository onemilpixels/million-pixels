# Million Pixels — Stripe Integration Spec

**Status:** Spec ready. Awaiting Stripe keys from Travis (Chief Orchestrator).
**Stack assumption:** Node.js backend (Stripe SDK v14+), Postgres, Redis for locks.

---

## 1. Stripe Products We Use

| Product | Purpose |
|---------|---------|
| **Checkout Sessions** | Primary purchase flow. Hosted, PCI-compliant, low-friction. |
| **Payment Intents** (fallback) | For custom in-page checkout if conversion data warrants it later. |
| **Webhooks** | Source of truth for payment success/failure. |
| **Stripe Connect Express** | Referral payouts to 3rd-party referrers. |
| **Stripe Radar** | Fraud detection. Custom rules for wash-trading. |
| **Stripe Tax** | Auto-calculate sales tax (US + EU VAT). |
| **Customer Portal** | Self-serve refunds, receipts. |

---

## 2. Required Stripe Keys (from Travis)

Provide these via secure channel (NOT this file, NOT git):
- `STRIPE_SECRET_KEY` (live + test)
- `STRIPE_PUBLISHABLE_KEY` (live + test)
- `STRIPE_WEBHOOK_SECRET` (one per endpoint)
- `STRIPE_CONNECT_CLIENT_ID` (for referral payouts)

Store in: env vars (production), `.env.local` (dev). **Never commit.**

---

## 3. Purchase Flow (Happy Path)

```
[1] User selects pixels on grid
    ↓
[2] Frontend POSTs /api/checkout with { pixel_ids, referral_code }
    ↓
[3] Backend:
    - Validates pixel_ids are available (not already sold/locked)
    - Acquires Redis lock on pixel_ids (60s TTL)
    - Calculates price using tier model + bundle discount
    - Creates Stripe Checkout Session
      - line_items: dynamic price (price_data inline, no pre-created price)
      - metadata: { pixel_ids, referral_code, user_id, lock_id }
      - success_url: /pixels/success?session_id={CHECKOUT_SESSION_ID}
      - cancel_url: /pixels/cancel?session_id={CHECKOUT_SESSION_ID}
      - expires_at: now + 60s (matches Redis lock)
    - Returns { checkout_url, session_id }
    ↓
[4] Frontend redirects to Stripe Checkout
    ↓
[5] User pays
    ↓
[6] Stripe sends webhook: checkout.session.completed
    ↓
[7] Webhook handler:
    - Verifies signature
    - Idempotency check (session_id already processed?)
    - Atomically: insert into purchases, mark pixels as sold, release lock
    - Credit referrer (if referral_code present)
    - Send confirmation email
    - Update live counters (pub/sub to dashboard + grid)
```

---

## 4. Edge Cases & Error Recovery

### Payment fails / abandoned checkout
- Stripe sends `checkout.session.expired` after 60s
- Webhook releases Redis lock
- Pixels return to available pool
- (Optional) Email user with "your selection is still available" + 1-click checkout

### Webhook fails to deliver
- Stripe retries with exponential backoff (3 days)
- We expose `/admin/stripe/replay-events` for manual recovery
- Daily reconciliation job: compare Stripe charges vs DB purchases, alert on mismatch

### Double-purchase race condition
- **Prevention:** Redis SETNX lock on pixel_ids during checkout creation
- **Detection:** UNIQUE constraint on `purchases.pixel_id` (composite if multi-pixel)
- **If it happens:** auto-refund the 2nd buyer, email apology + 50% coupon

### Refund flow
- 30-day window for "unclaimed pixel data" (i.e., user didn't upload image)
- Stripe Customer Portal handles user-initiated refunds
- Webhook: `charge.refunded` → mark pixels available, reverse referral commission
- After 7 days, commission is locked (referrer keeps it even on refund — published policy)

### Dispute / chargeback
- Stripe webhook: `charge.dispute.created`
- Auto-respond with evidence: purchase timestamp, IP, pixel coordinates, email receipt
- If lost: pixels marked "disputed" (not resellable until resolved)

### Card declined / insufficient funds
- Stripe Checkout shows error in-flow, user retries
- We log `payment_intent.payment_failed` for analytics
- Track decline reasons → identify if Radar rules are too aggressive

### Stripe outage
- Display banner: "Payment system temporarily unavailable. Your selection is reserved for 5 minutes."
- Extend Redis locks to 5 min during outage
- Queue webhook events locally if our endpoint is up but DB is down

---

## 5. Webhook Endpoints

Single endpoint: `POST /api/stripe/webhook`
Subscribed events:
- `checkout.session.completed` ✅ critical
- `checkout.session.expired`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`
- `payment_intent.payment_failed`
- `account.updated` (Stripe Connect — referrer onboarding)
- `payout.paid` / `payout.failed` (referrer payouts)

**Verify signature on every request.** Reject if missing/invalid.
**Idempotency:** store `event.id` in `processed_stripe_events` table, 30-day TTL.

---

## 6. Stripe Radar Custom Rules

Recommended rules to add in Stripe dashboard:

```
Block if: :card_count_for_email_hourly: > 5
Review if: :risk_level: = 'elevated' AND :amount: > 10000
Block if: :ip_country: != :card_country: AND :amount: > 5000
Review if: :email: matches referrer's email (self-referral attempt)
Block if: same payment_method used by >3 different emails in 24h
```

---

## 7. Stripe Tax Setup

- Enable Stripe Tax in dashboard
- Register tax IDs in: California (home), then auto-register as nexus triggered
- Pixels are **digital goods** → taxable in ~40 US states + EU/UK/AU
- Show tax-inclusive pricing in EU (legal req), tax-exclusive in US (norm)

---

## 8. Stripe Connect (Referral Payouts)

- Use **Express accounts** (Stripe handles KYC, 1099s, payout UI)
- Onboarding flow: referrer hits $100 threshold → email "claim your earnings" → Stripe-hosted onboarding (~3 min)
- Monthly batch payout on the 5th
- Platform fee: $0 (we eat Stripe's 0.25% + $2 per payout to keep referrers happy)

---

## 9. Implementation Order (Day 1–7)

| Day | Task |
|----:|------|
| 1   | Stripe account setup, Radar rules, Tax registration |
| 1   | Backend: checkout session creation endpoint |
| 2   | Webhook handler + signature verification + idempotency |
| 2   | Pixel reservation (Redis locks) + race condition tests |
| 3   | Frontend: pixel selection → checkout redirect |
| 3   | Success/cancel pages |
| 4   | Referral attribution + commission credit on webhook |
| 4   | Stripe Connect Express onboarding flow |
| 5   | Refund handling + admin override |
| 5   | Dispute auto-response |
| 6   | Reconciliation job (Stripe vs DB nightly) |
| 6   | End-to-end test (test mode): buy → refund → re-buy |
| 7   | Switch to live keys, soft launch |

---

## 10. Monitoring & Alerts

Wire to Slack/Discord webhook:
- 🚨 Webhook signature failure (potential attack)
- 🚨 Reconciliation mismatch (>1 record difference)
- 🚨 Refund rate > 5% in 24h
- 🚨 Decline rate > 15% in 1h (Radar misfire?)
- 📊 Daily revenue summary at 09:00 PT
- 🎉 Tier transition notification (Tier N → N+1)

---

## Open Questions for Travis

1. **Stripe account:** new dedicated one for Million Pixels, or use existing?
2. **Business entity:** LLC formed? Needed for Stripe + tax registration.
3. **Bank account:** dedicated business checking for payouts?
4. **Tech stack confirmation:** Node.js OK? Or prefer Python/Go/Rails?
5. **Hosting:** Vercel/Railway/AWS? Affects webhook latency.
