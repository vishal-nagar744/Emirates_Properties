/* ============================================================
   Member workspace pages (UI demo)
   ============================================================ */

const Member = (() => {
  const API_BASE = window.apiBase ? window.apiBase() : 'http://127.0.0.1:4000';
  let catalog = [];
  let groupsCache = [];
  let ordersCache = [];
  let commissionsCache = [];
  let referralsCache = [];
  let txCache = [];
  let accountsCache = [];
  let sessionsCache = [];
  let platform = {
    platformName: 'Emirates Properties',
    welcomeBonusAmount: 100,
    minCashOutAmount: 500,
    supportTelegramUsername: 'EmiratesPropertiesSupport',
    demoCashInUSDTAddress: '',
  };
  let loadError = '';

  function pageEl() {
    return document.getElementById('page');
  }

  async function memberApi(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' };
    const token = localStorage.getItem('ps_token');
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body) headers['Content-Type'] = 'application/json';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (err && err.name === 'AbortError') throw new Error('The server took too long to respond.');
      throw new Error('Could not reach the server.');
    } finally {
      clearTimeout(timer);
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      localStorage.removeItem('ps_token');
      localStorage.removeItem('ps_member');
      sessionStorage.removeItem('ps_token');
      sessionStorage.removeItem('ps_member');
      sessionStorage.removeItem('ps_pending_notice');
      window.location.href = 'login.html';
      return new Promise(() => {});
    }
    if (!res.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }

  function accountNote() {
    const status = Store.user().accountStatus;
    if (status === 'pending') {
      return `<div class="notice notice-pending" role="status"><span class="status status-pending">Pending</span><p>An admin needs to approve this account before you can submit an order or cash out.</p></div>`;
    }
    if (status === 'blocked') return '<div class="notice" role="status"><p>This account is blocked.</p></div>';
    if (status === 'suspended') return '<div class="notice" role="status"><p>This account is suspended.</p></div>';
    return '';
  }

  function maybePendingNotice() {
    const status = Store.user().accountStatus;
    if (status !== 'pending') {
      sessionStorage.removeItem('ps_pending_notice');
      return;
    }
    if (sessionStorage.getItem('ps_pending_notice') === '1') return;
    sessionStorage.setItem('ps_pending_notice', '1');
    openModal(`
      <p>An admin needs to approve this account before you can submit an order or cash out.</p>
      <div class="modal-actions">
        <button class="btn primary" type="button" data-dismiss>Close</button>
      </div>`);
  }

  function greeting() {
    const hour = new Date().getHours();
    const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const first = (Store.user().fullName || 'there').split(' ')[0];
    return `${hello}, ${first}`;
  }

  function emptyState(icon, title, text) {
    return `<div class="empty-state">${navIcon(icon)}<b>${esc(title)}</b><p>${esc(text)}</p></div>`;
  }

  function renderDashboard() {
    const today = Store.dayKey(0);
    const todayCommission = commissionsCache.filter((c) => c.date === today).reduce((s, c) => s + c.amount, 0);
    const totalCommission = commissionsCache.reduce((s, c) => s + c.amount, 0);
    const wallet = Store.user().walletBalance || 0;
    pageEl().innerHTML = `
      ${accountNote()}
      <section class="welcome-banner">
        <h1 class="serif">${greeting()}.</h1>
        <div class="hero-ctas">
          <a class="btn primary" href="projects.html">Explore projects</a>
          <a class="btn light" href="wallet.html">View wallet</a>
        </div>
      </section>
      <div class="kpis">
        ${kpi('Wallet balance', Store.money(wallet), 'Available')}
        ${kpi("Today's commission", Store.money(todayCommission), 'Credited today')}
        ${kpi('Total commission', Store.money(totalCommission), 'All completed credits')}
        ${kpi('Orders', String(ordersCache.length), 'Submitted orders')}
      </div>
      <section class="card box">
        <div class="boxhead"><h3>Your orders</h3><a class="auth-link" href="orders.html">All orders</a></div>
        ${ordersCache.length ? ordersCache.slice(0, 3).map(activeCard).join('') : emptyState('grid', 'No orders yet', 'Open a project group and submit an order.')}
      </section>`;
  }

  function typeLabel(type) {
    const labels = {
      welcome_bonus: 'Welcome bonus',
      demo_cash_in: 'Cash in',
      project_activation: 'Activation',
      daily_commission: 'Commission',
      project_commission: 'Commission',
      cash_out: 'Cash out',
      refund: 'Refund',
      adjustment: 'Adjustment',
    };
    return labels[type] || String(type || '').replaceAll('_', ' ');
  }

  function kpi(label, value, hint) {
    return `<div class="card kpi"><small>${label}</small><b>${value}</b><span>${hint}</span></div>`;
  }

  function activeCard(order) {
    return `
      <a class="active-card" href="orders.html?id=${esc(order.id)}">
        <div class="active-card-top">
          ${order.image ? `<img src="${esc(order.image)}" alt="" width="64" height="64">` : ''}
          <div>
            <h3>${esc(order.projectName)}</h3>
            <p class="muted">${esc(String(order.createdAt || '').slice(0, 10))}</p>
          </div>
          <span class="active-go">View order</span>
        </div>
        <dl class="prop-stats">
          <div><dt>Price</dt><dd>${Store.money(order.price)}</dd></div>
          <div><dt>Commission</dt><dd>${Store.money(order.commissionAmount)}</dd></div>
          <div><dt>Status</dt><dd>${esc(order.status)}</dd></div>
        </dl>
      </a>`;
  }

  function renderProjects() {
    const groupId = new URLSearchParams(location.search).get('group') || '';
    if (!groupId) {
      setBreadcrumb([
        { href: 'dashboard.html', label: 'Workspace' },
        { label: 'Projects' },
      ]);
      pageEl().innerHTML = `
        <div class="page-head"><h2 class="serif">Projects</h2></div>
        ${groupsCache.length ? `
        <div class="catalog-bar">
          <label class="search-bar page-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16.5 20 20.5"/></svg>
            <input id="project-search" type="search" placeholder="Search groups" aria-label="Search groups">
          </label>
        </div>
        <div class="grid-4" id="project-grid">
          ${groupsCache.map(groupCard).join('')}
        </div>
        <div class="empty-state" id="projects-empty" hidden>${navIcon('grid')}<b>No groups match</b><p>Try another search.</p></div>` : emptyState('grid', loadError || 'No project groups yet', loadError ? 'Refresh the page and try again.' : 'Groups added by the team will appear here.')}`;
      initCatalog('project-search', 'project-grid');
      return;
    }
    const group = groupsCache.find((item) => item.id === groupId);
    const list = catalog;
    setBreadcrumb([
      { href: 'dashboard.html', label: 'Workspace' },
      { href: 'projects.html', label: 'Projects' },
      { label: group ? group.name : 'Group' },
    ]);
    pageEl().innerHTML = `
      <div class="page-head">
        <div class="page-title-row">
          <a class="icon-btn back-btn" href="projects.html" aria-label="Back to projects"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg></a>
          <div>
            <h2 class="serif">${esc(group ? group.name : 'Projects')}</h2>
            ${group && group.description ? `<p class="muted">${esc(group.description)}</p>` : ''}
          </div>
        </div>
      </div>
      ${list.length ? `
      <div class="catalog-bar">
        <label class="search-bar page-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16.5 20 20.5"/></svg>
          <input id="project-search" type="search" placeholder="Search projects" aria-label="Search projects">
        </label>
        <div class="catalog-filters" id="project-filters" role="group" aria-label="Filter projects">
          <button class="chip active" type="button" data-filter="all" aria-pressed="true">All</button>
          <button class="chip" type="button" data-filter="available" aria-pressed="false">Available</button>
          <button class="chip" type="button" data-filter="closed" aria-pressed="false">Closed</button>
        </div>
      </div>
      <div class="grid-4" id="project-grid">
        ${list.map(projectCard).join('')}
      </div>
      <div class="empty-state" id="projects-empty" hidden>${navIcon('grid')}<b>No projects match</b><p>Try another search or filter.</p></div>` : emptyState('grid', 'No projects in this group', 'Projects added to this group will appear here.')}`;
    initCatalog('project-search', 'project-grid', 'project-filters');
  }

  function groupCard(group) {
    return `<a class="card property-card" href="projects.html?group=${esc(group.id)}" data-name="${esc(group.name)}">
      <div class="property-img">${group.image ? `<img src="${esc(group.image)}" alt="" loading="lazy">` : ''}</div>
      <div class="prop-body">
        <div class="prop-meta"><span>${group.projectCount} project${group.projectCount === 1 ? '' : 's'}</span></div>
        <h3>${esc(group.name)}</h3>
        ${group.description ? `<p class="prop-line group-desc">${esc(group.description)}</p>` : ''}
      </div>
    </a>`;
  }

  function boughtIds() {
    return new Set(ordersCache.filter((order) => order.status === 'active' || order.status === 'completed').map((order) => order.projectId));
  }

  function projectCard(p) {
    const open = p.status === 'active';
    const status = open ? 'Available' : 'Closed';
    const bought = boughtIds().has(p.id);
    const groupId = new URLSearchParams(location.search).get('group') || p.groupId || '';
    const body = `
        <div class="property-img">
          ${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy">` : ''}
          ${bought ? '<span class="prop-tag is-bought">Ordered</span>' : ''}
        </div>
        <div class="prop-body">
          <div class="prop-meta"><span>${esc(p.commissionRatio)}%</span><span class="prop-status">${status}</span></div>
          <h3>${esc(p.name)}</h3>
          ${p.address ? `<p class="prop-line">${esc(p.address)}</p>` : ''}
          ${p.developer ? `<p class="prop-line">${esc(p.developer)}</p>` : ''}
          <dl class="prop-stats">
            <div><dt>Price</dt><dd>${Store.money(p.price)}</dd></div>
            <div><dt>Ratio</dt><dd>${esc(p.commissionRatio)}%</dd></div>
            <div><dt>Commission</dt><dd>${Store.money(p.commissionAmount)}</dd></div>
          </dl>
        </div>`;
    if (!open) {
      return `<article class="card property-card is-closed" aria-disabled="true" data-name="${esc(p.name)}" data-open="0">${body}</article>`;
    }
    return `<a class="card property-card" href="project-details.html?id=${esc(p.id)}&group=${esc(groupId)}" data-name="${esc(p.name)}" data-open="1">${body}</a>`;
  }

  function renderProject() {
    const id = new URLSearchParams(location.search).get('id') || '';
    const p = catalog.find((item) => item.id === id) || null;
    if (!p) {
      pageEl().innerHTML = emptyState('grid', 'Project not found', 'This project is not in the catalog.');
      return;
    }
    const bought = boughtIds().has(p.id);
    const status = Store.user().accountStatus;
    const blocked = status === 'pending' || status === 'blocked' || status === 'suspended';
    const closed = p.status !== 'active';
    const label = bought ? 'Order submitted' : closed ? 'Closed' : blocked ? 'Approval required' : 'Submit order';
    const groupId = new URLSearchParams(location.search).get('group') || p.groupId || '';
    const backHref = groupId ? `projects.html?group=${encodeURIComponent(groupId)}` : 'projects.html';
    setBreadcrumb([
      { href: 'dashboard.html', label: 'Workspace' },
      { href: 'projects.html', label: 'Projects' },
      ...(groupId ? [{ href: backHref, label: p.groupName || 'Group' }] : []),
      { label: p.name },
    ]);
    pageEl().innerHTML = `
      ${accountNote()}
      <div class="page-title-row detail-back">
        <a class="icon-btn back-btn" href="${esc(backHref)}" aria-label="Back"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg></a>
        <h2 class="serif">${esc(p.name)}</h2>
        ${badge(p.status === 'active' ? 'available' : 'inactive')}
      </div>
      <div class="detail-grid">
        <div>
          <div class="detail-img">${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}">` : ''}${bought ? '<span class="prop-tag is-bought detail-bought">Ordered</span>' : ''}</div>
          ${(p.address || p.developer || p.description) ? `<section class="card box detail-copy">
            ${p.address ? `<p class="prop-line">${esc(p.address)}</p>` : ''}
            ${p.developer ? `<p class="prop-line">${esc(p.developer)}</p>` : ''}
            ${p.description ? `<p class="lead">${esc(p.description)}</p>` : ''}
          </section>` : ''}
        </div>
        <aside class="card box">
          <dl class="stack-stats">
            ${row('Price', Store.money(p.price))}
            ${row('Commission ratio', `${esc(p.commissionRatio)}%`)}
            ${row('Commission', Store.money(p.commissionAmount))}
          </dl>
          <button class="btn primary btn-full" type="button" data-action="open-activate" data-id="${p.id}" ${bought || closed || blocked ? 'disabled' : ''}>${label}</button>
        </aside>
      </div>`;
  }

  function row(label, value) {
    return `<div class="stack-row"><span>${label}</span><b>${value}</b></div>`;
  }

  function openActivate(projectId) {
    const p = catalog.find((item) => item.id === projectId);
    if (!p || p.status !== 'active' || boughtIds().has(p.id)) return;
    openModal(`
      <p class="smallcaps">Confirm</p>
      <h3>Submit order</h3>
      <p class="muted">${esc(p.name)}</p>
      <dl class="stack-stats">
        ${row('Price', Store.money(p.price))}
        ${row('Commission ratio', `${esc(p.commissionRatio)}%`)}
        ${row('Commission added to wallet', Store.money(p.commissionAmount))}
      </dl>
      <p class="muted">The project price is not charged. The commission is added when you submit.</p>
      <div class="modal-actions">
        <button class="btn light" type="button" data-dismiss>Cancel</button>
        <button class="btn primary" type="button" data-action="confirm-activate" data-id="${p.id}">Submit order</button>
      </div>`);
  }

  function renderOrders() {
    const params = new URLSearchParams(location.search);
    const filter = params.get('status') || 'all';
    const tab = params.get('tab') === 'commission' ? 'commission' : 'orders';
    const selectedId = params.get('id') || '';
    let list = ordersCache;
    if (filter === 'active') list = list.filter((o) => o.status === 'active');
    if (filter === 'completed') list = list.filter((o) => o.status === 'completed');
    const ids = new Set(list.map((o) => o.id));
    const selected = selectedId ? ordersCache.find((o) => o.id === selectedId) : null;
    const backIcon = '<svg class="back-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg>';
    if (selectedId && !selected) {
      pageEl().innerHTML = `
        <div class="page-head">
          <div class="page-title-row">
            <a class="icon-btn back-btn" href="orders.html" aria-label="Back to orders">${backIcon}</a>
            <h2 class="serif">Orders</h2>
          </div>
        </div>
        ${emptyState('clock', 'Order not found', 'This order is not on your account.')}`;
      return;
    }
    const commissions = commissionsCache.filter((c) => ids.has(c.orderId));
    pageEl().innerHTML = `
      <div class="page-head">
        ${selected ? `
          <div class="page-title-row">
            <a class="icon-btn back-btn" href="orders.html?status=${filter}&tab=orders" aria-label="Back to orders">${backIcon}</a>
            <div>
              <h2 class="serif">${esc(selected.projectName)}</h2>
              <p class="muted">${esc(selected.id)}</p>
            </div>
          </div>
          ${badge(selected.status)}` : `
          <h2 class="serif">Orders</h2>
          <div class="page-tools">
            <div class="chips" role="group" aria-label="Filter orders">
              ${chip('all', 'All', filter, tab)}
              ${chip('active', 'Active', filter, tab)}
              ${chip('completed', 'Completed', filter, tab)}
            </div>
          </div>`}
      </div>
      ${selected ? orderDetail(selected) : `
      <section class="card box order-panel">
        <div class="order-head">
          <div class="tabbar" role="tablist" aria-label="Orders">
            <a class="seg-btn${tab === 'orders' ? ' active' : ''}" role="tab" aria-selected="${tab === 'orders'}" href="orders.html?status=${filter}&tab=orders">Orders</a>
            <a class="seg-btn${tab === 'commission' ? ' active' : ''}" role="tab" aria-selected="${tab === 'commission'}" href="orders.html?status=${filter}&tab=commission">Commission</a>
          </div>
        </div>
        <div class="tablewrap">
          ${tab === 'commission' ? `
            <table class="data-table">
              <thead><tr><th>Date</th><th>Project</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                ${commissions.length ? commissions.map((c) => `<tr class="order-row" tabindex="0" data-href="orders.html?status=${filter}&id=${esc(c.orderId)}"><td>${esc(c.date)}</td><td>${esc(c.projectName)}</td><td>Order</td><td>+${Store.money(c.amount)}</td><td>${badge(c.status)}</td></tr>`).join('') : `<tr><td colspan="5">${emptyState('chart', commissionsCache.length ? 'No commission in this view' : 'No commission yet', commissionsCache.length ? 'Try another order status.' : 'Commission appears here after you submit an order.')}</td></tr>`}
              </tbody>
            </table>` : `
            <table class="data-table">
              <thead><tr><th>Order</th><th>Project</th><th>Price</th><th>Commission</th><th>Status</th></tr></thead>
              <tbody>
                ${list.length ? list.map((o) => `<tr class="order-row" tabindex="0" data-href="orders.html?status=${filter}&id=${esc(o.id)}">
                  <td>${esc(o.id)}<div class="muted">${esc(String(o.createdAt || '').slice(0, 10))}</div></td>
                  <td>${esc(o.projectName)}</td>
                  <td>${Store.money(o.price)}</td>
                  <td>${Store.money(o.commissionAmount)}</td>
                  <td>${badge(o.status)}</td>
                </tr>`).join('') : `<tr><td colspan="5">${emptyState('clock', ordersCache.length ? 'No orders in this view' : 'No orders yet', ordersCache.length ? 'Try another status.' : 'Submit an order and it will appear here.')}</td></tr>`}
              </tbody>
            </table>`}
        </div>
      </section>`}`;
    document.querySelectorAll('.order-row').forEach((row) => {
      const open = () => { window.location.href = row.dataset.href; };
      row.addEventListener('click', open);
      row.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        open();
      });
    });
  }

  function orderDetail(o) {
    const log = commissionsCache.filter((c) => c.orderId === o.id);
    return `
      <section class="card box order-panel" id="order-detail">
        <dl class="fact-grid">
          <div><dt>Project</dt><dd>${esc(o.projectName)}</dd></div>
          <div><dt>Submitted</dt><dd>${esc(String(o.createdAt || '').slice(0, 10))}</dd></div>
          <div><dt>Price</dt><dd>${Store.money(o.price)}</dd></div>
          <div><dt>Ratio</dt><dd>${esc(o.commissionRatio)}%</dd></div>
          <div><dt>Commission</dt><dd>${Store.money(o.commissionAmount)}</dd></div>
          <div><dt>Status</dt><dd>${esc(o.status)}</dd></div>
        </dl>
        <h4 class="order-sub">Commission</h4>
        <div class="tablewrap">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              ${log.length ? log.map((c) => `<tr><td>${esc(c.date)}</td><td>Order</td><td>+${Store.money(c.amount)}</td><td>${badge(c.status)}</td></tr>`).join('') : `<tr><td colspan="4">${emptyState('chart', 'No commission yet', 'Commission is added when the order is submitted.')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function chip(id, label, current, tab) {
    return `<a class="chip${id === current ? ' active' : ''}" href="orders.html?status=${id}&tab=${tab || 'orders'}">${label}</a>`;
  }

  function renderEarnings() {
    const range = new URLSearchParams(location.search).get('range') || '30';
    const all = commissionsCache;
    const today = Store.dayKey(0);
    const list = all.filter((c) => inRange(c.date, range, today));
    const sum = (pred) => all.filter(pred).reduce((s, c) => s + c.amount, 0);
    const weekStart = Store.dayKey(6);
    const monthStart = Store.dayKey(29);
    const max = Math.max(1, ...bucket(list));
    const bars = bucket(list);
    pageEl().innerHTML = `
      <div class="page-head">
        <div>
          <h2 class="serif">Earnings</h2>
        </div>
      </div>
      <div class="kpis">
        ${kpi('Today', Store.money(sum((c) => c.date === today)), 'Credited today')}
        ${kpi('This week', Store.money(sum((c) => c.date >= weekStart)), 'Last 7 days')}
        ${kpi('This month', Store.money(sum((c) => c.date >= monthStart)), 'Last 30 days')}
        ${kpi('Total', Store.money(sum(() => true)), 'All time')}
      </div>
      <div class="chips">
        ${rangeChip('7', '7 days', range)}
        ${rangeChip('30', '30 days', range)}
        ${rangeChip('90', '90 days', range)}
        ${rangeChip('all', 'All time', range)}
      </div>
      <section class="card box">
        ${list.length ? `
        <div class="bar-chart" aria-hidden="true">
          ${bars.map((n) => `<div class="bar" style="height:${Math.max(8, Math.round((n / max) * 100))}%"></div>`).join('')}
        </div>
        <div class="tablewrap">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Project</th><th>Order</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              ${list.map((c) => `<tr><td>${esc(c.date)}</td><td>${esc(c.projectName)}</td><td>${esc(c.orderId)}</td><td>+${Store.money(c.amount)}</td><td>${badge(c.status)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>` : `<div class="empty-wrap">${emptyState('chart', loadError ? 'Could not load earnings' : 'No commission in this range', loadError || 'Choose another range, or wait for the next credit.')}</div>`}
      </section>`;
  }

  function rangeChip(id, label, current) {
    return `<a class="chip${id === current ? ' active' : ''}" href="earnings.html?range=${id}">${label}</a>`;
  }

  function inRange(date, range, today) {
    if (range === 'all') return true;
    const days = Number(range) || 30;
    return date >= Store.dayKey(days - 1) && date <= today;
  }

  function bucket(list) {
    const map = {};
    list.forEach((c) => { map[c.date] = (map[c.date] || 0) + c.amount; });
    return Object.keys(map).sort().map((k) => map[k]);
  }

  function renderWallet() {
    const u = Store.user();
    const params = new URLSearchParams(location.search);
    const filter = params.get('type') || 'all';
    const tab = params.get('tab') === 'bind' ? 'bind' : 'tx';
    const modal = params.get('modal');
    const totalCommission = commissionsCache.reduce((sum, row) => sum + row.amount, 0);
    pageEl().innerHTML = `
      ${accountNote()}
      <div class="page-head">
        <h2 class="serif">Wallet</h2>
        <button class="btn light" type="button" data-action="withdraw-password">Cash out passwords</button>
      </div>
      <section class="card wallet-card">
        <div class="wallet-main">
          <div>
            <div class="smallcaps" style="color:#dcc99b">Available</div>
            <div class="wallet-balance">${Store.money(u.walletBalance)}</div>
          </div>
          <div class="wallet-actions">
            <button class="btn on-dark" type="button" data-action="open-cash-in">Cash in</button>
            <button class="btn on-dark-line" type="button" data-action="open-cash-out">Cash out</button>
          </div>
        </div>
        <div class="wallet-footer">
          <span>Pending cash out<br><b>${Store.money(u.pendingCashOut)}</b></span>
          <span>Total commission<br><b>${Store.money(totalCommission)}</b></span>
        </div>
      </section>
      <div class="seg" role="tablist" aria-label="Wallet">
        <a class="seg-btn${tab === 'tx' ? ' active' : ''}" href="wallet.html" role="tab" aria-selected="${tab === 'tx'}">Transactions</a>
        <a class="seg-btn${tab === 'bind' ? ' active' : ''}" href="wallet.html?tab=bind" role="tab" aria-selected="${tab === 'bind'}">Bind wallet</a>
      </div>
      ${tab === 'bind' ? bindPanel() : txPanel(filter)}`;
    if (tab === 'bind') bindBindForm();
    if (modal === 'cash-in') openCashIn();
    if (modal === 'cash-out') openCashOut();
    if (modal) {
      const next = tab === 'bind' ? 'wallet.html?tab=bind' : (filter === 'all' ? 'wallet.html' : `wallet.html?type=${filter}`);
      history.replaceState({}, '', next);
    }
  }

  function txPanel(filter) {
    const types = [
      ['all', 'All'],
      ['welcome_bonus', 'Welcome bonus'],
      ['demo_cash_in', 'Cash in'],
      ['project_activation', 'Activation'],
      ['project_commission', 'Commission'],
      ['daily_commission', 'Commission'],
      ['cash_out', 'Cash out'],
      ['refund', 'Refund'],
      ['adjustment', 'Adjustment'],
    ];
    let txs = txCache;
    if (filter !== 'all') txs = txs.filter((t) => t.type === filter);
    return `
      <section class="card box">
        <div class="chips">
          ${types.map(([id, label]) => `<a class="chip${id === filter ? ' active' : ''}" href="wallet.html?type=${id}">${label}</a>`).join('')}
        </div>
        <div class="tablewrap">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Type</th><th>Description</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${txs.length ? txs.map((t) => `<tr>
                <td class="mono">${esc(t.id)}</td>
                <td>${typeLabel(t.type)}</td>
                <td>${esc(t.description)}</td>
                <td>${t.direction === 'debit' ? '−' : '+'}${Store.money(t.amount)}</td>
                <td>${badge(t.status)}</td>
                <td>${esc(String(t.createdAt || '').slice(0, 16).replace('T', ' '))}</td>
              </tr>`).join('') : `<tr><td colspan="6">${emptyState('wallet', filter === 'all' ? 'No transactions' : 'No transactions in this view', filter === 'all' ? 'Cash in, activation, and commission will show here.' : 'Try another type.')}</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>`;
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function accountTitle(account) {
    return account.kind === 'bank' ? 'Bank account' : (account.network || 'Crypto');
  }

  function accountDetail(account) {
    if (account.kind === 'crypto') return account.address || '';
    return [account.holder, account.bankName, account.iban || account.accountNumber].filter(Boolean).join(' · ');
  }

  function bindPanel() {
    const list = accountsCache;
    const step = new URLSearchParams(location.search).get('bind') || '';
    return `
      <section class="card box">
        <div class="boxhead">
          <h3>Bound accounts</h3>
          <button class="btn primary" type="button" data-action="bind-address">${navIcon('plus')}<span>Bind address</span></button>
        </div>
        ${list.length ? `<ul class="bind-list">
          ${list.map((account) => `<li>
            <div>
              <b>${esc(accountTitle(account))}</b>
              <span>${esc(accountDetail(account))}</span>
            </div>
            <button class="btn light" type="button" data-action="unbind" data-id="${esc(account.id)}">Remove</button>
          </li>`).join('')}
        </ul>` : (step ? '' : `<div class="empty-wrap">${emptyState('card', 'No address bound', 'Add a crypto wallet or a bank account.')}</div>`)}
        ${step === 'choose' ? `
          <div class="bind-step">
            <h3>What do you want to bind?</h3>
            <div class="choice-grid">
              <button class="choice" type="button" data-action="bind-kind" data-kind="crypto">${navIcon('wallet')}<span>Crypto</span><small>USDT TRC20 or BEP20</small></button>
              <button class="choice" type="button" data-action="bind-kind" data-kind="bank">${navIcon('card')}<span>Bank account</span><small>IBAN and account details</small></button>
            </div>
          </div>` : ''}
        ${step === 'crypto' ? `
          <form class="fields bind-step" id="crypto-form">
            <h3>Crypto wallet</h3>
            <div class="field">
              <label for="crypto-network">Network</label>
              <select id="crypto-network">
                <option>USDT TRC20</option>
                <option>USDT BEP20</option>
              </select>
            </div>
            <div class="field">
              <label for="crypto-address">Wallet address</label>
              <input id="crypto-address" autocomplete="off" spellcheck="false" placeholder="Wallet address">
            </div>
            <p class="field-error" id="crypto-error" role="alert" hidden></p>
            <div class="bind-actions">
              <button class="btn light" type="button" data-action="bind-cancel">Cancel</button>
              <button class="btn primary" type="submit">Save address</button>
            </div>
          </form>` : ''}
        ${step === 'bank' ? `
          <form class="fields bind-step" id="bank-form">
            <h3>Bank account</h3>
            <div class="bind-grid">
              <div class="field">
                <label for="bank-holder">Account holder</label>
                <input id="bank-holder" autocomplete="name">
              </div>
              <div class="field">
                <label for="bank-name">Bank name</label>
                <input id="bank-name" autocomplete="organization">
              </div>
              <div class="field">
                <label for="bank-iban">IBAN</label>
                <input id="bank-iban" autocomplete="off" spellcheck="false" placeholder="AE…">
              </div>
              <div class="field">
                <label for="bank-number">Account number</label>
                <input id="bank-number" autocomplete="off" inputmode="numeric">
              </div>
            </div>
            <p class="field-error" id="bank-error" role="alert" hidden></p>
            <div class="bind-actions">
              <button class="btn light" type="button" data-action="bind-cancel">Cancel</button>
              <button class="btn primary" type="submit">Save account</button>
            </div>
          </form>` : ''}
      </section>`;
  }

  function bindBindForm() {
    const crypto = document.getElementById('crypto-form');
    if (crypto) {
      crypto.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('crypto-error');
        err.hidden = true;
        try {
          const data = await memberApi('/api/wallet/accounts', {
            method: 'POST',
            body: {
              kind: 'crypto',
              network: document.getElementById('crypto-network').value,
              address: document.getElementById('crypto-address').value,
            },
          });
          accountsCache = [data.account, ...accountsCache];
          toast('Address bound');
          history.replaceState({}, '', 'wallet.html?tab=bind');
          renderWallet();
        } catch (error) {
          err.hidden = false;
          err.textContent = error.message;
        }
      });
    }
    const bank = document.getElementById('bank-form');
    if (bank) {
      bank.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('bank-error');
        err.hidden = true;
        try {
          const data = await memberApi('/api/wallet/accounts', {
            method: 'POST',
            body: {
              kind: 'bank',
              holder: document.getElementById('bank-holder').value,
              bankName: document.getElementById('bank-name').value,
              iban: document.getElementById('bank-iban').value,
              accountNumber: document.getElementById('bank-number').value,
            },
          });
          accountsCache = [data.account, ...accountsCache];
          toast('Account bound');
          history.replaceState({}, '', 'wallet.html?tab=bind');
          renderWallet();
        } catch (error) {
          err.hidden = false;
          err.textContent = error.message;
        }
      });
    }
  }

  function openCashIn() {
    const address = platform.demoCashInUSDTAddress;
    openModal(`
      <p class="smallcaps">Wallet</p>
      <h3>Cash in</h3>
      <dl class="stack-stats">
        ${row('Network', 'USDT TRC20')}
        ${row('Address', address)}
      </dl>
      <div class="hero-ctas">
        <button class="btn light" type="button" data-action="copy-address">Copy address</button>
      </div>
      <form class="fields" id="cashin-form">
        <div class="field">
          <label for="cashin-amount">Amount (AED)</label>
          <input id="cashin-amount" type="number" min="1" step="1" inputmode="numeric" placeholder="1000">
        </div>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Cancel</button>
          <button class="btn primary" type="submit">Add balance</button>
        </div>
      </form>`);
    document.getElementById('cashin-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await memberApi('/api/wallet/cash-in', {
          method: 'POST',
          body: { amount: document.getElementById('cashin-amount').value },
        });
        if (data.user) Store.applySession(data.user);
        if (data.transaction) txCache = [data.transaction, ...txCache];
        closeModal();
        toast('Balance updated');
        renderWallet();
      } catch (err) {
        toast(err.message);
      }
    });
  }

  function openCashOut() {
    const all = accountsCache;
    openModal(`
      <h3>Cash out</h3>
      <p class="muted">Minimum ${Store.money(platform.minCashOutAmount)}.</p>
      <form class="fields" id="cashout-form">
        <div class="field">
          <span class="field-label" id="cashout-kind-label">Send to</span>
          <div class="choice-grid" role="group" aria-labelledby="cashout-kind-label">
            <button class="choice" type="button" data-kind="crypto">${navIcon('wallet')}<span>Crypto</span></button>
            <button class="choice" type="button" data-kind="bank">${navIcon('card')}<span>Bank account</span></button>
          </div>
        </div>
        <p class="bind-alert" id="bind-alert" role="status" hidden></p>
        <div class="field" id="account-field" hidden>
          <label for="cashout-account">Bound account</label>
          <select id="cashout-account"></select>
        </div>
        <div class="field">
          <label for="cashout-amount">Amount (AED)</label>
          <input id="cashout-amount" type="number" min="1" step="1" inputmode="numeric" placeholder="500">
        </div>
        <div class="field">
          <label for="cashout-security">Security password</label>
          <input id="cashout-security" type="password" autocomplete="off">
        </div>
        <div class="field">
          <label for="cashout-password">Withdrawal password</label>
          <input id="cashout-password" type="password" autocomplete="off">
        </div>
        <p class="field-error" id="cashout-error" role="alert" hidden></p>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Cancel</button>
          <button class="btn primary" type="submit">Request cash out</button>
        </div>
      </form>`);
    let kind = '';
    const kindButtons = document.querySelectorAll('#cashout-form .choice');
    const select = document.getElementById('cashout-account');
    const field = document.getElementById('account-field');
    const alert = document.getElementById('bind-alert');
    kindButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        kind = btn.dataset.kind;
        kindButtons.forEach((item) => {
          const on = item === btn;
          item.classList.toggle('active', on);
          item.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        const matches = all.filter((account) => account.kind === kind);
        if (!matches.length) {
          field.hidden = true;
          select.innerHTML = '';
          alert.hidden = false;
          alert.innerHTML = kind === 'bank'
            ? 'No bank account is bound. <a href="wallet.html?tab=bind&bind=bank">Bind a bank account</a> first.'
            : 'No crypto account is bound. <a href="wallet.html?tab=bind&bind=crypto">Bind a crypto account</a> first.';
          return;
        }
        alert.hidden = true;
        alert.textContent = '';
        field.hidden = false;
        select.innerHTML = matches.map((account) => (
          `<option value="${esc(account.id)}">${esc(accountTitle(account))} · ${esc(accountDetail(account))}</option>`
        )).join('');
      });
    });
    document.getElementById('cashout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('cashout-error');
      err.hidden = true;
      if (!kind || !select.value) {
        err.hidden = false;
        err.textContent = kind
          ? 'Bind an account of this type first.'
          : 'Choose crypto or a bank account.';
        return;
      }
      try {
        const data = await memberApi('/api/cashouts', {
          method: 'POST',
          body: {
            amount: document.getElementById('cashout-amount').value,
            accountId: select.value,
            securityPassword: document.getElementById('cashout-security').value,
            withdrawalPassword: document.getElementById('cashout-password').value,
          },
        });
        if (data.user) Store.applySession(data.user);
        if (data.transaction) txCache = [data.transaction, ...txCache];
        closeModal();
        toast('Cash out request submitted');
        renderWallet();
      } catch (error) {
        err.hidden = false;
        err.textContent = error.message;
      }
    });
  }

  function shown(value) {
    const text = String(value || '').trim();
    return text || 'Not available';
  }

  function when(value) {
    if (!value) return 'Not available';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not available';
    return date.toLocaleString();
  }

  function sessionPanel(rows) {
    if (!rows.length) {
      return emptyState('devices', 'No sessions yet', 'Sign-ins from this account will show here.');
    }
    return `<div class="session-list">${rows.map((row) => `
      <article class="session-card">
        <div class="session-top">
          <b>${esc(shown(row.browser))} · ${esc(shown(row.os))}</b>
          ${row.current ? '<span class="status status-ok">This device</span>' : badge(row.status)}
        </div>
        <dl>
          <div><dt>Device</dt><dd>${esc(shown(row.device))}</dd></div>
          <div><dt>Location</dt><dd>${esc(shown(row.location))}</dd></div>
          <div><dt>IP address</dt><dd>${esc(shown(row.ip))}</dd></div>
          <div><dt>Signed in</dt><dd>${esc(when(row.loginAt))}</dd></div>
          <div><dt>Last activity</dt><dd>${esc(when(row.lastActiveAt))}</dd></div>
          <div><dt>How</dt><dd>${esc(shown(row.method))}</dd></div>
        </dl>
        <p class="muted session-agent">${esc(shown(row.userAgent))}</p>
        ${row.status === 'active' && !row.current ? `<button class="btn light session-revoke" type="button" data-action="revoke-session" data-id="${esc(row.id)}">Revoke session</button>` : ''}
      </article>`).join('')}</div>`;
  }

  function renderProfile() {
    const u = Store.user();
    const refs = referralsCache;
    const link = `${location.origin}${location.pathname.replace('profile.html', 'signup.html')}?ref=${u.referralCode}`;
    const today = Store.dayKey(0);
    const month = Store.dayKey(29);
    const support = `https://t.me/${platform.supportTelegramUsername}`;
    const requested = new URLSearchParams(location.search).get('panel');
    const panel = ['password', 'support', 'referral', 'sessions'].includes(requested) ? requested : 'password';
    pageEl().innerHTML = `
      <div class="page-head">
        <h2 class="serif">Profile</h2>
        <button class="btn light" type="button" data-action="logout">Log out</button>
      </div>
      <div class="profile-split">
        <section class="card box">
          <div class="boxhead"><h3>${esc(u.fullName)}</h3>${badge(u.accountStatus)}</div>
          <p class="muted">User ${esc(u.id)} · Joined ${esc(u.createdAt.slice(0, 10))}</p>
          <form id="profile-form" class="fields">
            <div class="field"><label for="pf-name">Full name</label><input id="pf-name" value="${esc(u.fullName)}" autocomplete="name"></div>
            <div class="field"><label for="pf-mobile">Mobile</label><input id="pf-mobile" value="${esc(u.mobile)}" autocomplete="tel" inputmode="tel"></div>
            <button class="btn primary" type="submit">Save profile</button>
          </form>
        </section>
        <section class="card box profile-tabs">
          <div class="tabbar" role="tablist" aria-label="Profile">
            <button class="seg-btn${panel === 'password' ? ' active' : ''}" type="button" role="tab" aria-selected="${panel === 'password'}" data-action="profile-panel" data-panel="password">${navIcon('lock')}<span>Login password</span></button>
            <button class="seg-btn${panel === 'support' ? ' active' : ''}" type="button" role="tab" aria-selected="${panel === 'support'}" data-action="profile-panel" data-panel="support">${navIcon('support')}<span>Support</span></button>
            <button class="seg-btn${panel === 'referral' ? ' active' : ''}" type="button" role="tab" aria-selected="${panel === 'referral'}" data-action="profile-panel" data-panel="referral">${navIcon('share')}<span>Referral</span></button>
            <button class="seg-btn${panel === 'sessions' ? ' active' : ''}" type="button" role="tab" aria-selected="${panel === 'sessions'}" data-action="profile-panel" data-panel="sessions">${navIcon('devices')}<span>Sessions</span></button>
          </div>
          ${panel === 'password' ? `
            <form id="pw-form" class="fields">
              <div class="field"><label for="pw-current">Current password</label><input id="pw-current" type="password" autocomplete="current-password"></div>
              <div class="field"><label for="pw-next">New password</label><input id="pw-next" type="password" autocomplete="new-password" minlength="6"></div>
              <div class="field"><label for="pw-confirm">Confirm new password</label><input id="pw-confirm" type="password" autocomplete="new-password"></div>
              <p class="field-error" id="pw-error" role="alert" hidden></p>
              <button class="btn primary" type="submit">Update password</button>
            </form>` : ''}
          ${panel === 'support' ? `
            <div>
              <h3>Customer support</h3>
              <p class="muted">Message the Emirates Properties team on Telegram.</p>
              <a class="btn primary" href="${support}" target="_blank" rel="noopener">Open Telegram</a>
            </div>` : ''}
          ${panel === 'referral' ? `
            <div id="referral">
              <dl class="stack-stats">
                ${row('Your code', u.referralCode)}
                ${row('Total', String(refs.length))}
                ${row('Today', String(refs.filter((r) => r.date === today).length))}
                ${row('This month', String(refs.filter((r) => r.date >= month).length))}
              </dl>
              <div class="hero-ctas">
                <button class="btn light" type="button" data-action="copy" data-value="${esc(u.referralCode)}">Copy code</button>
                <button class="btn light" type="button" data-action="copy" data-value="${esc(link)}">Copy link</button>
              </div>
              <div class="tablewrap" style="margin-top:14px">
                <table class="data-table">
                  <thead><tr><th>User</th><th>Mobile</th><th>Joined</th><th>Status</th></tr></thead>
                  <tbody>
                    ${refs.length ? refs.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.mobile)}</td><td>${esc(r.date)}</td><td>${badge(r.status)}</td></tr>`).join('') : `<tr><td colspan="4">${emptyState('share', 'No referrals yet', 'Share your code. Users who join with it show up here.')}</td></tr>`}
                  </tbody>
                </table>
              </div>
            </div>` : ''}
          ${panel === 'sessions' ? sessionPanel(sessionsCache) : ''}
        </section>
      </div>`;
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await memberApi('/api/users/me', {
          method: 'PATCH',
          body: {
            fullName: document.getElementById('pf-name').value.trim(),
            mobile: document.getElementById('pf-mobile').value.trim(),
          },
        });
        Store.applySession(data.user);
        const saved = Store.user();
        const initial = (saved.fullName || 'A').trim().charAt(0).toUpperCase();
        document.querySelectorAll('.side-user-meta b').forEach((el) => { el.textContent = saved.fullName; });
        document.querySelectorAll('.side-user .avatar, .dashbar-right .avatar').forEach((el) => { el.textContent = initial; });
        toast('Profile saved');
        renderProfile();
      } catch (err) {
        toast(err.message);
      }
    });
    const pw = document.getElementById('pw-form');
    if (pw) {
      pw.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('pw-error');
        err.hidden = true;
        const next = document.getElementById('pw-next').value;
        const confirm = document.getElementById('pw-confirm').value;
        if (next !== confirm) {
          err.hidden = false;
          err.textContent = 'Passwords do not match.';
          return;
        }
        try {
          await memberApi('/api/auth/password', {
            method: 'POST',
            body: {
              currentPassword: document.getElementById('pw-current').value,
              newPassword: next,
            },
          });
          e.target.reset();
          toast('Password updated');
        } catch (error) {
          err.hidden = false;
          err.textContent = error.message;
        }
      });
    }
  }

  function openWithdrawPassword() {
    const user = Store.user();
    openModal(`
      <h3>Cash out passwords</h3>
      <p class="muted">Cash out asks for both of these passwords.</p>
      <form id="wp-form" class="fields">
        <p class="password-kind">Security password</p>
        ${user.hasSecurityPassword ? '<div class="field"><label for="wp-security-current">Current security password</label><input id="wp-security-current" type="password" autocomplete="off"></div>' : ''}
        <div class="field"><label for="wp-security">New security password</label><input id="wp-security" type="password" autocomplete="new-password" minlength="6"></div>
        <div class="field"><label for="wp-security-confirm">Confirm security password</label><input id="wp-security-confirm" type="password" autocomplete="new-password"></div>
        <p class="password-kind">Withdrawal password</p>
        ${user.hasWithdrawalPassword ? '<div class="field"><label for="wp-current">Current withdrawal password</label><input id="wp-current" type="password" autocomplete="off"></div>' : ''}
        <div class="field"><label for="wp-next">New withdrawal password</label><input id="wp-next" type="password" autocomplete="new-password" minlength="6"></div>
        <div class="field"><label for="wp-confirm">Confirm withdrawal password</label><input id="wp-confirm" type="password" autocomplete="new-password"></div>
        <p class="field-error" id="wp-error" role="alert" hidden></p>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Cancel</button>
          <button class="btn primary" type="submit" id="wp-save">Save</button>
        </div>
      </form>`);
    document.getElementById('wp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('wp-error');
      const save = document.getElementById('wp-save');
      err.hidden = true;
      const security = document.getElementById('wp-security').value;
      const securityConfirm = document.getElementById('wp-security-confirm').value;
      const withdrawal = document.getElementById('wp-next').value;
      const withdrawalConfirm = document.getElementById('wp-confirm').value;
      if (security !== securityConfirm) {
        err.hidden = false;
        err.textContent = 'Security passwords do not match.';
        return;
      }
      if (withdrawal !== withdrawalConfirm) {
        err.hidden = false;
        err.textContent = 'Withdrawal passwords do not match.';
        return;
      }
      save.disabled = true;
      save.textContent = 'Saving…';
      try {
        const data = await memberApi('/api/auth/withdrawal-password', {
          method: 'POST',
          body: {
            currentSecurityPassword: document.getElementById('wp-security-current')?.value || '',
            securityPassword: security,
            currentWithdrawalPassword: document.getElementById('wp-current')?.value || '',
            withdrawalPassword: withdrawal,
          },
        });
        if (data.user) Store.applySession(data.user);
        closeModal();
        toast('Cash out passwords saved');
      } catch (error) {
        err.hidden = false;
        err.textContent = error.message;
        save.disabled = false;
        save.textContent = 'Save';
      }
    });
  }

  async function refreshMember() {
    try {
      const data = await memberApi('/api/auth/me');
      if (data.user) Store.applySession(data.user);
    } catch {
      /* keep the last signed-in snapshot until the next successful load */
    }
  }

  async function render() {
    const page = document.body.dataset.page;
    loadError = '';
    await refreshMember();
    if (page === 'projects') {
      const groupId = new URLSearchParams(location.search).get('group') || '';
      try {
        groupsCache = (await memberApi('/api/groups')).groups || [];
        catalog = groupId
          ? ((await memberApi(`/api/projects?groupId=${encodeURIComponent(groupId)}`)).projects || [])
          : [];
      } catch (err) {
        groupsCache = [];
        catalog = [];
        loadError = err.message;
      }
    }
    if (page === 'projects' || page === 'project') {
      try {
        ordersCache = (await memberApi('/api/orders')).orders || [];
      } catch {
        ordersCache = [];
      }
    }
    if (page === 'project') {
      const id = new URLSearchParams(location.search).get('id') || '';
      try {
        catalog = [(await memberApi(`/api/projects/${encodeURIComponent(id)}`)).project];
      } catch {
        catalog = [];
      }
    }
    if (page === 'dashboard' || page === 'orders' || page === 'earnings' || page === 'wallet' || page === 'profile') {
      try {
        platform = (await memberApi('/api/settings')).settings || platform;
      } catch {
        /* keep the last known platform settings */
      }
    }
    if (page === 'dashboard' || page === 'orders' || page === 'earnings' || page === 'wallet') {
      try {
        const [ordersRes, commissionsRes, txRes] = await Promise.all([
          memberApi('/api/orders'),
          memberApi('/api/commissions'),
          memberApi('/api/wallet/transactions'),
        ]);
        ordersCache = ordersRes.orders || [];
        commissionsCache = commissionsRes.commissions || [];
        txCache = txRes.transactions || [];
        if (page === 'wallet') {
          accountsCache = (await memberApi('/api/wallet/accounts')).accounts || [];
        }
      } catch (err) {
        ordersCache = [];
        commissionsCache = [];
        txCache = [];
        loadError = err.message;
      }
    }
    if (page === 'profile') {
      try {
        const [referralRes, sessionRes] = await Promise.all([
          memberApi('/api/referrals'),
          memberApi('/api/auth/sessions'),
        ]);
        referralsCache = referralRes.referrals || [];
        sessionsCache = sessionRes.sessions || [];
      } catch (err) {
        referralsCache = [];
        sessionsCache = [];
        loadError = err.message;
      }
    }
    const map = {
      dashboard: renderDashboard,
      projects: renderProjects,
      project: renderProject,
      orders: renderOrders,
      earnings: renderEarnings,
      wallet: renderWallet,
      profile: renderProfile,
    };
    (map[page] || renderDashboard)();
    maybePendingNotice();
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || document.body.dataset.app !== 'member') return;
    const action = el.dataset.action;
    if (action === 'open-activate') openActivate(el.dataset.id);
    if (action === 'open-cash-in') openCashIn();
    if (action === 'open-cash-out') openCashOut();
    if (action === 'confirm-activate') {
      memberApi('/api/orders', { method: 'POST', body: { projectId: el.dataset.id } })
        .then((data) => {
          if (data.user) Store.applySession(data.user);
          closeModal();
          toast('Order submitted');
          window.location.href = `orders.html?id=${data.order.id}`;
        })
        .catch((err) => toast(err.message));
    }
    if (action === 'copy-address') copyText(platform.demoCashInUSDTAddress);
    if (action === 'copy') copyText(el.dataset.value);
    if (action === 'logout') {
      localStorage.removeItem('ps_token');
      localStorage.removeItem('ps_member');
      sessionStorage.removeItem('ps_token');
      sessionStorage.removeItem('ps_member');
      window.location.href = 'login.html';
    }
    if (action === 'revoke-session') {
      memberApi(`/api/auth/sessions/${encodeURIComponent(el.dataset.id)}`, { method: 'DELETE' })
        .then((data) => {
          sessionsCache = sessionsCache.map((row) => (row.id === data.session.id ? data.session : row));
          toast('Session revoked');
          renderProfile();
        })
        .catch((err) => toast(err.message));
    }
    if (action === 'profile-panel') {
      const next = new URLSearchParams(location.search);
      next.set('panel', el.dataset.panel);
      history.pushState({}, '', `profile.html?${next.toString()}`);
      renderProfile();
    }
    if (action === 'withdraw-password') openWithdrawPassword();
    if (action === 'bind-address') {
      history.pushState({}, '', 'wallet.html?tab=bind&bind=choose');
      renderWallet();
    }
    if (action === 'bind-kind') {
      const kind = el.dataset.kind === 'bank' ? 'bank' : 'crypto';
      history.pushState({}, '', `wallet.html?tab=bind&bind=${kind}`);
      renderWallet();
    }
    if (action === 'bind-cancel') {
      history.pushState({}, '', 'wallet.html?tab=bind');
      renderWallet();
    }
    if (action === 'unbind') {
      memberApi(`/api/wallet/accounts/${encodeURIComponent(el.dataset.id)}`, { method: 'DELETE' })
        .then(() => {
          accountsCache = accountsCache.filter((account) => account.id !== el.dataset.id);
          toast('Address removed');
          renderWallet();
        })
        .catch((err) => toast(err.message));
    }
  });

  return { render };
})();

if (document.body.dataset.app === 'member') Member.render();
