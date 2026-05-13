// GET /api/stats — total sold, revenue, leaderboard
import { supabase, cors } from './_lib.js';

export default async function handler(req, res) {
  cors(res);
  try {
    const [{ count: sold }, { data: rev }, { data: top }] = await Promise.all([
      supabase.from('pixels').select('*', { count: 'exact', head: true }).eq('paid', true),
      supabase.from('pixels').select('price_cents').eq('paid', true),
      supabase.from('buyers').select('display_name, pixel_count, total_cents')
        .order('total_cents', { ascending: false }).limit(25),
    ]);
    const revenue_cents = (rev || []).reduce((a, p) => a + (p.price_cents || 0), 0);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    res.json({
      sold: sold || 0,
      revenue_cents,
      leaderboard: top || [],
    });
  } catch (e) {
    console.error('stats error', e);
    res.status(500).json({ error: 'stats failed', sold: 0, revenue_cents: 0, leaderboard: [] });
  }
}
