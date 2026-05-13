# Million Pixels — Payout Schedule

**Owner:** Revenue Agent
**Status:** Sprint 2 deliverable

---

## Inbound (money to us)

### Gumroad → Travis's bank

- **Cadence:** Weekly, every Friday
- **Holdback:** First $1,000 of lifetime sales held for 7 days (Gumroad standard)
- **Payment methods:** PayPal (instant), direct deposit (1–3 days), Stripe (US only)
- **Fee:** 10% flat, deducted before payout
- **Refund reserve:** Gumroad holds 0% (we manage reserve internally)

### Stripe → Travis's bank (when active)

- **Cadence:** 2-day rolling (default for new accounts), 7-day after Stripe risk review
- **Holdback:** Stripe Reserve (5%, rolling 60 days) — likely for first 90 days due to "high-risk-like" pattern (viral product, novel use case)
- **Payment methods:** ACH (1–2 days), Wire (same day, $25 fee), Instant ($0.15 + 1% fee)
- **Fee:** 2.9% + $0.30 per transaction
- **Recommended:** Set up dedicated business checking; don't comingle

---

## Outbound (money from us)

### Standard referrals (anyone)

| Aspect | Setting |
|---|---|
| Cadence | Monthly batch |
| Run date | 5th of each month, 09:00 PT |
| Period covered | Prior calendar month |
| Min payout | $50 USD |
| Methods | PayPal Payouts API (auto), Wise (manual fallback) |
| Currency | USD |
| Tax docs | 1099-NEC issued in January for any payee ≥ $600/year (US) |

**Carryover:** Sub-$50 balances roll to next month indefinitely.

### Influencer affiliates (vetted creators)

| Aspect | Setting |
|---|---|
| Cadence | Net-15 (twice monthly) |
| Run dates | 15th and last day of each month |
| Period covered | Trailing 2 weeks |
| Min payout | $0 (always pay) |
| Methods | Per-influencer (PayPal, Wise, Stripe Connect) |
| Currency | USD or local (Wise) |
| Tax docs | 1099-NEC for US payees ≥ $600/year |

### Sponsor refunds (when applicable)

- Within 48 hours of purchase if placement hasn't started: full
- Prorated refunds for placement breaches: within 7 days of complaint

### Buyer refunds

- See `13-REFUND-DISPUTE-POLICY.md`
- Processed within 24 hours of approval, paid via original method (Gumroad/Stripe)

---

## Cash Flow Calendar (typical month)

| Day | Event | Direction |
|----:|---|---|
| 1   | Stripe rolling holdback releases prior 30 days | → in |
| 5   | Pay standard referrals (prior month) | → out |
| 15  | Pay influencer affiliates (1st half of month) | → out |
| Every Fri | Gumroad weekly payout arrives | → in |
| Every Tue | Stripe 2-day payout arrives | → in |
| Last day | Pay influencer affiliates (2nd half of month) | → out |
| Last day | Reconcile + close books for month | → admin |

---

## Bank Account Structure

Recommended setup (open Day 0):

1. **Operating account** (business checking) — daily ops, receives all payouts
2. **Reserve account** (separate, same bank) — 5% of gross gets auto-swept here weekly for refund/dispute buffer
3. **Tax account** (high-yield savings) — 30% of net gets auto-swept here monthly for quarterly taxes
4. **Payouts account** (separate checking, $5K float) — funds all outbound payouts; topped up monthly

Auto-sweeps run on the 5th of each month via cron:

```javascript
// cron/cash-management.js (advisory; humans actually move money)
// Generates a monthly cash-movement report for Travis to execute
async function monthlyReport() {
  const grossLastMonth = await db.revenue.lastMonth();
  const refundsLastMonth = await db.refunds.lastMonth();
  const payoutsToReferrers = await db.commissions.pendingForMonth();
  const stripeAndGumroadFees = grossLastMonth.fees;
  const netRevenue = grossLastMonth.amount - refundsLastMonth - payoutsToReferrers - fees;
  
  const reserveTransfer = Math.round(grossLastMonth.amount * 0.05);
  const taxTransfer = Math.round(netRevenue * 0.30);
  
  await emailTravis({
    subject: `Million Pixels — Cash Management Report ${prevMonthName}`,
    body: `
      Gross revenue last month: $${grossLastMonth.amount / 100}
      Refunds: $${refundsLastMonth / 100}
      Fees (Gumroad + Stripe): $${stripeAndGumroadFees / 100}
      Pending referral payouts: $${payoutsToReferrers / 100}
      Net revenue: $${netRevenue / 100}
      
      Recommended movements:
      → Move $${reserveTransfer / 100} to Reserve account (5% of gross)
      → Move $${taxTransfer / 100} to Tax account (30% of net)
      → Top up Payouts account to $5K float (current balance: $X)
      
      Take 1 hour today to execute and acknowledge.
    `,
  });
}
```

---

## Tax Notes (US LLC, single-member, pass-through)

- **Quarterly estimated taxes:** Due 4/15, 6/15, 9/15, 1/15 next year
- **Withhold ~30% of net** for federal + state (CA is ~13%, federal varies)
- **1099-NEC** for any contractor paid ≥ $600/year (referrers, influencers, vendors)
  - File via Track1099 or Tax1099 in January
- **Sales tax:** Pixel sales = digital goods. Stripe Tax (or Gumroad Tax) handles state-by-state collection + remittance. Verify enabled before launch.
- **VAT (EU):** Gumroad handles for EU buyers automatically. Stripe Tax also.

**Recommendation:** Hire a CPA quarterly (~$500/qtr) once revenue ≥ $50K/mo. Stripe/Gumroad reports + good bookkeeping → minimal pain.

---

## Edge Cases

- **Negative monthly net** (high refund spike): no referral payouts that month, refund reserve covers gap
- **Stripe account freeze:** Gumroad payouts continue, referral payouts continue from Operating account
- **Bank fraud / dispute on inbound payouts:** halt outbound payouts until cleared, alert ops
- **International payouts > $10K/year**: trigger Wise + FinCEN compliance review
- **W-9 / W-8 collection:** required from any contractor before first payout; block payouts in dashboard until on file
