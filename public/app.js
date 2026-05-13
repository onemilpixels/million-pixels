// Million Pixels — client
// 1000x1000 grid = 1,000,000 pixels. Tier-based pricing.

const GRID_SIZE = 1000;          // pixels per side
const CANVAS_PX = 1000;          // 1:1 internal resolution
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d', { alpha: false });
ctx.imageSmoothingEnabled = false;

// Overlay canvas (transparent) for search highlights + grid lines.
const overlayCanvas = document.getElementById('overlay');
const octx = overlayCanvas ? overlayCanvas.getContext('2d') : null;
if (octx) octx.imageSmoothingEnabled = false;

// Mini-map canvas (downsampled view of the grid + viewport rect).
const minimapCanvas = document.getElementById('minimap');
const mctx = minimapCanvas ? minimapCanvas.getContext('2d') : null;
const MINIMAP_SIZE = 200;            // CSS + canvas pixels
const MINIMAP_SCALE = GRID_SIZE / MINIMAP_SIZE; // 5 canvas px per minimap px

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
  const t = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  canvas.style.transform = t;
  canvas.style.transformOrigin = '0 0';
  if (overlayCanvas) {
    overlayCanvas.style.transform = t;
    overlayCanvas.style.transformOrigin = '0 0';
  }
  updateCoordBadge();
  drawOverlay();
  drawMinimapViewport();
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

// Drag-to-pan: any pointer drag pans; a tap (no significant movement) selects.
// Threshold prevents accidental selection deselection on the slightest twitch.
const DRAG_THRESHOLD_PX = 4;
let didDrag = false, dragStart = null;
canvas.addEventListener('pointerdown', e => {
  didDrag = false;
  dragStart = { x: e.clientX, y: e.clientY, panX, panY };
  try { canvas.setPointerCapture(e.pointerId); } catch {}
});
canvas.addEventListener('pointermove', e => {
  if (!dragStart) return;
  if (!(e.buttons & 1)) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  if (!didDrag && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
  didDrag = true;
  panX = dragStart.panX + dx;
  panY = dragStart.panY + dy;
  applyTransform();
});
canvas.addEventListener('pointerup', e => {
  if (!dragStart) return;
  const wasDrag = didDrag;
  dragStart = null;
  if (wasDrag) return;
  const { x, y } = eventCoords(e);
  togglePixel(x, y);
});
canvas.addEventListener('pointercancel', () => { dragStart = null; didDrag = false; });

// Keyboard shortcuts: +/- zoom, arrows pan, R random, G toggle minimap-grid, / focus search, Esc clear.
window.addEventListener('keydown', (e) => {
  // Ignore when typing in an input/textarea/contenteditable.
  const t = e.target;
  const tag = (t && t.tagName) || '';
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable);
  if (typing) {
    if (e.key === 'Escape' && t.id === 'searchInput') { /* handled in wireNavigator */ }
    return;
  }
  // Only act when the grid tab is visible.
  const gridActive = document.getElementById('tab-grid')?.classList.contains('active');
  if (!gridActive) return;

  const PAN_STEP = 60;
  switch (e.key) {
    case '+': case '=':
      zoomAround(null, 1.5); e.preventDefault(); break;
    case '-': case '_':
      zoomAround(null, 1/1.5); if (zoom === 1) { panX = panY = 0; applyTransform(); } e.preventDefault(); break;
    case '0':
      zoom = 1; panX = panY = 0; applyTransform(); e.preventDefault(); break;
    case 'ArrowLeft':
      panX += PAN_STEP; applyTransform(); e.preventDefault(); break;
    case 'ArrowRight':
      panX -= PAN_STEP; applyTransform(); e.preventDefault(); break;
    case 'ArrowUp':
      panY += PAN_STEP; applyTransform(); e.preventDefault(); break;
    case 'ArrowDown':
      panY -= PAN_STEP; applyTransform(); e.preventDefault(); break;
    case 'r': case 'R': {
      const owned = [...pixels.keys()];
      if (owned.length) {
        const [x, y] = owned[Math.floor(Math.random() * owned.length)].split(',').map(Number);
        jumpTo(x, y, Math.max(zoom, 14));
      } else {
        jumpTo(Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE), Math.max(zoom, 8));
      }
      e.preventDefault();
      break;
    }
    case 'g': case 'G':
      document.getElementById('btnGridToggle')?.click();
      e.preventDefault();
      break;
    case '/':
      document.getElementById('searchInput')?.focus();
      e.preventDefault();
      break;
  }
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
document.getElementById('btnZoomIn')?.addEventListener('click', () => { zoomAround(null, 1.5); });
document.getElementById('btnZoomOut')?.addEventListener('click', () => { zoomAround(null, 1/1.5); if (zoom === 1) { panX = panY = 0; applyTransform(); } });
document.getElementById('btnFit')?.addEventListener('click', () => { zoom = 1; panX = panY = 0; applyTransform(); });

// Zoom centered on a wrap-relative point (or the wrap center if null).
function zoomAround(point, factor) {
  const oldZoom = zoom;
  zoom = Math.max(1, Math.min(40, zoom * factor));
  const rect = wrap.getBoundingClientRect();
  const cx = point ? point.x : rect.width / 2;
  const cy = point ? point.y : rect.height / 2;
  panX = cx - (cx - panX) * (zoom / oldZoom);
  panY = cy - (cy - panY) * (zoom / oldZoom);
  applyTransform();
}

// ---------- Navigator (search + jump + grid overlay) ----------
let searchTerm = '';
let searchMatches = [];           // array of {x, y, owner_name, link, color}
let showGrid = false;

function drawOverlay() {
  if (!octx) return;
  octx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);

  // Grid lines
  if (showGrid) {
    octx.save();
    // Major grid every 100px, always visible.
    octx.strokeStyle = 'rgba(24, 20, 15, 0.32)';
    octx.lineWidth = 1 / zoom;
    octx.beginPath();
    for (let i = 0; i <= GRID_SIZE; i += 100) {
      octx.moveTo(i + 0.5, 0); octx.lineTo(i + 0.5, GRID_SIZE);
      octx.moveTo(0, i + 0.5); octx.lineTo(GRID_SIZE, i + 0.5);
    }
    octx.stroke();

    // Minor grid every 10px when zoomed in enough.
    if (zoom >= 8) {
      octx.strokeStyle = 'rgba(24, 20, 15, 0.12)';
      octx.lineWidth = 0.5 / zoom;
      octx.beginPath();
      for (let i = 0; i <= GRID_SIZE; i += 10) {
        if (i % 100 === 0) continue;
        octx.moveTo(i + 0.5, 0); octx.lineTo(i + 0.5, GRID_SIZE);
        octx.moveTo(0, i + 0.5); octx.lineTo(GRID_SIZE, i + 0.5);
      }
      octx.stroke();
    }

    // Coordinate labels at the major intersections, at higher zoom.
    if (zoom >= 3) {
      const fontPx = Math.max(6, Math.min(11, 9 / zoom * 4));
      octx.fillStyle = 'rgba(24, 20, 15, 0.55)';
      octx.font = `${fontPx}px JetBrains Mono, monospace`;
      octx.textBaseline = 'top';
      for (let x = 0; x <= GRID_SIZE; x += 100) {
        for (let y = 0; y <= GRID_SIZE; y += 100) {
          octx.fillText(`${x},${y}`, x + 2 / zoom, y + 2 / zoom);
        }
      }
    }
    octx.restore();
  }

  // Search highlights: vermillion ring + dot at each match.
  if (searchMatches.length) {
    octx.save();
    // Ring radius shrinks with zoom (smaller in canvas units when zoomed in,
    // bigger when zoomed out so they remain visible).
    const ring = Math.max(3, 14 / Math.max(zoom, 0.6));
    const lw = Math.max(0.75, 3 / Math.max(zoom, 1));
    octx.strokeStyle = '#c0392b';
    octx.fillStyle = 'rgba(192, 57, 43, 0.22)';
    octx.lineWidth = lw;
    for (const m of searchMatches) {
      octx.beginPath();
      octx.arc(m.x + 0.5, m.y + 0.5, ring, 0, Math.PI * 2);
      octx.fill();
      octx.stroke();
    }
    octx.restore();
  }
}

function runSearch(term) {
  searchTerm = (term || '').trim().toLowerCase();
  const resultsEl = document.getElementById('searchResults');
  const countEl   = document.getElementById('searchCount');
  const clearBtn  = document.getElementById('btnSearchClear');
  if (!searchTerm) {
    searchMatches = [];
    if (resultsEl) { resultsEl.hidden = true; resultsEl.innerHTML = ''; }
    if (countEl) countEl.textContent = '—';
    if (clearBtn) clearBtn.hidden = true;
    drawOverlay();
    return;
  }
  const out = [];
  for (const [key, p] of pixels) {
    const name = (p.owner_name || '').toLowerCase();
    const link = (p.link || '').toLowerCase();
    if (name.includes(searchTerm) || link.includes(searchTerm)) {
      const [x, y] = key.split(',').map(Number);
      out.push({ x, y, owner_name: p.owner_name, link: p.link, color: p.color });
      if (out.length >= 500) break; // cap for perf
    }
  }
  searchMatches = out;
  if (countEl) countEl.textContent = `${out.length} match${out.length === 1 ? '' : 'es'}`;
  if (clearBtn) clearBtn.hidden = false;
  if (resultsEl) {
    const preview = out.slice(0, 8);
    resultsEl.innerHTML = preview.map(m =>
      `<li data-x="${m.x}" data-y="${m.y}">` +
        `<span class="sr-dot" style="background:${escapeHtml(m.color || '#18140f')}"></span>` +
        `<b>${escapeHtml(m.owner_name || 'Anonymous')}</b>` +
        `<span class="sr-coord">(${m.x},${m.y})</span>` +
      `</li>`
    ).join('') + (out.length > preview.length
      ? `<li class="sr-more">+ ${out.length - preview.length} more…</li>`
      : '');
    resultsEl.hidden = out.length === 0;
  }
  drawOverlay();
}

function jumpTo(x, y, targetZoom) {
  x = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(x)));
  y = Math.max(0, Math.min(GRID_SIZE - 1, Math.round(y)));
  const desired = targetZoom != null ? targetZoom : Math.max(zoom, 8);
  zoom = Math.max(1, Math.min(40, desired));
  const rect = wrap.getBoundingClientRect();
  // Place (x,y) at the center of the wrap.
  panX = rect.width  / 2 - (x + 0.5) * zoom;
  panY = rect.height / 2 - (y + 0.5) * zoom;
  applyTransform();
  flashLocator(x, y);
}

function flashLocator(x, y) {
  if (!octx) return;
  let t = 0;
  const start = performance.now();
  function tick(now) {
    t = (now - start) / 700;
    drawOverlay();
    if (t >= 1) return;
    octx.save();
    const r = 4 + (1 - t) * 40;
    octx.strokeStyle = `rgba(192, 57, 43, ${0.8 * (1 - t)})`;
    octx.lineWidth = Math.max(1, 2 / zoom);
    octx.beginPath();
    octx.arc(x + 0.5, y + 0.5, r, 0, Math.PI * 2);
    octx.stroke();
    octx.restore();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function updateCoordBadge() {
  const badge = document.getElementById('coordBadge');
  if (!badge) return;
  const rect = wrap.getBoundingClientRect();
  const cx = (rect.width  / 2 - panX) / zoom;
  const cy = (rect.height / 2 - panY) / zoom;
  const x = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(cx)));
  const y = Math.max(0, Math.min(GRID_SIZE - 1, Math.floor(cy)));
  badge.textContent = `${x}, ${y} · ${zoom.toFixed(1)}×`;
}

// Wire up navigator UI
(function wireNavigator() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn    = document.getElementById('btnSearchClear');
  const resultsEl   = document.getElementById('searchResults');
  const jumpX = document.getElementById('jumpX');
  const jumpY = document.getElementById('jumpY');
  const btnJump = document.getElementById('btnJump');
  const btnGrid = document.getElementById('btnGridToggle');

  let searchDebounce;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => runSearch(e.target.value), 80);
  });
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchMatches.length) {
      const m = searchMatches[0];
      jumpTo(m.x, m.y, Math.max(zoom, 12));
    } else if (e.key === 'Escape') {
      searchInput.value = '';
      runSearch('');
    }
  });
  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    runSearch('');
    searchInput?.focus();
  });
  resultsEl?.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-x]');
    if (!li) return;
    jumpTo(+li.dataset.x, +li.dataset.y, Math.max(zoom, 14));
  });

  function doJump() {
    const x = parseInt(jumpX?.value, 10);
    const y = parseInt(jumpY?.value, 10);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      jumpX?.focus();
      return;
    }
    jumpTo(x, y, Math.max(zoom, 10));
  }
  btnJump?.addEventListener('click', doJump);
  [jumpX, jumpY].forEach(el => el?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doJump();
  }));

  document.querySelectorAll('.nav-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      const targets = {
        tl:     [0, 0, 10],
        tr:     [GRID_SIZE - 1, 0, 10],
        bl:     [0, GRID_SIZE - 1, 10],
        br:     [GRID_SIZE - 1, GRID_SIZE - 1, 10],
        center: [Math.floor(GRID_SIZE / 2), Math.floor(GRID_SIZE / 2), Math.max(zoom, 6)],
      };
      if (preset === 'random') {
        // Prefer a random owned pixel if any, else random coord.
        const owned = [...pixels.keys()];
        if (owned.length) {
          const [x, y] = owned[Math.floor(Math.random() * owned.length)].split(',').map(Number);
          jumpTo(x, y, Math.max(zoom, 14));
        } else {
          jumpTo(Math.floor(Math.random() * GRID_SIZE), Math.floor(Math.random() * GRID_SIZE), Math.max(zoom, 8));
        }
        return;
      }
      const t = targets[preset];
      if (t) jumpTo(t[0], t[1], t[2]);
    });
  });

  btnGrid?.addEventListener('click', () => {
    showGrid = !showGrid;
    btnGrid.setAttribute('aria-pressed', String(showGrid));
    btnGrid.classList.toggle('on', showGrid);
    drawOverlay();
  });

  // Re-run search and update overlay when new pixels load.
  window.addEventListener('pixels:loaded', () => {
    if (searchTerm) runSearch(searchTerm);
    drawOverlay();
    drawMinimap();
  });

  // Mini-map click-to-jump.
  minimapCanvas?.addEventListener('click', (e) => {
    const rect = minimapCanvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width)  * MINIMAP_SIZE;
    const my = ((e.clientY - rect.top)  / rect.height) * MINIMAP_SIZE;
    const x = Math.round(mx * MINIMAP_SCALE);
    const y = Math.round(my * MINIMAP_SCALE);
    jumpTo(x, y, Math.max(zoom, 6));
  });
})();

// ---------- Mini-map rendering ----------
// We cache the pixel layer to an offscreen canvas (rebuilt only when pixel set
// changes), then composite + draw the viewport rect on each transform.
const minimapBase = typeof OffscreenCanvas !== 'undefined'
  ? new OffscreenCanvas(MINIMAP_SIZE, MINIMAP_SIZE)
  : Object.assign(document.createElement('canvas'), { width: MINIMAP_SIZE, height: MINIMAP_SIZE });
const mbctx = minimapBase.getContext('2d');

function drawMinimap() {
  if (!mctx || !mbctx) return;
  // Rebuild the cached base.
  mbctx.fillStyle = '#ffffff';
  mbctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
  for (const [key, p] of pixels) {
    const [x, y] = key.split(',').map(Number);
    mbctx.fillStyle = p.color || '#18140f';
    mbctx.fillRect(Math.floor(x / MINIMAP_SCALE), Math.floor(y / MINIMAP_SCALE), 1, 1);
  }
  drawMinimapViewport();
}

function drawMinimapViewport() {
  if (!mctx) return;
  // Composite cached base.
  mctx.fillStyle = '#ffffff';
  mctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
  try { mctx.drawImage(minimapBase, 0, 0); } catch {}

  // Viewport rectangle (vermillion) in minimap coords.
  const rect = wrap.getBoundingClientRect();
  if (rect.width === 0) return;
  const vx = (-panX / zoom) / MINIMAP_SCALE;
  const vy = (-panY / zoom) / MINIMAP_SCALE;
  const vw = (rect.width  / zoom) / MINIMAP_SCALE;
  const vh = (rect.height / zoom) / MINIMAP_SCALE;
  mctx.save();
  mctx.strokeStyle = '#c0392b';
  mctx.lineWidth = 1.5;
  const x = Math.max(0, vx), y = Math.max(0, vy);
  const w = Math.min(MINIMAP_SIZE - x, vw + Math.min(0, vx));
  const h = Math.min(MINIMAP_SIZE - y, vh + Math.min(0, vy));
  if (w > 0 && h > 0) mctx.strokeRect(x, y, w, h);
  // Cross-hair on viewport center when zoomed in.
  if (zoom > 6) {
    const cx = vx + vw / 2;
    const cy = vy + vh / 2;
    if (cx >= 0 && cx <= MINIMAP_SIZE && cy >= 0 && cy <= MINIMAP_SIZE) {
      mctx.fillStyle = '#c0392b';
      mctx.fillRect(cx - 1, cy - 1, 2, 2);
    }
  }
  mctx.restore();
}

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
    drawMinimap();
    window.dispatchEvent(new Event('pixels:loaded'));
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

// ---------- Deep linking ----------
// ?at=X,Y    jump-zoom to coordinates and flash a marker
// ?owner=foo run a search for that name (highlights all their pixels)
function applyDeepLink() {
  const params = new URLSearchParams(location.search);
  const at = params.get('at');
  if (at) {
    const m = at.match(/^\s*(\d{1,4})\s*[,;\s]\s*(\d{1,4})\s*$/);
    if (m) {
      const x = +m[1], y = +m[2];
      jumpTo(x, y, Math.max(zoom, 14));
    }
  }
  const owner = params.get('owner');
  if (owner) {
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = owner;
    runSearch(owner);
    if (searchMatches.length) {
      const m = searchMatches[0];
      jumpTo(m.x, m.y, Math.max(zoom, 12));
    }
  }
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
  updateCoordBadge();
  drawMinimap();
  await Promise.all([loadPixels(), loadStats()]);
  applyDeepLink();

  setInterval(loadStats, 10_000);
  setInterval(loadPixels, 20_000);
}

init();
