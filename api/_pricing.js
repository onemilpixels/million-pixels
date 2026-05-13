// Canonical pricing per revenue/01-PRICING-MODEL.md
// Tier-based: price rises as more pixels are sold.

export const TIERS = [
  { threshold: 1000,    price_cents: 1   },   // $0.01
  { threshold: 2000,    price_cents: 5   },   // $0.05
  { threshold: 3000,    price_cents: 10  },   // $0.10
  { threshold: 5000,    price_cents: 25  },   // $0.25
  { threshold: 10000,   price_cents: 50  },   // $0.50
  { threshold: 25000,   price_cents: 100 },   // $1.00
  { threshold: 50000,   price_cents: 150 },   // $1.50
  { threshold: 100000,  price_cents: 200 },   // $2.00
  { threshold: 250000,  price_cents: 250 },   // $2.50
  { threshold: 500000,  price_cents: 300 },   // $3.00
  { threshold: 750000,  price_cents: 350 },   // $3.50
  { threshold: 1000000, price_cents: 400 },   // $4.00
];

export function currentTierPrice(soldCount) {
  for (const t of TIERS) {
    if (soldCount < t.threshold) return t.price_cents;
  }
  return 400;
}

// Compute cost for buying `qty` more pixels when `soldCount` are already sold,
// rolling across tier boundaries.
export function quotePixels(soldCount, qty) {
  let remaining = qty;
  let cursor = soldCount;
  let totalCents = 0;
  const breakdown = []; // [{ tier_price_cents, count }]
  for (const t of TIERS) {
    if (cursor >= t.threshold) continue;
    const room = t.threshold - cursor;
    const take = Math.min(room, remaining);
    if (take > 0) {
      totalCents += take * t.price_cents;
      breakdown.push({ tier_price_cents: t.price_cents, count: take });
      remaining -= take;
      cursor += take;
      if (remaining === 0) break;
    }
  }
  if (remaining > 0) {
    totalCents += remaining * 400;
    breakdown.push({ tier_price_cents: 400, count: remaining });
  }
  return { totalCents, breakdown };
}

// Bundle discount (% off, applied after tier pricing).
export function bundleDiscountBps(qty) {
  if (qty >= 10000) return 2500; // 25%
  if (qty >= 1000)  return 2000; // 20%
  if (qty >= 100)   return 1000; // 10%
  if (qty >= 10)    return 500;  // 5%
  return 0;
}

export function applyBundleDiscount(totalCents, qty) {
  const bps = bundleDiscountBps(qty);
  if (!bps) return totalCents;
  const discount = Math.floor(totalCents * bps / 10000);
  return totalCents - discount;
}
