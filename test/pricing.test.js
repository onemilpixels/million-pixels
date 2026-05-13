// Pure-function tests for tier pricing. Run: node test/pricing.test.js
import { quotePixels, applyBundleDiscount, currentTierPrice, TIERS } from '../api/_pricing.js';

let pass = 0, fail = 0;
function eq(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ✓ ${name}`); }
  else    { fail++; console.log(`  ✗ ${name}\n      expected: ${JSON.stringify(expected)}\n      actual:   ${JSON.stringify(actual)}`); }
}

console.log('Tier pricing tests:');

// Tier 1: 0-999 = $0.01
eq('tier 1 single', currentTierPrice(0), 1);
eq('tier 1 last', currentTierPrice(999), 1);

// Tier 2: 1000-1999 = $0.05
eq('tier 2 first', currentTierPrice(1000), 5);

// Boundary crossing: buy 100 starting at 950 → 50@1¢ + 50@5¢ = 50+250 = 300
eq('cross t1→t2', quotePixels(950, 100), { totalCents: 300, breakdown: [
  { tier_price_cents: 1, count: 50 },
  { tier_price_cents: 5, count: 50 },
]});

// Buy 1 at start: 1¢
eq('single buy start', quotePixels(0, 1).totalCents, 1);

// Buy entire grid: should equal canonical $3,155,660 = 315,566,000 cents
const allCents = quotePixels(0, 1_000_000).totalCents;
eq('full grid revenue', allCents, 315_566_000);

// Bundle discounts
eq('bundle 1 = 0%',   applyBundleDiscount(1000, 1),     1000);
eq('bundle 10 = 5%',  applyBundleDiscount(1000, 10),    950);
eq('bundle 100 = 10%',applyBundleDiscount(1000, 100),   900);
eq('bundle 1000=20%', applyBundleDiscount(1000, 1000),  800);
eq('bundle 10000=25%',applyBundleDiscount(1000, 10000), 750);

// Tier ladder sanity — each threshold matches
const expectedTiers = [
  [1000, 1], [2000, 5], [3000, 10], [5000, 25], [10000, 50],
  [25000, 100], [50000, 150], [100000, 200], [250000, 250],
  [500000, 300], [750000, 350], [1000000, 400],
];
for (const [th, cents] of expectedTiers) {
  eq(`threshold ${th} = ${cents}¢`, TIERS.find(t => t.threshold === th)?.price_cents, cents);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
