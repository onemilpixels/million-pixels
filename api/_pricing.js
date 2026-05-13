// Canonical pricing per revenue/01-PRICING-MODEL.md
// FLAT PRICING: $1 per pixel (100 cents)

const PRICE_PER_PIXEL_CENTS = 100; // $1.00

export const TIERS = [
  { threshold: 1000000, price_cents: 100 },   // $1.00 (flat)
];

export function currentTierPrice(soldCount) {
  return PRICE_PER_PIXEL_CENTS; // Always $1.00
}

// Compute cost for buying `qty` more pixels at flat $1 each
export function quotePixels(soldCount, qty) {
  const totalCents = qty * PRICE_PER_PIXEL_CENTS;
  const breakdown = [{ tier_price_cents: PRICE_PER_PIXEL_CENTS, count: qty }];
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
