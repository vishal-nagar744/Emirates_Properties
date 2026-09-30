/* ============================================================
   PRIMESPACE — SHARED APP UTILITIES
   Emirates Properties | PrimeSpace
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

/* ── Sidebar Toggle (member pages, mobile) ──────────────────── */
function setMenuState(open) {
  const wide = window.innerWidth > 1050;
  document.querySelectorAll('#menu-toggle, #menu-open').forEach((btn) => {
    btn.setAttribute('aria-expanded', String(open));
    if (wide && btn.id === 'menu-toggle') {
      btn.setAttribute('aria-label', open ? 'Show icons only' : 'Show menu labels');
    } else {
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
  });
}

function syncNavIcons() {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  const wide = window.innerWidth > 1050;
  const icons = wide && sessionStorage.getItem('ps_nav_icons') === '1';
  document.body.classList.toggle('nav-icons', icons);
  if (wide) setMenuState(!icons);
}

function toggleSide() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (!sidebar) return;
  const wide = window.innerWidth > 1050;
  if (wide) {
    const icons = !document.body.classList.contains('nav-icons');
    document.body.classList.toggle('nav-icons', icons);
    sessionStorage.setItem('ps_nav_icons', icons ? '1' : '0');
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    setMenuState(!icons);
    return;
  }
  document.body.classList.remove('nav-icons');
  const isOpen = sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('visible', isOpen);
  setMenuState(isOpen);
}

function closeSide() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
  if (window.innerWidth > 1050) syncNavIcons();
  else setMenuState(false);
}

window.addEventListener('resize', () => {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  const overlay = document.querySelector('.sidebar-overlay');
  if (window.innerWidth > 1050) {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  }
  syncNavIcons();
});

/* ── Public mobile nav ──────────────────────────────────────── */
function initMobileNav() {
  const btn = document.getElementById('nav-menu-btn');
  const panel = document.getElementById('mobile-nav');
  if (!btn || !panel) return;

  function setOpen(open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  btn.addEventListener('click', () => setOpen(panel.hidden));

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1050) setOpen(false);
  });
}

/* ── Heart / Wishlist Toggle ────────────────────────────────── */
function initHearts() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.heart-btn');
    if (!btn) return;
    const liked = btn.classList.toggle('on');
    btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
    btn.setAttribute('aria-label', liked ? 'Remove saved project' : 'Save project');
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
  const grid = document.getElementById(gridId);
  if (!input || !grid) return;

  const empty = document.getElementById('projects-empty');

  function runFilter() {
    const query = input.value.toLowerCase().trim();
    let visible = 0;
    grid.querySelectorAll('.property-card').forEach((card) => {
      const name = (card.dataset.name || '').toLowerCase();
      const tags = (card.dataset.tags || '').toLowerCase();
      const text = card.innerText.toLowerCase();
      const match = !query || name.includes(query) || tags.includes(query) || text.includes(query);
      card.style.display = match ? '' : 'none';
      if (match) visible += 1;
    });
    if (empty) empty.hidden = visible > 0;
  }

  input.addEventListener('input', runFilter);
  runFilter();
}

function initHeroExplore() {
  const btn = document.getElementById('hero-explore-btn');
  const projects = document.getElementById('projects');
  if (!btn || !projects) return;
  btn.addEventListener('click', () => {
    projects.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
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
  initMobileNav();
  initHeroExplore();
  if (document.getElementById('hero-search') && document.getElementById('property-grid')) {
    initProjectFilter('hero-search', 'property-grid');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
