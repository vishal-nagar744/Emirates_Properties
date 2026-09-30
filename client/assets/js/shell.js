/* ============================================================
   Shared member + admin chrome
   ============================================================ */

function badge(status) {
  const key = String(status || '').toLowerCase();
  const map = {
    active: 'ok', available: 'ok', completed: 'ok', credit: 'ok',
    pending: 'warn', processing: 'warn', frozen: 'warn',
    rejected: 'bad', cancelled: 'bad', suspended: 'bad', failed: 'bad', debit: 'bad',
    inactive: 'muted',
  };
  const label = key ? key.charAt(0).toUpperCase() + key.slice(1) : '';
  return `<span class="status status-${map[key] || 'muted'}">${label}</span>`;
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast('Copied')).catch(() => toast('Copied to clipboard'));
    return;
  }
  const area = document.createElement('textarea');
  area.value = text;
  document.body.appendChild(area);
  area.select();
  try { document.execCommand('copy'); toast('Copied'); } catch { toast('Could not copy'); }
  area.remove();
}

function openModal(innerHtml) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = `
    <div class="modal-back" data-close-modal>
      <div class="modal card" role="dialog" aria-modal="true">${innerHtml}</div>
    </div>`;
  const back = root.querySelector('.modal-back');
  back.addEventListener('click', (e) => {
    if (e.target === back) root.innerHTML = '';
  });
  root.querySelectorAll('[data-dismiss]').forEach((btn) => {
    btn.addEventListener('click', () => { root.innerHTML = ''; });
  });
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

function navIcon(name) {
  const paths = {
    home: '<path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l2.5 1.5"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5"/><path d="M12 16V8"/><path d="M16 16v-3"/>',
    wallet: '<rect x="3" y="7" width="18" height="12" rx="2"/><path d="M3 11h18"/><circle cx="16" cy="14.5" r="1"/>',
    user: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.5c1.4-3 3.6-4.5 6.5-4.5s5.1 1.5 6.5 4.5"/>',
    bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l1.4 2H4.6z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    users: '<circle cx="9" cy="8" r="3"/><path d="M3.5 19c1.2-2.6 3-4 5.5-4s4.3 1.4 5.5 4"/><circle cx="17" cy="9" r="2.2"/><path d="M16 15.2c1.6-.5 3-.2 4.2 1.3"/>',
    card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/>',
    share: '<circle cx="7" cy="12" r="2.2"/><circle cx="17" cy="7" r="2.2"/><circle cx="17" cy="17" r="2.2"/><path d="M9 11.2 14.8 8.2M9 12.8l5.8 3"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    support: '<path d="M5 15v-2a7 7 0 0 1 14 0v2"/><rect x="4" y="14" width="4" height="5" rx="1"/><rect x="16" y="14" width="4" height="5" rx="1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    logout: '<path d="M9 6H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/><path d="M14 16l4-4-4-4M18 12H9"/>',
  };
  return `<svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}

function memberNav(active) {
  const items = [
    ['dashboard', 'dashboard.html', 'home', 'Dashboard'],
    ['projects', 'projects.html', 'grid', 'Projects'],
    ['orders', 'orders.html', 'clock', 'Orders'],
    ['earnings', 'earnings.html', 'chart', 'Earnings'],
    ['wallet', 'wallet.html', 'wallet', 'Wallet'],
    ['profile', 'profile.html', 'user', 'Profile'],
  ];
  return items.map(([id, href, icon, label]) => (
    `<a class="sidelink${id === active ? ' active' : ''}" href="${href}" title="${label}"><span class="sideicon">${navIcon(icon)}</span><span class="sidelabel">${label}</span></a>`
  )).join('');
}

function adminNav(active) {
  const items = [
    ['dashboard', 'dashboard.html', 'home', 'Dashboard'],
    ['users', 'users.html', 'users', 'Users'],
    ['projects', 'projects.html', 'grid', 'Projects'],
    ['cashouts', 'cashouts.html', 'card', 'Cash out'],
    ['referrals', 'referrals.html', 'share', 'Referrals'],
    ['settings', 'settings.html', 'gear', 'Settings'],
  ];
  return items.map(([id, href, icon, label]) => (
    `<a class="sidelink${id === active ? ' active' : ''}" href="${href}" title="${label}"><span class="sideicon">${navIcon(icon)}</span><span class="sidelabel">${label}</span></a>`
  )).join('');
}

function crumbLabel(page) {
  const labels = {
    dashboard: 'Dashboard',
    projects: 'Projects',
    project: 'Projects',
    orders: 'Orders',
    earnings: 'Earnings',
    wallet: 'Wallet',
    profile: 'Profile',
    users: 'Users',
    cashouts: 'Cash out',
    referrals: 'Referrals',
    settings: 'Settings',
  };
  return labels[page] || 'Dashboard';
}

function mountShell() {
  const app = document.body.dataset.app;
  const page = document.body.dataset.page || 'dashboard';
  if (!app || app === 'admin-login') return;
  if (app === 'admin' && !Store.requireAdmin()) {
    window.location.href = 'login.html';
    return;
  }

  const user = Store.user();
  const initial = (user.fullName || 'A').trim().charAt(0).toUpperCase();
  const unread = Store.unreadCount();
  const isAdmin = app === 'admin';

  const aside = isAdmin
    ? `<aside class="sidebar" id="sidebar" aria-label="Admin navigation">
        <div class="sidebrand">
          <a class="brand" href="dashboard.html" aria-label="Emirates Properties"><img class="brand-logo" src="../assets/logo-nobg.png" alt="Emirates Properties"></a>
          <button class="icon-btn sidebar-toggle" type="button" id="menu-toggle" aria-label="Close menu" aria-expanded="true">${navIcon('menu')}</button>
        </div>
        <nav class="sidenav" aria-label="Admin">${adminNav(page)}</nav>
        <div class="sidebottom">
          <a class="sidelink" href="#" id="admin-logout" title="Log out"><span class="sideicon">${navIcon('logout')}</span><span class="sidelabel">Log out</span></a>
        </div>
      </aside>`
    : `<aside class="sidebar" id="sidebar" aria-label="Member navigation">
        <div class="sidebrand">
          <a class="brand" href="dashboard.html" aria-label="Emirates Properties"><img class="brand-logo" src="../assets/logo-nobg.png" alt="Emirates Properties"></a>
          <button class="icon-btn sidebar-toggle" type="button" id="menu-toggle" aria-label="Close menu" aria-expanded="true">${navIcon('menu')}</button>
        </div>
        <nav class="sidenav" aria-label="Workspace">
          <div class="sidetitle">Workspace</div>
          ${memberNav(page === 'project' ? 'projects' : page)}
        </nav>
        <div class="sidebottom">
          <div class="side-user">
            <div class="avatar" aria-hidden="true">${initial}</div>
            <div class="side-user-meta">
              <b>${user.fullName}</b>
              <small>${badge(user.accountStatus)}</small>
            </div>
            <a href="../index.html" title="Public site" aria-label="Return to public site">↪</a>
          </div>
        </div>
      </aside>`;

  const root = document.createElement('div');
  root.innerHTML = `
    ${aside}
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <div class="main">
      <header class="dashbar">
        <div class="dashbar-left">
          <button class="icon-btn mobile-menu" type="button" id="menu-open" aria-label="Open menu" aria-expanded="false">${navIcon('menu')}</button>
          <nav class="crumbs" aria-label="Breadcrumb">
            <a href="dashboard.html">${isAdmin ? 'Admin' : 'Workspace'}</a>
            <span class="crumb-sep" aria-hidden="true">/</span>
            <span id="crumb-here">${crumbLabel(page)}</span>
          </nav>
        </div>
        <div class="dashbar-right">
          ${isAdmin ? '' : `<div class="notify-wrap">
            <button class="icon-btn" type="button" id="notify-btn" aria-label="Notifications" aria-expanded="false" aria-controls="notify-drawer">
              ${navIcon('bell')}
              <span class="count-pill" id="notify-count"${unread ? '' : ' hidden'}>${unread}</span>
            </button>
            <aside class="drawer notify-pop" id="notify-drawer" hidden aria-label="Notifications"></aside>
          </div>`}
          <div class="avatar" aria-hidden="true">${isAdmin ? 'AD' : initial}</div>
        </div>
      </header>
      <main class="page" id="page"></main>
    </div>
    <div id="modal-root"></div>
    ${isAdmin ? '' : `<nav class="mobnav" aria-label="Mobile">
      <a href="dashboard.html" class="${page === 'dashboard' ? 'active' : ''}">Home</a>
      <a href="projects.html" class="${page === 'projects' || page === 'project' ? 'active' : ''}">Projects</a>
      <a href="orders.html" class="${page === 'orders' ? 'active' : ''}">Orders</a>
      <a href="wallet.html" class="${page === 'wallet' ? 'active' : ''}">Wallet</a>
      <a href="profile.html" class="${page === 'profile' ? 'active' : ''}">Profile</a>
    </nav>`}
  `;
  document.body.prepend(root);

  const menu = document.getElementById('menu-toggle');
  if (menu) menu.addEventListener('click', toggleSide);
  const menuOpen = document.getElementById('menu-open');
  if (menuOpen) menuOpen.addEventListener('click', toggleSide);
  if (typeof syncNavIcons === 'function') syncNavIcons();
  const overlay = document.getElementById('sidebar-overlay');
  if (overlay) overlay.addEventListener('click', closeSide);

  const notifyBtn = document.getElementById('notify-btn');
  if (notifyBtn) notifyBtn.addEventListener('click', toggleNotify);

  const adminOut = document.getElementById('admin-logout');
  if (adminOut) {
    adminOut.addEventListener('click', (e) => {
      e.preventDefault();
      Store.adminLogout();
      window.location.href = 'login.html';
    });
  }

  document.addEventListener('click', (e) => {
    const drawer = document.getElementById('notify-drawer');
    const btn = document.getElementById('notify-btn');
    if (!drawer || drawer.hidden || !btn) return;
    if (btn.contains(e.target) || drawer.contains(e.target)) return;
    drawer.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  });
}

function toggleNotify() {
  const drawer = document.getElementById('notify-drawer');
  const btn = document.getElementById('notify-btn');
  if (!drawer) return;
  if (!drawer.hidden) {
    drawer.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
    return;
  }
  if (btn) btn.setAttribute('aria-expanded', 'true');
  const items = Store.notifications();
  drawer.hidden = false;
  drawer.innerHTML = `
    <div class="drawer-head">
      <h3>Notifications</h3>
      <button class="btn light" type="button" id="mark-read">Mark all read</button>
    </div>
    <div class="drawer-list">
      ${items.length ? items.map((n) => `
        <article class="note${n.read ? '' : ' unread'}">
          <b>${n.title}</b>
          <p>${n.body}</p>
          <small>${n.createdAt.slice(0, 10)}</small>
        </article>`).join('') : '<p class="muted">No notifications yet.</p>'}
    </div>`;
  document.getElementById('mark-read').addEventListener('click', () => {
    Store.markAllRead();
    const pill = document.getElementById('notify-count');
    if (pill) {
      pill.textContent = '0';
      pill.hidden = true;
    }
    toggleNotify();
    toast('Notifications marked read');
  });
}

function refreshNotifyCount() {
  const pill = document.getElementById('notify-count');
  if (!pill) return;
  const n = Store.unreadCount();
  pill.textContent = String(n);
  pill.hidden = n === 0;
}

mountShell();
