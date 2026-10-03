/* ============================================================
   PRIMESPACE — SHARED APP UTILITIES
   Emirates Properties | PrimeSpace
   Genuinely shared logic only — no page-specific code here.
   ============================================================ */

/* ── Toast Notification ─────────────────────────────────────── */
function toastKind(message) {
  return /could not|failed|invalid|insufficient|error|too long|required|not match|wait|blocked|suspended|denied|unable/i.test(String(message || ''))
    ? 'error'
    : 'success';
}

function toastIcon(kind) {
  if (kind === 'error') {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v5"/><path d="M12 16.2h.01"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="m8.5 12.2 2.3 2.3 4.7-5"/></svg>';
}

function toast(message, options) {
  const el = document.querySelector('.toast');
  if (!el) return;
  const text = String(message || '').trim();
  if (!text) return;
  const duration = typeof options === 'number' ? options : ((options && options.duration) || 3200);
  const kind = (options && typeof options === 'object' && options.kind) || toastKind(text);
  if (el.classList.contains('is-on') && el.dataset.msg === text) return;
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  el.dataset.msg = text;
  el.className = `toast toast-${kind} is-on`;
  el.innerHTML = `<span class="toast-ico">${toastIcon(kind)}</span><span class="toast-text">${safe}</span>`;
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    el.classList.remove('is-on');
    el.dataset.msg = '';
  }, duration);
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

function initCatalog(searchId, gridId, filtersId) {
  const input = document.getElementById(searchId);
  const grid = document.getElementById(gridId);
  const filters = filtersId ? document.getElementById(filtersId) : null;
  if (!input || !grid) return;

  const empty = document.getElementById('projects-empty');
  let mode = 'all';

  function runFilter() {
    const query = input.value.toLowerCase().trim();
    let visible = 0;
    grid.querySelectorAll('.property-card').forEach((card) => {
      const text = `${card.dataset.name || ''} ${card.innerText}`.toLowerCase();
      const textOk = !query || text.includes(query);
      const filterOk = mode === 'all'
        || (mode === 'trial' && card.dataset.trial === '1')
        || (mode === 'available' && card.dataset.open === '1')
        || (mode === 'closed' && card.dataset.open === '0');
      const show = textOk && filterOk;
      card.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });
    if (empty) empty.hidden = visible > 0;
  }

  input.addEventListener('input', runFilter);
  if (filters) {
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      mode = btn.dataset.filter || 'all';
      filters.querySelectorAll('[data-filter]').forEach((el) => {
        const on = el === btn;
        el.classList.toggle('active', on);
        el.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      runFilter();
    });
  }
  runFilter();
}

function mountPicker(select) {
  if (!select || select.dataset.picker === '1') return;
  select.dataset.picker = '1';
  const picker = document.createElement('div');
  picker.className = 'picker';
  select.classList.add('picker-native');
  select.parentNode.insertBefore(picker, select);
  picker.appendChild(select);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'picker-btn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="picker-label"></span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

  const menu = document.createElement('ul');
  menu.className = 'picker-menu';
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;
  picker.appendChild(btn);
  picker.appendChild(menu);

  function paint() {
    const current = select.options[select.selectedIndex];
    btn.querySelector('.picker-label').textContent = current ? current.textContent : 'Select';
    menu.replaceChildren();
    [...select.options].forEach((opt) => {
      const item = document.createElement('li');
      item.setAttribute('role', 'option');
      item.dataset.value = opt.value;
      item.textContent = opt.textContent;
      if (opt.value === select.value && !opt.disabled) item.setAttribute('aria-selected', 'true');
      item.addEventListener('click', () => {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        closeMenu();
        paint();
      });
      menu.appendChild(item);
    });
  }

  function place() {
    const rect = btn.getBoundingClientRect();
    const width = Math.max(rect.width, 148);
    menu.style.width = `${width}px`;
    menu.hidden = false;
    const height = menu.offsetHeight;
    const below = window.innerHeight - rect.bottom;
    const openUp = below < height + 12 && rect.top > height + 12;
    menu.style.top = `${openUp ? rect.top - height - 6 : rect.bottom + 6}px`;
    const left = Math.min(Math.max(8, rect.right - width), window.innerWidth - width - 8);
    menu.style.left = `${left}px`;
  }

  function closeMenu() {
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    document.querySelectorAll('.picker-menu').forEach((node) => { node.hidden = true; });
    document.querySelectorAll('.picker-btn').forEach((node) => node.setAttribute('aria-expanded', 'false'));
    place();
    btn.setAttribute('aria-expanded', 'true');
  }

  btn.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (menu.hidden) openMenu();
    else closeMenu();
  });
  select.addEventListener('change', paint);
  new MutationObserver(paint).observe(select, { childList: true });
  paint();
}

function initPickers(root) {
  const scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll('select:not([data-picker])').forEach(mountPicker);
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
  initPickers();
  document.addEventListener('click', (event) => {
    if (event.target.closest('.picker')) return;
    document.querySelectorAll('.picker-menu').forEach((node) => { node.hidden = true; });
    document.querySelectorAll('.picker-btn').forEach((node) => node.setAttribute('aria-expanded', 'false'));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.picker-menu').forEach((node) => { node.hidden = true; });
    document.querySelectorAll('.picker-btn').forEach((node) => node.setAttribute('aria-expanded', 'false'));
  });
  initOverlay();
  initActiveNav();
  initDemoForms();
  initMobileNav();
  if (document.getElementById('catalog-search') && document.getElementById('property-grid')) {
    initCatalog('catalog-search', 'property-grid', 'catalog-filters');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
