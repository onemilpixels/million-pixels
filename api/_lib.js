// Shared helpers for serverless functions
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  { auth: { persistSession: false } }
);

export const GRID_SIZE = 1000;   // 1000x1000 = 1,000,000 pixels (per revenue spec)
export { quotePixels, applyBundleDiscount, currentTierPrice, TIERS } from './_pricing.js';

export function validPixel(p) {
  return Number.isInteger(p?.x) && Number.isInteger(p?.y)
    && p.x >= 0 && p.x < GRID_SIZE
    && p.y >= 0 && p.y < GRID_SIZE;
}

export function validColor(c) {
  return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c);
}

export function validUrl(u) {
  if (!u) return true;
  try { const url = new URL(u); return url.protocol === 'http:' || url.protocol === 'https:'; }
  catch { return false; }
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
}

export async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
