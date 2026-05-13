// GET /api/pixels — all paid pixels
import { supabase, cors } from './_lib.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { data, error } = await supabase
      .from('pixels')
      .select('x, y, color, link, owner_name')
      .eq('paid', true)
      .limit(15000);
    if (error) throw error;
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    res.json({ pixels: data || [] });
  } catch (e) {
    console.error('pixels error', e);
    res.status(500).json({ error: 'Failed to load pixels', pixels: [] });
  }
}
