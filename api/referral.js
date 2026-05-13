// GET /api/referral?email=... → returns/creates referral code + stats
// GET /api/referral?code=... → records click, sets cookie, redirects to /
import { supabase, cors } from './_lib.js';

export default async function handler(req, res) {
  cors(res);
  const { email, code } = req.query;

  // Click handler: /r/:code rewritten to /api/referral?code=...
  if (code) {
    try {
      const { data: ref } = await supabase.from('referrals').select('*').eq('code', code).maybeSingle();
      if (ref) {
        await supabase.from('referrals').update({ click_count: (ref.click_count || 0) + 1 }).eq('code', code);
        await supabase.from('events').insert({ type: 'referral_click', metadata: { code } });
        // 30-day cookie
        res.setHeader('Set-Cookie', `ref=${encodeURIComponent(code)}; Path=/; Max-Age=${60*60*24*30}; SameSite=Lax`);
      }
    } catch (e) { console.warn('referral click failed', e); }
    res.writeHead(302, { Location: '/' });
    return res.end();
  }

  // Lookup / create by email
  if (email) {
    try {
      // Upsert buyer (creates referral_code via default)
      let { data: buyer } = await supabase.from('buyers').select('*').eq('email', email).maybeSingle();
      if (!buyer) {
        const { data: created, error } = await supabase.from('buyers')
          .insert({ email, display_name: 'Anonymous' }).select().single();
        if (error) throw error;
        buyer = created;
      }
      // Upsert referrals row
      await supabase.from('referrals').upsert({ code: buyer.referral_code, owner_email: email }, { onConflict: 'code' });
      const { data: ref } = await supabase.from('referrals').select('*').eq('code', buyer.referral_code).single();

      return res.json({
        code: buyer.referral_code,
        clicks: ref?.click_count || 0,
        conversions: ref?.conversion_count || 0,
        earned_cents: ref?.earned_cents || 0,
      });
    } catch (e) {
      console.error('referral lookup failed', e);
      return res.status(500).json({ error: 'failed' });
    }
  }

  res.status(400).json({ error: 'email or code required' });
}
