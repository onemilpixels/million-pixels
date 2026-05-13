// POST /api/webhook — Stripe webhook (checkout.session.completed)
import { stripe, supabase, readRawBody } from './_lib.js';

export const config = { api: { bodyParser: false } };

const REFERRAL_RATE_BPS = 1000; // 10% per revenue spec

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error('webhook signature failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    try {
      const md = s.metadata || {};
      // Coords stored as [[x,y],...]; price stored separately
      const coords = JSON.parse(md.pixels || '[]');
      const perPixel = parseInt(md.per_pixel_cents || '0', 10);
      const email = md.email || s.customer_email;
      const name = md.name || 'Anonymous';
      const color = md.color || '#000000';
      const link = md.link || null;
      const referrer = md.referrer || null;
      const totalCents = s.amount_total || parseInt(md.total_cents || '0', 10);

      // Mark pixels paid
      for (const [x, y] of coords) {
        await supabase.from('pixels').upsert({
          x, y, color, link,
          owner_email: email, owner_name: name,
          price_cents: perPixel,
          stripe_session_id: s.id,
          referrer_code: referrer || null,
          paid: true,
          paid_at: new Date().toISOString(),
        }, { onConflict: 'x,y' });
      }

      // Upsert buyer + bump totals
      const { data: existing } = await supabase.from('buyers').select('*').eq('email', email).maybeSingle();
      if (existing) {
        await supabase.from('buyers').update({
          display_name: name,
          pixel_count: (existing.pixel_count || 0) + coords.length,
          total_cents:  (existing.total_cents  || 0) + totalCents,
        }).eq('email', email);
      } else {
        await supabase.from('buyers').insert({
          email, display_name: name,
          pixel_count: coords.length, total_cents: totalCents,
        });
      }

      // Credit referrer (10%)
      if (referrer) {
        const { data: ref } = await supabase.from('referrals').select('*').eq('code', referrer).maybeSingle();
        if (ref) {
          await supabase.from('referrals').update({
            conversion_count: (ref.conversion_count || 0) + 1,
            earned_cents:     (ref.earned_cents     || 0) + Math.floor(totalCents * REFERRAL_RATE_BPS / 10000),
          }).eq('code', referrer);
        }
      }

      await supabase.from('events').insert({
        type: 'purchase',
        metadata: { email, pixel_count: coords.length, total_cents: totalCents, referrer },
      });
    } catch (e) {
      console.error('webhook processing failed', e);
    }
  }

  res.json({ received: true });
}
