// POST /api/checkout — create Stripe Checkout session
// Pricing per revenue/01-PRICING-MODEL.md (tier-based + bundle discount).
import {
  stripe, supabase, GRID_SIZE,
  quotePixels, applyBundleDiscount,
  validColor, validUrl, siteUrl, cors,
} from './_lib.js';

function validPixel(p) {
  return Number.isInteger(p?.x) && Number.isInteger(p?.y)
    && p.x >= 0 && p.x < GRID_SIZE
    && p.y >= 0 && p.y < GRID_SIZE;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { email, name, color, link, pixels, referrer } = req.body || {};

    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });
    if (!Array.isArray(pixels) || pixels.length === 0) return res.status(400).json({ error: 'No pixels selected' });
    if (pixels.length > 10000) return res.status(400).json({ error: 'Max 10,000 pixels per order' });
    if (!validColor(color)) return res.status(400).json({ error: 'Invalid color' });
    if (!validUrl(link)) return res.status(400).json({ error: 'Invalid link' });
    for (const p of pixels) if (!validPixel(p)) return res.status(400).json({ error: 'Invalid pixel coords' });

    // De-dup within request
    const seen = new Set();
    for (const p of pixels) {
      const k = `${p.x},${p.y}`;
      if (seen.has(k)) return res.status(400).json({ error: 'Duplicate pixel in selection' });
      seen.add(k);
    }

    // Check none already sold
    const xs = pixels.map(p => p.x), ys = pixels.map(p => p.y);
    const { data: existing, error: exErr } = await supabase
      .from('pixels').select('x, y, paid')
      .in('x', xs).in('y', ys);
    if (exErr) throw exErr;
    const sold = new Set((existing || []).filter(r => r.paid).map(r => `${r.x},${r.y}`));
    const conflict = pixels.find(p => sold.has(`${p.x},${p.y}`));
    if (conflict) return res.status(409).json({ error: `Pixel (${conflict.x},${conflict.y}) already sold` });

    // Get current sold count for tier pricing
    const { count: soldCount } = await supabase
      .from('pixels').select('*', { count: 'exact', head: true }).eq('paid', true);

    const qty = pixels.length;
    const quote = quotePixels(soldCount || 0, qty);
    const subtotal = quote.totalCents;
    const total = applyBundleDiscount(subtotal, qty);
    const discountCents = subtotal - total;

    // Store per-pixel price as average (avg cents/pixel rounded). For per-pixel accounting,
    // we record subtotal/qty as the per-pixel attribution; webhook stores total.
    const avgPerPixel = Math.round(total / qty);

    // Soft-reserve rows
    const rows = pixels.map(p => ({
      x: p.x, y: p.y, color, link: link || null,
      owner_email: email, owner_name: name || 'Anonymous',
      price_cents: avgPerPixel,
      referrer_code: referrer || null,
      paid: false,
    }));
    await supabase.from('pixels').upsert(rows, { onConflict: 'x,y', ignoreDuplicates: true });

    const desc = pixels.length <= 5
      ? pixels.map(p => `(${p.x},${p.y})`).join(', ')
      : `${pixels.length} pixels`;

    const productName = discountCents > 0
      ? `Million Pixels: ${desc} (${Math.round(discountCents / subtotal * 100)}% bundle discount)`
      : `Million Pixels: ${desc}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: productName },
          unit_amount: total,
        },
        quantity: 1,
      }],
      metadata: {
        email,
        name: (name || 'Anonymous').slice(0, 40),
        color,
        link: link || '',
        // Store coords (no per-pixel cents to keep <500 chars when possible)
        pixels: JSON.stringify(pixels.map(p => [p.x, p.y])),
        per_pixel_cents: String(avgPerPixel),
        total_cents: String(total),
        subtotal_cents: String(subtotal),
        discount_cents: String(discountCents),
        referrer: referrer || '',
      },
      success_url: `${siteUrl()}/?paid=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/?canceled=1`,
    });

    await supabase.from('pixels')
      .update({ stripe_session_id: session.id })
      .in('x', xs).in('y', ys)
      .eq('owner_email', email)
      .eq('paid', false);

    await supabase.from('events').insert({
      type: 'checkout_start',
      metadata: { email, pixel_count: qty, total_cents: total, subtotal_cents: subtotal,
                  discount_cents: discountCents, referrer: referrer || null },
    });

    res.json({ sessionId: session.id, url: session.url, total_cents: total, breakdown: quote.breakdown });
  } catch (e) {
    console.error('checkout error', e);
    res.status(500).json({ error: e.message || 'Checkout failed' });
  }
}
