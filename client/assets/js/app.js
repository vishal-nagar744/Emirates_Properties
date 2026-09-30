/* ============================================================
   PRIMESPACE — SHARED APP UTILITIES
   Emirates Properties | Dubai, UAE
   Genuinely shared logic only — no page-specific code here.
   ============================================================ */

/* ── Toast Notification ─────────────────────────────────────── */
function toast(message, duration = 2400) {
  const el = document.querySelector('.toast');
  if (!el) return;
  el.textContent = message;
  el.style.display = 'block';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.display = 'none'; }, duration);
}

/* ── Sidebar Toggle (mobile) ────────────────────────────────── */
function toggleSide() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (!sidebar) return;
  const isOpen = sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('visible', isOpen);
  const btn = document.getElementById('menu-toggle');
  if (btn) btn.setAttribute('aria-expanded', String(isOpen));
}

function closeSide() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
  const btn = document.getElementById('menu-toggle');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

/* ── Heart / Wishlist Toggle ────────────────────────────────── */
function initHearts() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.heart-btn');
    if (!btn) return;
    const liked = btn.textContent.trim() === '♥';
    btn.textContent = liked ? '♡' : '♥';
    btn.style.color = liked ? '' : '#c0604e';
    btn.setAttribute('aria-label', liked ? 'Add to wishlist' : 'Remove from wishlist');
  });
}

/* ── Sidebar overlay click to close ────────────────────────── */
function initOverlay() {
  const overlay = document.querySelector('.sidebar-overlay');
  if (overlay) overlay.addEventListener('click', closeSide);
}

/* ── Active nav link highlighter ───────────────────────────── */
function initActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidelink, .navlinks a').forEach((link) => {
    link.classList.remove('active');
    const href = link.getAttribute('href') || '';
    const target = href.split('#')[0].split('/').pop();
    if (target && target === current) {
      link.classList.add('active');
    }
  });
}

function initProjectFilter(inputId, gridId) {
  const input = document.getElementById(inputId);
  const grid  = document.getElementById(gridId);
  if (!input || !grid) return;

  function runFilter() {
    const query = input.value.toLowerCase().trim();
    grid.querySelectorAll('.property-card').forEach((card) => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  }

  input.addEventListener('input', runFilter);
  runFilter();
}

function initDemoForms() {
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-demo]');
    if (!form) return;
    e.preventDefault();
    toast(form.dataset.demo);
  });
}

function initApp() {
  initHearts();
  initOverlay();
  initActiveNav();
  initDemoForms();
  if (document.getElementById('hero-search') && document.getElementById('property-grid')) {
    initProjectFilter('hero-search', 'property-grid');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
