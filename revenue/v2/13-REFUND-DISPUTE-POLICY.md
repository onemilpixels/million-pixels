# Million Pixels — Refund & Dispute Policy

**Owner:** Revenue Agent → Travis (legal review recommended)
**Status:** Sprint 2 deliverable
**Effective date:** at launch

---

## Public-Facing Policy (goes on /refund-policy)

### Summary

We offer a **7-day refund window** for unused pixels. Once you upload pixel art and we render it on the grid, the sale is final.

### Eligible for full refund

You qualify for a 100% refund within **7 days of purchase** if **all** of these apply:

- You have not uploaded an image, color, or link for your pixels yet
- Your pixels have not yet been rendered on the public grid
- You email `refunds@millionpixels.com` from the email used at purchase
- It has been ≤7 days since purchase confirmation

### Not eligible for refund

- Pixels already displayed on the grid
- More than 7 days since purchase
- Any pixels that have been resold or transferred
- "Buyer's remorse" after upload
- Disputes about pricing tier (price was disclosed at purchase)
- Disputes about content moderation (we reserve the right to reject art per Acceptable Use Policy)

### Special cases (case-by-case review)

We may issue partial or full refunds outside the above window when:

- We rejected your art for policy violation and you choose not to upload alternate art
- Technical failure on our end prevented rendering
- Duplicate accidental purchase

### Sponsor / sponsor-tier refunds

- **Before placement starts:** full refund within 48 hours of purchase
- **Once placement is live:** prorated refund only if we breach contract (e.g., placement fails to display for >24h)

### Disputes / Chargebacks

If you initiate a chargeback before contacting us:

- Your pixels are immediately frozen (removed from grid pending resolution)
- We will provide all evidence to the payment processor
- Successful chargebacks reverse commissions earned by referrers from that purchase
- Repeat chargebackers are banned from future purchases

**Please email us first** — we resolve 95%+ of issues within 24h without involving your card issuer.

---

## Internal Operations Policy

### Refund handling SLA

| Channel | Initial response | Resolution |
|---|---|---|
| `refunds@millionpixels.com` | 4 business hours | 24 hours |
| Gumroad refund request | 4 business hours | 24 hours |
| Chargeback (Stripe/Gumroad notification) | 24 hours | Per processor deadline |

### Refund processing flow

```
1. Receive request (email or dashboard)
2. Verify: order exists + within window + pixels unused
3. If yes:
   a. Issue refund via Gumroad/Stripe dashboard
   b. Mark order status = 'refunded' in DB
   c. Release pixels back to pool (paid=false, owner_email=null, etc.)
   d. Reverse referral commission if within 30 days
   e. Email confirmation to buyer
4. If no:
   a. Respond explaining reason + offer remediation (replace pixel, upload help, etc.)
   b. Log denial reason in CRM
5. Update dashboard refund-rate metric
```

### Refund reasons (logged for analytics)

Categorize every refund:

- `buyer_remorse` — changed mind, no upload
- `duplicate_purchase` — bought same/wrong pixels twice
- `wrong_pixels` — picked wrong coords
- `quality_complaint` — unhappy with site/process (rare; investigate)
- `content_rejected` — we rejected their art, buyer didn't want to retry
- `technical_failure` — our bug
- `pricing_complaint` — disputed tier price (educate + refund)
- `other`

Track monthly. If `technical_failure` >5%, escalate to Tech Agent. If `pricing_complaint` >2%, revisit price disclosure UX.

### Chargeback (dispute) handling

**Stripe disputes** (v1 / Sprint 2 backup path):

1. Notification arrives within 24h of dispute opening
2. Pull all evidence: checkout session, IP, email, pixel render confirmation, T&Cs acceptance, support communication history
3. Submit via Stripe dashboard within **48 hours** (Stripe gives 7 days but earlier = better outcome)
4. Set order status = `disputed`, freeze pixels (mark `paid=false` temporarily)
5. If we win: re-mark pixels paid, log as recovered
6. If we lose: pixels released, commission clawed back from referrer, log as loss

**Gumroad disputes:**

1. Gumroad handles primary defense; we provide evidence on request
2. Same internal flow: freeze pixels until resolved

### Refund / dispute thresholds & escalations

| Metric (30-day rolling) | Threshold | Action |
|---|---|---|
| Refund rate | >3% | Dashboard alert, investigate top reasons |
| Refund rate | >5% | Pause paid ads, all-hands review |
| Stripe dispute rate | >0.65% | Stripe Radar review, tighten fraud rules |
| Stripe dispute rate | >1.0% | RISK: Stripe Early Warning, may freeze account |
| Gumroad dispute count | >5 in 30d | Email Gumroad support, review fraud signals |

### Refund reserve

Hold back **5% of gross revenue** in a separate bank sub-account as refund reserve. Top up monthly.

---

## Database schema additions

```sql
create table refunds (
  id bigserial primary key,
  sale_id text not null references orders(sale_id),
  refunded_at timestamptz not null default now(),
  refund_amount_cents int not null,
  reason text not null,           -- buyer_remorse | duplicate | wrong_pixels | ...
  notes text,
  reversed_commission_cents int default 0,
  released_pixel_count int default 0,
  processor text,                  -- gumroad | stripe
  processor_refund_id text
);

create table disputes (
  id bigserial primary key,
  sale_id text not null references orders(sale_id),
  opened_at timestamptz not null,
  resolved_at timestamptz,
  outcome text,                    -- won | lost | pending
  amount_cents int not null,
  reason text,                     -- card-not-recognized | fraudulent | product-not-received | ...
  evidence_submitted_at timestamptz,
  processor text,
  processor_dispute_id text unique
);

create index refunds_day_idx on refunds (refunded_at desc);
create index disputes_status_idx on disputes (outcome, opened_at desc);
```

---

## Email templates

### Refund approved

```
Subject: Refund processed — Million Pixels order #{order_id}

Hi {name},

Your refund of ${amount} has been processed. It should appear on your card within 5–10 business days, depending on your bank.

Order details:
- Order: #{order_id}
- Date: {purchase_date}
- Refund amount: ${amount}
- Pixels released: {pixel_count}

We'd love to know why you decided to refund — was it the art, the process, or just changed your mind? Reply to this email if you have a moment.

Thanks for trying us out,
Travis & the Million Pixels team
```

### Refund denied (with care)

```
Subject: About your refund request — Million Pixels

Hi {name},

We can't issue a refund for this order because {reason}.

However, we'd like to help. Here's what we CAN do:

- {remediation_option_1}
- {remediation_option_2}

If neither of these works, we totally understand. Reply here and we'll keep working on a solution.

Travis
Million Pixels
```

### Dispute received

```
Subject: We saw your chargeback — let's talk

Hi {name},

Your card issuer notified us of a dispute on your Million Pixels purchase (order #{order_id}, ${amount}).

We totally understand if something went wrong. Before this goes through the bank's process (which can take 30+ days), we'd rather just refund you directly.

If you reply to this email within 48 hours, we'll:
1. Refund your purchase immediately
2. Ask you to withdraw the dispute with your bank

If we don't hear back, we'll defend the charge with our records (purchase confirmation, pixels rendered, etc.). No hard feelings either way — we just want to resolve this fast.

Travis
Million Pixels
```

---

## Talking points (for support)

- We're a small team. We answer fast. Be human.
- Default to refunding — losing $1–10 is cheaper than a bad review or chargeback.
- Don't argue about subjective stuff (e.g. "I don't like the color rendering"). Refund and move on.
- DO push back on chargebacks where we have clear evidence (pixel rendered, T&Cs accepted) — but always offer refund-instead-of-chargeback first.
