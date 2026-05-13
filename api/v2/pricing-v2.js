// Million Pixels — v2 Pricing
// Spec: revenue/v2/08-PRICING-MODEL-V2.md
//
// Model:
//   base_price = $1.00 * (1.05 ^ floor(soldCount / 5000))
//   bundle_discount: 10/50/100/500/1000+ tiers
//   per_pixel = max($0.50, base * bundle_multiplier)
//   hard cap $10.00 base, floor $0.50 post-discount

export const BASE_PRICE_CENTS   = 100;   // $1.00
export const ESCALATOR_BPS      = 500;   // +5.00%
export const ESCALATOR_STEP     = 5000;  // every 5,000 pixels
export const PRICE_CAP_CENTS    = 1000;  // $10.00
export const PRICE_FLOOR_CENTS  = 50;    // $0.50

export function basePriceCents(soldCount) {
  const steps = Math.floor(Math.max(0, soldCount) / ESCALATOR_STEP);
  const mult = Math.pow(1 + ESCALATOR_BPS / 10000, steps);
  return Math.min(PRICE_CAP_CENTS, Math.round(BASE_PRICE_CENTS * mult));
}

export function bundleMultiplierBps(qty) {
  if (qty >= 1000) return 7000;  // 30% off
  if (qty >= 500)  return 7500;  // 25% off
  if (qty >= 100)  return 8000;  // 20% off
  if (qty >= 50)   return 8500;  // 15% off
  if (qty >= 10)   return 9000;  // 10% off
  return 10000;                  // no discount
}

export function quoteOrder(soldCount, qty) {
  const base = basePriceCents(soldCount);
  const mult = bundleMultiplierBps(qty);
  const perPixel = Math.max(PRICE_FLOOR_CENTS, Math.round((base * mult) / 10000));
  return {
    base_price_cents: base,
    per_pixel_cents: perPixel,
    qty,
    subtotal_cents: perPixel * qty,
    bundle_multiplier_bps: mult,
    discount_pct: 100 - mult / 100,
    pixels_to_next_escalator: ESCALATOR_STEP - (soldCount % ESCALATOR_STEP),
    next_base_price_cents: basePriceCents(soldCount + ESCALATOR_STEP),
  };
}

// Standard variants for Gumroad. SKU = `px-${qty}`.
export const STANDARD_VARIANTS = [
  { qty: 1,    sku: 'px-1' },
  { qty: 10,   sku: 'px-10' },
  { qty: 50,   sku: 'px-50' },
  { qty: 100,  sku: 'px-100' },
  { qty: 500,  sku: 'px-500' },
  { qty: 1000, sku: 'px-1000' },
];

export function selectVariant(qty) {
  // Pick largest variant ≤ qty
  let best = STANDARD_VARIANTS[0];
  for (const v of STANDARD_VARIANTS) {
    if (v.qty <= qty && v.qty >= best.qty) best = v;
  }
  return best;
}

// Compute Gumroad variant prices for current sold count
export function computeVariantPrices(soldCount) {
  const base = basePriceCents(soldCount);
  return STANDARD_VARIANTS.map(v => {
    const mult = bundleMultiplierBps(v.qty);
    const perPixel = Math.max(PRICE_FLOOR_CENTS, Math.round((base * mult) / 10000));
    return {
      ...v,
      price_cents: perPixel * v.qty,
      per_pixel_cents: perPixel,
      base_price_cents: base,
    };
  });
}

