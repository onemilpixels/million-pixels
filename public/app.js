// Million Pixels — client
// 1000x1000 grid = 1,000,000 pixels. Tier-based pricing.

const GRID_SIZE = 1000;          // pixels per side
const CANVAS_PX = 1000;          // 1:1 internal resolution
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

// Pricing: FLAT $1 per pixel (100 cents)
const TIERS = [
  { threshold: 1000000, cents: 100 },
];
function currentTier(sold) {
  return TIERS[0]; // Always $1.00
}
function nextTier(sold) {
  return null; // No next tier, price stays at $1.00
}
function quote(sold, qty) {
  return qty * 100; // $1.00 per pixel
}
function bundleDiscount(qty) {
  if (qty >= 10000) return 2500;
  if (qty >= 1000)  return 2000;
  if (qty >= 100)   return 1000;
  if (qty >= 10)    return 500;
  return 0;
}

// State
const pixels = new Map();        // "x,y" -> {color, link, owner_name}
const selection = new Set();
let soldCount = 0;
let stripe = null;

// Viewport (zoom + pan) — needed because 1000x1000 in 1px is unusable
let zoom = 1;     // CSS scale factor on top of canvas
let panX = 0, panY = 0;
const wrap = canvas.parentElement;

// ---------- Rendering ----------
function drawAll() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CANVAS_PX, CANVAS_PX);

  // Sold pixels (1px each)
  for (const [key, p] of pixels) {
    const [x, y] = key.split(',').map(Number);
    ctx.fillStyle = p.color || '#000';
    ctx.fillRect(x, y, 1, 1);
  }

  // Selection overlay (highlighted with chosen color, slightly larger ring)
  const selColor = document.getElementById('inpColor').value;
  for (const key of selection) {
    const [x, y] = key.split(',').map(Number);
    ctx.fillStyle = selColor;
    ctx.fillRect(x, y, 1, 1);
  }

  applyTransform();
}

function applyTransform() {
  canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  canvas.style.transformOrigin = '0 0';
}

// ---------- Pointer ----------
function eventCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  const t = evt.touches ? evt.touches[0] : evt;
  // rect already reflects transform; map back to canvas pixel coords
  const x = Math.floor(((t.clientX - rect.left) / rect.width)  * CANVAS_PX);
  const y = Math.floor(((t.clientY - rect.top)  / rect.height) * CANVAS_PX);
  return {
    x: Math.max(0, Math.min(GRID_SIZE - 1, x)),
    y: Math.max(0, Math.min(GRID_SIZE - 1, y)),
  };
}

let didDrag = false, dragStart = null;
canvas.addEventListener('pointerdown', e => {
  didDrag = false;
  dragStart = { x: e.clientX, y: e.clientY, panX, panY };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!dragStart) return;
  if (e.buttons & 1 && (e.shiftKey || e.metaKey || e.ctrlKey)) {
    // Pan mode (Shift/Cmd/Ctrl held)
    panX = dragStart.panX + (e.clientX - dragStart.x);
    panY = dragStart.panY + (e.clientY - dragStart.y);
    didDrag = true;
    applyTransform();
  }
});
canvas.addEventListener('pointerup', e => {
  if (!dragStart) return;
  const wasDrag = didDrag;
  dragStart = null;
  if (wasDrag) return;
  const { x, y } = eventCoords(e);
  togglePixel(x, y);
});

// Wheel zoom centered on cursor
wrap.addEventListener('wheel', e => {
  e.preventDefault();
  const oldZoom = zoom;
  const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
  zoom = Math.max(1, Math.min(40, zoom * factor));
  // Adjust pan so the cursor stays fixed
  const rect = wrap.getBoundingClientRect();
  const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
  panX = cx - (cx - panX) * (zoom / oldZoom);
  panY = cy - (cy - panY) * (zoom / oldZoom);
  applyTransform();
}, { passive: false });

// Zoom buttons (added in HTML)
document.getElementById('btnZoomIn')?.addEventListener('click', () => { zoom = Math.min(40, zoom * 1.5); applyTransform(); });
document.getElementById('btnZoomOut')?.addEventListener('click', () => { zoom = Math.max(1, zoom / 1.5); if (zoom === 1) { panX = panY = 0; } applyTransform(); });
document.getElementById('btnFit')?.addEventListener('click', () => { zoom = 1; panX = panY = 0; applyTransform(); });

function togglePixel(x, y) {
  const key = `${x},${y}`;
  if (pixels.has(key)) {
    const p = pixels.get(key);
    if (p.link) window.open(p.link, '_blank', 'noopener');
    return;
  }
  if (selection.has(key)) selection.delete(key);
  else {
    if (selection.size >= 10000) { alert('Max 10,000 pixels per order.'); return; }
    selection.add(key);
  }
  updateSelectionUI();
  drawAll();
}

const hoverInfo = document.getElementById('hoverInfo');
canvas.addEventListener('mousemove', e => {
  const { x, y } = eventCoords(e);
  const key = `${x},${y}`;
  const sold = pixels.get(key);
  hoverInfo.hidden = false;
  const rect = wrap.getBoundingClientRect();
  hoverInfo.style.left = (e.clientX - rect.left) + 'px';
  hoverInfo.style.top  = (e.clientY - rect.top) + 'px';
  if (sold) {
    hoverInfo.innerHTML = `(${x},${y}) — <b>${escapeHtml(sold.owner_name || 'Anonymous')}</b>` +
      (sold.link ? ' · click to visit' : '');
  } else {
    hoverInfo.textContent = `(${x},${y}) — ${formatCents(currentTier(soldCount).cents)}`;
  }
});
canvas.addEventListener('mouseleave', () => { hoverInfo.hidden = true; });

document.getElementById('inpColor').addEventListener('input', drawAll);
document.getElementById('btnClear').addEventListener('click', () => {
  selection.clear(); updateSelectionUI(); drawAll();
});

function updateSelectionUI() {
  const panel = document.getElementById('selectionPanel');
  const count = selection.size;
  panel.hidden = count === 0;
  document.getElementById('selCount').textContent = count;
  const subtotal = quote(soldCount, count);
  const bps = bundleDiscount(count);
  const discount = Math.floor(subtotal * bps / 10000);
  const total = subtotal - discount;
  document.getElementById('selSubtotal').textContent = formatCents(subtotal);
  document.getElementById('selDiscount').textContent = bps ? `–${formatCents(discount)} (${bps/100}%)` : '—';
  document.getElementById('selPrice').textContent = formatCents(total);
  document.getElementById('sideTitle').textContent = count ? 'Your selection' : 'Pick a pixel';
}

// ---------- Checkout ----------
document.getElementById('btnBuy').addEventListener('click', async () => {
  const btn = document.getElementById('btnBuy');
  const email = document.getElementById('inpEmail').value.trim();
  if (!email || !email.includes('@')) { alert('Please enter a valid email.'); return; }
  if (selection.size === 0) return;

  const payload = {
    email,
    name: document.getElementById('inpName').value.trim() || 'Anonymous',
    color: document.getElementById('inpColor').value,
    link: document.getElementById('inpLink').value.trim() || null,
    pixels: [...selection].map(k => {
      const [x, y] = k.split(',').map(Number);
      return { x, y };
    }),
    referrer: getCookie('ref') || null,
  };

  btn.disabled = true; btn.textContent = 'Redirecting…';
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed');
    if (stripe && data.sessionId) {
      await stripe.redirectToCheckout({ sessionId: data.sessionId });
    } else if (data.url) {
      window.location = data.url;
    }
  } catch (err) {
    alert('Error: ' + err.message);
    btn.disabled = false; btn.textContent = 'Buy now →';
  }
});

// ---------- Data loading ----------
async function loadPixels() {
  try {
    const r = await fetch('/api/pixels');
    if (!r.ok) return;
    const data = await r.json();
    pixels.clear();
    for (const p of data.pixels || []) {
      pixels.set(`${p.x},${p.y}`, { color: p.color, link: p.link, owner_name: p.owner_name });
    }
    drawAll();
  } catch (e) { console.warn('pixels load failed', e); }
}

async function loadStats() {
  try {
    const r = await fetch('/api/stats');
    if (!r.ok) return;
    const d = await r.json();
    soldCount = d.sold || 0;
    document.getElementById('statSold').textContent    = soldCount.toLocaleString();
    document.getElementById('statRevenue').textContent = formatCents(d.revenue_cents || 0);

    // Price ticker
    const cur = currentTier(soldCount);
    const nxt = nextTier(soldCount);
    document.getElementById('statPrice').textContent = formatCents(cur.cents);
    const tickerEl = document.getElementById('priceTicker');
    if (tickerEl) {
      if (nxt) {
        const remaining = cur.threshold - soldCount;
        tickerEl.textContent = `Current: ${formatCents(cur.cents)} · rises to ${formatCents(nxt.cents)} in ${remaining.toLocaleString()} pixels`;
      } else {
        tickerEl.textContent = `Final tier: ${formatCents(cur.cents)} / pixel`;
      }
    }
    renderLeaderboard(d.leaderboard || []);
    updateSelectionUI();
  } catch {}
}

function renderLeaderboard(rows) {
  const tbody = document.querySelector('#leaderboard tbody');
  if (!rows.length) { tbody.innerHTML = '<tr><td colspan="4" class="muted">No buyers yet — be the first!</td></tr>'; return; }
  tbody.innerHTML = rows.map((r, i) =>
    `<tr><td>${i+1}</td><td>${escapeHtml(r.display_name || 'Anonymous')}</td>
     <td>${(r.pixel_count||0).toLocaleString()}</td><td>${formatCents(r.total_cents||0)}</td></tr>`
  ).join('');
}

// ---------- Referral ----------
document.getElementById('btnGetLink').addEventListener('click', async () => {
  const email = document.getElementById('refEmail').value.trim();
  if (!email || !email.includes('@')) { alert('Enter a valid email'); return; }
  const r = await fetch('/api/referral?email=' + encodeURIComponent(email));
  if (!r.ok) { alert('Failed to generate link'); return; }
  const d = await r.json();
  const url = `${location.origin}/r/${d.code}`;
  document.getElementById('refUrl').textContent = url;
  document.getElementById('refClicks').textContent = d.clicks || 0;
  document.getElementById('refConv').textContent   = d.conversions || 0;
  document.getElementById('refEarned').textContent = formatCents(d.earned_cents || 0);
  document.getElementById('refResult').hidden = false;
});
document.getElementById('btnCopy').addEventListener('click', () => {
  navigator.clipboard.writeText(document.getElementById('refUrl').textContent);
  document.getElementById('btnCopy').textContent = 'Copied!';
  setTimeout(() => document.getElementById('btnCopy').textContent = 'Copy', 1500);
});

// ---------- Tabs ----------
document.querySelectorAll('[data-tab]').forEach(el => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = el.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
  });
});

// ---------- Helpers ----------
function formatCents(c) { return '$' + (c / 100).toFixed(2); }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function getCookie(name) {
  return document.cookie.split('; ').find(r => r.startsWith(name+'='))?.split('=')[1] || null;
}

// ---------- Success banner ----------
if (new URLSearchParams(location.search).get('paid') === '1') {
  const banner = document.createElement('div');
  banner.className = 'success-banner';
  banner.innerHTML = '🎉 Payment confirmed! Your pixels will appear within ~15 seconds.';
  document.body.prepend(banner);
  setTimeout(() => banner.remove(), 8000);
}

// ---------- Init ----------
async function init() {
  try {
    const cfg = await fetch('/api/config').then(r => r.json());
    if (cfg.stripePublishableKey && window.Stripe) stripe = window.Stripe(cfg.stripePublishableKey);
  } catch {}

  drawAll();
  await Promise.all([loadPixels(), loadStats()]);

  setInterval(loadStats, 10_000);
  setInterval(loadPixels, 20_000);
}

init();
