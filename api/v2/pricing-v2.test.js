// Quick sanity tests for v2 pricing.
// Run: node api/v2/pricing-v2.test.js

import {
  basePriceCents,
  bundleMultiplierBps,
  quoteOrder,
  selectVariant,
  computeVariantPrices,
} from './pricing-v2.js';

let passed = 0, failed = 0;
const assert = (name, cond, detail) => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? ': ' + detail : ''}`); }
};

console.log('basePriceCents');
assert('soldCount=0 → $1.00', basePriceCents(0) === 100);
assert('soldCount=4999 → $1.00 (before first escalator)', basePriceCents(4999) === 100);
assert('soldCount=5000 → $1.05', basePriceCents(5000) === 105);
assert('soldCount=10000 → $1.10', basePriceCents(10000) === 110);
assert('soldCount=50000 → ~$1.63', basePriceCents(50000) === 163);
assert('soldCount=100000 → ~$2.65', Math.abs(basePriceCents(100000) - 265) <= 1);
assert('soldCount=1_000_000 → cap $10.00', basePriceCents(1_000_000) === 1000);

console.log('\nbundleMultiplierBps');
assert('qty=1 → 10000', bundleMultiplierBps(1) === 10000);
assert('qty=9 → 10000', bundleMultiplierBps(9) === 10000);
assert('qty=10 → 9000', bundleMultiplierBps(10) === 9000);
assert('qty=50 → 8500', bundleMultiplierBps(50) === 8500);
assert('qty=100 → 8000', bundleMultiplierBps(100) === 8000);
assert('qty=500 → 7500', bundleMultiplierBps(500) === 7500);
assert('qty=1000 → 7000', bundleMultiplierBps(1000) === 7000);

console.log('\nquoteOrder');
let q = quoteOrder(0, 1);
assert('soldCount=0 qty=1: total=$1.00', q.subtotal_cents === 100, JSON.stringify(q));

q = quoteOrder(0, 10);
assert('soldCount=0 qty=10: total=$9.00 (10% off)', q.subtotal_cents === 900, JSON.stringify(q));

q = quoteOrder(0, 100);
assert('soldCount=0 qty=100: total=$80.00 (20% off)', q.subtotal_cents === 8000, JSON.stringify(q));

q = quoteOrder(0, 1000);
assert('soldCount=0 qty=1000: total=$700.00 (30% off)', q.subtotal_cents === 70000, JSON.stringify(q));

q = quoteOrder(5000, 1);
assert('after 1 escalator, qty=1: $1.05', q.subtotal_cents === 105);

console.log('\nselectVariant');
assert('qty=1 → px-1',   selectVariant(1).sku === 'px-1');
assert('qty=9 → px-1',   selectVariant(9).sku === 'px-1');
assert('qty=10 → px-10', selectVariant(10).sku === 'px-10');
assert('qty=49 → px-10', selectVariant(49).sku === 'px-10');
assert('qty=50 → px-50', selectVariant(50).sku === 'px-50');
assert('qty=99 → px-50', selectVariant(99).sku === 'px-50');
assert('qty=2500 → px-1000', selectVariant(2500).sku === 'px-1000');

console.log('\ncomputeVariantPrices @ soldCount=0');
const v0 = computeVariantPrices(0);
assert('px-1 = $1.00',    v0.find(v => v.sku === 'px-1').price_cents === 100);
assert('px-10 = $9.00',   v0.find(v => v.sku === 'px-10').price_cents === 900);
assert('px-100 = $80.00', v0.find(v => v.sku === 'px-100').price_cents === 8000);

console.log('\ncomputeVariantPrices @ soldCount=50000');
const v50 = computeVariantPrices(50000);
assert('px-1 ~ $1.63',   Math.abs(v50.find(v => v.sku === 'px-1').price_cents - 163) <= 1);
assert('px-100 ~ $130',  Math.abs(v50.find(v => v.sku === 'px-100').price_cents - 13040) <= 50);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
