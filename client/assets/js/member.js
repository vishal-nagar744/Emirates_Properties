/* ============================================================
   Member workspace pages (UI demo)
   ============================================================ */

const Member = (() => {
  function pageEl() {
    return document.getElementById('page');
  }

  function frozenNote() {
    const status = Store.user().accountStatus;
    if (status === 'active') return '';
    const text = status === 'frozen'
      ? 'Your account is currently frozen. Please contact support. Project activation and cash out are paused.'
      : 'Account suspended. Contact support.';
    return `<div class="notice">${text}</div>`;
  }

  function greeting() {
    const hour = new Date().getHours();
    const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const first = (Store.user().fullName || 'there').split(' ')[0];
    return `${hello}, ${first}`;
  }

  function renderDashboard() {
    const s = Store.stats();
    const active = Store.orders().filter((o) => o.status === 'active');
    const recent = Store.transactions().slice(0, 5);
    pageEl().innerHTML = `
      ${frozenNote()}
      <section class="welcome-banner">
        <h1 class="serif">${greeting()}.</h1>
        <div class="hero-ctas">
          <a class="btn primary" href="projects.html">Explore projects</a>
          <a class="btn light" href="wallet.html">View wallet</a>
        </div>
      </section>
      <div class="kpis">
        ${kpi('Wallet balance', Store.money(s.walletBalance), 'Available')}
        ${kpi("Today's commission", Store.money(s.todayCommission), 'Credited today')}
        ${kpi('Total commission', Store.money(s.totalCommission), 'All completed credits')}
        ${kpi('Active projects', String(s.activeProjects), 'Orders currently running')}
      </div>
      <div class="twocol">
        <section class="card box">
          <div class="boxhead"><h3>Active projects</h3><a class="auth-link" href="orders.html">All orders</a></div>
          ${active.length ? active.map(activeCard).join('') : '<p class="muted">No active projects yet. Choose one from the catalog.</p>'}
        </section>
        <section class="card box">
          <div class="boxhead"><h3>Recent activity</h3></div>
          <div class="tablewrap">
            <table class="data-table">
              <thead><tr><th>Activity</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                ${recent.map((t) => `<tr><td>${t.description}<div class="muted">${t.createdAt.slice(0, 10)}</div></td><td>${t.direction === 'debit' ? '−' : '+'}${Store.money(t.amount)}</td><td>${badge(t.status)}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </section>
      </div>`;
  }

  function typeLabel(type) {
    const labels = {
      welcome_bonus: 'Welcome bonus',
      demo_cash_in: 'Cash in',
      project_activation: 'Activation',
      daily_commission: 'Commission',
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
    const pct = Math.round((order.daysCompleted / order.durationDays) * 100);
    return `
      <a class="active-card" href="orders.html?id=${esc(order.id)}">
        <div class="active-card-top">
          <img src="${esc(order.image)}" alt="" width="64" height="64">
          <div>
            <h3>${esc(order.projectName)}</h3>
            <p class="muted">Day ${order.daysCompleted} / ${order.durationDays} · Next ${esc(Store.nextCommissionLabel(order))}</p>
          </div>
          <span class="active-go">View order</span>
        </div>
        <div class="progress-bar" aria-label="${pct}% complete"><span style="width:${pct}%"></span></div>
        <dl class="prop-stats">
          <div><dt>Activated</dt><dd>${Store.money(order.activationAmount)}</dd></div>
          <div><dt>Daily</dt><dd>${Store.money(order.dailyCommission)}</dd></div>
          <div><dt>Earned</dt><dd>${Store.money(order.earnedCommission)}</dd></div>
          <div><dt>Left</dt><dd>${Store.money(order.remainingCommission)}</dd></div>
        </dl>
      </a>`;
  }

  function renderProjects() {
    const list = Store.projects().filter((p) => p.status === 'active');
    pageEl().innerHTML = `
      <div class="page-head">
        <div>
          <h2 class="serif">Projects</h2>
        </div>
      </div>
      <div class="catalog-bar">
        <label class="search-bar page-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16.5 20 20.5"/></svg>
          <input id="project-search" type="search" placeholder="Search projects" aria-label="Search projects">
        </label>
        <div class="catalog-filters" id="project-filters" role="group" aria-label="Filter projects">
          <button class="chip active" type="button" data-filter="all" aria-pressed="true">All</button>
          <button class="chip" type="button" data-filter="budget" aria-pressed="false">Up to AED 2,000</button>
          <button class="chip" type="button" data-filter="long" aria-pressed="false">60+ days</button>
        </div>
      </div>
      <div class="grid-4" id="project-grid">
        ${list.map(projectCard).join('')}
      </div>
      <p class="empty-filter" id="projects-empty" hidden>No projects match.</p>`;
    initCatalog('project-search', 'project-grid', 'project-filters');
  }

  function projectCard(p) {
    const status = p.status === 'active' ? 'Available' : 'Closed';
    return `
      <a class="card property-card" href="project-details.html?id=${esc(p.id)}" data-name="${esc(p.name)}" data-amount="${p.activationAmount}" data-days="${p.durationDays}">
        <div class="property-img">
          <img src="${esc(p.image)}" alt="" loading="lazy">
          <span class="prop-tag">${esc(p.tag || 'Project')}</span>
        </div>
        <div class="prop-body">
          <div class="prop-meta"><span>${p.durationDays} days</span><span class="prop-status">${status}</span></div>
          <h3>${esc(p.name)}</h3>
          <p class="prop-line">${esc(p.address || 'Dubai')}</p>
          <p class="prop-line">${esc(p.developer || 'Developer')}</p>
          <dl class="prop-stats">
            <div><dt>Activate</dt><dd>${Store.money(p.activationAmount)}</dd></div>
            <div><dt>Daily</dt><dd>${Store.money(p.dailyCommission)}</dd></div>
            <div><dt>Total</dt><dd>${Store.money(p.totalCommission)}</dd></div>
          </dl>
        </div>
      </a>`;
  }

  function renderProject() {
    const id = new URLSearchParams(location.search).get('id') || 'premium';
    const p = Store.projectById(id);
    if (!p) {
      pageEl().innerHTML = `<p>Project not found. <a class="auth-link" href="projects.html">Back to projects</a></p>`;
      return;
    }
    const balance = Store.user().walletBalance;
    pageEl().innerHTML = `
      ${frozenNote()}
      <div class="detail-grid">
        <div>
          <div class="detail-img"><img src="${esc(p.image)}" alt="${esc(p.name)}"></div>
          <section class="card box detail-copy">
            <div class="boxhead">
              <h2 class="serif">${esc(p.name)}</h2>
              ${badge(p.status === 'active' ? 'available' : 'inactive')}
            </div>
            <p class="prop-line">${esc(p.address || 'Dubai')}</p>
            <p class="prop-line">${esc(p.developer || 'Developer')}</p>
            <p class="lead">${esc(p.description)}</p>
          </section>
        </div>
        <aside class="card box">
          <div class="boxhead"><h3>Project terms</h3><span class="prop-status">${p.status === 'active' ? 'Available' : 'Closed'}</span></div>
          <dl class="stack-stats">
            ${row('Address', p.address || 'Dubai')}
            ${row('Developer', p.developer || '—')}
            ${row('Activation amount', Store.money(p.activationAmount))}
            ${row('Daily commission', Store.money(p.dailyCommission))}
            ${row('Duration', `${p.durationDays} days`)}
            ${row('Total commission', Store.money(p.totalCommission))}
            ${row('Your balance', Store.money(balance))}
          </dl>
          <button class="btn primary btn-full" type="button" data-action="open-activate" data-id="${p.id}">Continue with project</button>
          <a class="btn light btn-full" style="margin-top:8px" href="wallet.html?modal=cash-in">Add funds</a>
        </aside>
      </div>`;
    const crumb = document.getElementById('crumb-here');
    if (crumb) {
      crumb.innerHTML = `<a href="projects.html">Projects</a><span class="crumb-sep" aria-hidden="true">/</span><span>${p.name}</span>`;
    }
  }

  function row(label, value) {
    return `<div class="stack-row"><span>${label}</span><b>${value}</b></div>`;
  }

  function openActivate(projectId) {
    const p = Store.projectById(projectId);
    const balance = Store.user().walletBalance;
    if (!p) return;
    if (balance < p.activationAmount) {
      openModal(`
        <h3>Insufficient balance</h3>
        <p class="lead">You need ${Store.money(p.activationAmount)} to activate ${p.name}. Available: ${Store.money(balance)}.</p>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Cancel</button>
          <a class="btn primary" href="wallet.html?modal=cash-in">Cash in</a>
        </div>`);
      return;
    }
    openModal(`
      <p class="smallcaps">Confirm</p>
      <h3>Activate ${p.name}</h3>
      <dl class="stack-stats">
        ${row('Activation amount', Store.money(p.activationAmount))}
        ${row('Daily commission', Store.money(p.dailyCommission))}
        ${row('Duration', `${p.durationDays} days`)}
        ${row('Total commission', Store.money(p.totalCommission))}
        ${row('Available balance', Store.money(balance))}
        ${row('Balance after', Store.money(balance - p.activationAmount))}
      </dl>
      <div class="modal-actions">
        <button class="btn light" type="button" data-dismiss>Cancel</button>
        <button class="btn primary" type="button" data-action="confirm-activate" data-id="${p.id}">Confirm activation</button>
      </div>`);
  }

  function renderOrders() {
    const params = new URLSearchParams(location.search);
    const filter = params.get('status') || 'all';
    const tab = params.get('tab') === 'commission' ? 'commission' : 'orders';
    const selectedId = params.get('id') || '';
    let list = Store.orders();
    if (filter === 'active') list = list.filter((o) => o.status === 'active');
    if (filter === 'completed') list = list.filter((o) => o.status === 'completed');
    const ids = new Set(list.map((o) => o.id));
    const selected = selectedId ? Store.orderById(selectedId) : null;
    const commissions = Store.allCommissions().filter((c) => ids.has(c.orderId));
    const backIcon = '<svg class="back-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg>';
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
      ${selected ? orderDetail(selected, filter) : `
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
              <thead><tr><th>Date</th><th>Project</th><th>Day</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                ${commissions.map((c) => `<tr class="order-row" tabindex="0" data-href="orders.html?status=${filter}&id=${esc(c.orderId)}"><td>${c.date}</td><td>${esc(c.projectName)}</td><td>Day ${c.dayIndex}</td><td>+${Store.money(c.amount)}</td><td>${badge(c.status)}</td></tr>`).join('') || '<tr><td colspan="5">No commission in this view.</td></tr>'}
              </tbody>
            </table>` : `
            <table class="data-table">
              <thead><tr><th>Order</th><th>Project</th><th>Activated</th><th>Daily</th><th>Progress</th><th>Earned</th><th>Left</th><th>Status</th></tr></thead>
              <tbody>
                ${list.map((o) => `<tr class="order-row" tabindex="0" data-href="orders.html?status=${filter}&id=${esc(o.id)}">
                  <td>${esc(o.id)}<div class="muted">${o.createdAt.slice(0, 10)}</div></td>
                  <td>${esc(o.projectName)}</td>
                  <td>${Store.money(o.activationAmount)}</td>
                  <td>${Store.money(o.dailyCommission)}</td>
                  <td>Day ${o.daysCompleted} / ${o.durationDays}</td>
                  <td>${Store.money(o.earnedCommission)}</td>
                  <td>${Store.money(o.remainingCommission)}</td>
                  <td>${badge(o.status)}</td>
                </tr>`).join('') || '<tr><td colspan="8">No orders in this view.</td></tr>'}
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

  function orderDetail(o, filter) {
    const pct = Math.min(100, Math.round((o.daysCompleted / o.durationDays) * 100));
    const log = Store.commissionsFor(o.id);
    return `
      <section class="card box order-panel" id="order-detail">
        <div class="progress-bar" aria-label="${pct}% complete"><span style="width:${pct}%"></span></div>
        <dl class="fact-grid">
          <div><dt>Start</dt><dd>${o.startDate.slice(0, 10)}</dd></div>
          <div><dt>End</dt><dd>${o.endDate.slice(0, 10)}</dd></div>
          <div><dt>Progress</dt><dd>Day ${o.daysCompleted} / ${o.durationDays}</dd></div>
          <div><dt>Next</dt><dd>${esc(Store.nextCommissionLabel(o))}</dd></div>
          <div><dt>Activated</dt><dd>${Store.money(o.activationAmount)}</dd></div>
          <div><dt>Daily</dt><dd>${Store.money(o.dailyCommission)}</dd></div>
          <div><dt>Earned</dt><dd>${Store.money(o.earnedCommission)}</dd></div>
          <div><dt>Left</dt><dd>${Store.money(o.remainingCommission)}</dd></div>
        </dl>
        <h4 class="order-sub">Commission</h4>
        <div class="tablewrap">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Day</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              ${log.map((c) => `<tr><td>${c.date}</td><td>Day ${c.dayIndex}</td><td>+${Store.money(c.amount)}</td><td>${badge(c.status)}</td></tr>`).join('') || '<tr><td colspan="4">No commission credited yet.</td></tr>'}
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
    const all = Store.allCommissions();
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
        <div class="bar-chart" aria-hidden="true">
          ${bars.map((n) => `<div class="bar" style="height:${Math.max(8, Math.round((n / max) * 100))}%"></div>`).join('') || '<p class="muted">No commission in this range.</p>'}
        </div>
        <div class="tablewrap">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Project</th><th>Order</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              ${list.map((c) => `<tr><td>${c.date}</td><td>${c.projectName}</td><td>${c.orderId}</td><td>+${Store.money(c.amount)}</td><td>${badge(c.status)}</td></tr>`).join('') || '<tr><td colspan="5">Nothing in this range.</td></tr>'}
            </tbody>
          </table>
        </div>
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
    const s = Store.stats();
    const params = new URLSearchParams(location.search);
    const filter = params.get('type') || 'all';
    const tab = params.get('tab') === 'bind' ? 'bind' : 'tx';
    const modal = params.get('modal');
    pageEl().innerHTML = `
      ${frozenNote()}
      <div class="page-head">
        <h2 class="serif">Wallet</h2>
        <button class="btn light" type="button" data-action="withdraw-password">Withdrawal password</button>
      </div>
      <section class="card wallet-card">
        <div class="wallet-main">
          <div>
            <div class="smallcaps" style="color:#dcc99b">Available</div>
            <div class="wallet-balance">${Store.money(s.walletBalance)}</div>
          </div>
          <div class="wallet-actions">
            <button class="btn on-dark" type="button" data-action="open-cash-in">Cash in</button>
            <button class="btn on-dark-line" type="button" data-action="open-cash-out">Cash out</button>
          </div>
        </div>
        <div class="wallet-footer">
          <span>Pending cash out<br><b>${Store.money(s.pendingCashOut)}</b></span>
          <span>Total commission<br><b>${Store.money(s.totalCommission)}</b></span>
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
      ['daily_commission', 'Commission'],
      ['cash_out', 'Cash out'],
      ['refund', 'Refund'],
      ['adjustment', 'Adjustment'],
    ];
    let txs = Store.transactions();
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
              ${txs.map((t) => `<tr>
                <td class="mono">${t.id}</td>
                <td>${typeLabel(t.type)}</td>
                <td>${t.description}</td>
                <td>${t.direction === 'debit' ? '−' : '+'}${Store.money(t.amount)}</td>
                <td>${badge(t.status)}</td>
                <td>${t.createdAt.slice(0, 16).replace('T', ' ')}</td>
              </tr>`).join('') || '<tr><td colspan="6">No transactions.</td></tr>'}
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
    const list = Store.accounts();
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
        </ul>` : '<p class="muted">No address bound yet. Add a crypto wallet or a bank account.</p>'}
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
      crypto.addEventListener('submit', (e) => {
        e.preventDefault();
        const result = Store.addAccount({
          kind: 'crypto',
          network: document.getElementById('crypto-network').value,
          address: document.getElementById('crypto-address').value,
        });
        const err = document.getElementById('crypto-error');
        if (!result.ok) {
          err.hidden = false;
          err.textContent = result.error;
          return;
        }
        toast('Address bound');
        history.replaceState({}, '', 'wallet.html?tab=bind');
        renderWallet();
      });
    }
    const bank = document.getElementById('bank-form');
    if (bank) {
      bank.addEventListener('submit', (e) => {
        e.preventDefault();
        const result = Store.addAccount({
          kind: 'bank',
          holder: document.getElementById('bank-holder').value,
          bankName: document.getElementById('bank-name').value,
          iban: document.getElementById('bank-iban').value,
          accountNumber: document.getElementById('bank-number').value,
        });
        const err = document.getElementById('bank-error');
        if (!result.ok) {
          err.hidden = false;
          err.textContent = result.error;
          return;
        }
        toast('Account bound');
        history.replaceState({}, '', 'wallet.html?tab=bind');
        renderWallet();
      });
    }
  }

  function openCashIn() {
    const address = Store.settings().demoCashInUSDTAddress;
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
    document.getElementById('cashin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const result = Store.cashIn(document.getElementById('cashin-amount').value);
      if (!result.ok) { toast(result.error); return; }
      closeModal();
      toast('Balance updated');
      renderWallet();
    });
  }

  function openCashOut() {
    const all = Store.accounts();
    openModal(`
      <p class="smallcaps">Wallet</p>
      <h3>Cash out</h3>
      <p class="muted">Minimum ${Store.money(Store.settings().minCashOutAmount)}.</p>
      <form class="fields" id="cashout-form">
        <div class="field">
          <span class="field-label" id="cashout-kind-label">Send to</span>
          <div class="choice-grid" role="group" aria-labelledby="cashout-kind-label">
            <button class="choice" type="button" data-kind="crypto">${navIcon('wallet')}<span>Crypto</span></button>
            <button class="choice" type="button" data-kind="bank">${navIcon('card')}<span>Bank account</span></button>
          </div>
        </div>
        <div class="field" id="account-field" hidden>
          <label for="cashout-account">Bound account</label>
          <select id="cashout-account"></select>
        </div>
        <p class="field-hint" id="dest-preview"></p>
        <div class="field">
          <label for="cashout-amount">Amount (AED)</label>
          <input id="cashout-amount" type="number" min="1" step="1" inputmode="numeric" placeholder="500">
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
    const hint = document.getElementById('dest-preview');
    kindButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        kind = btn.dataset.kind;
        kindButtons.forEach((item) => {
          const on = item === btn;
          item.classList.toggle('active', on);
          item.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        const matches = all.filter((account) => account.kind === kind);
        field.hidden = false;
        if (!matches.length) {
          select.innerHTML = '';
          hint.textContent = kind === 'bank'
            ? 'Bind a bank account on the Bind wallet tab first.'
            : 'Bind a crypto address on the Bind wallet tab first.';
          return;
        }
        select.innerHTML = matches.map((account) => (
          `<option value="${esc(account.id)}">${esc(accountTitle(account))} · ${esc(accountDetail(account))}</option>`
        )).join('');
        hint.textContent = `${matches.length} bound ${kind === 'bank' ? 'bank account' : 'crypto address'}${matches.length > 1 ? 's' : ''}`;
      });
    });
    document.getElementById('cashout-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const err = document.getElementById('cashout-error');
      if (!kind || !select.value) {
        err.hidden = false;
        err.textContent = kind
          ? 'Bind an account of this type first.'
          : 'Choose crypto or a bank account.';
        return;
      }
      const result = Store.cashOut({
        amount: document.getElementById('cashout-amount').value,
        accountId: select.value,
        password: document.getElementById('cashout-password').value,
      });
      if (!result.ok) {
        err.hidden = false;
        err.textContent = result.error;
        return;
      }
      closeModal();
      toast('Cash out request submitted');
      renderWallet();
    });
  }

  function renderProfile() {
    const u = Store.user();
    const refs = Store.referrals();
    const link = `${location.origin}${location.pathname.replace('profile.html', 'signup.html')}?ref=${u.referralCode}`;
    const today = Store.dayKey(0);
    const month = Store.dayKey(29);
    const support = `https://t.me/${Store.settings().supportTelegramUsername}`;
    const requested = new URLSearchParams(location.search).get('panel');
    const panel = ['password', 'support', 'referral'].includes(requested) ? requested : 'password';
    pageEl().innerHTML = `
      <div class="page-head">
        <h2 class="serif">Profile</h2>
        <button class="btn light" type="button" data-action="logout">Log out</button>
      </div>
      <div class="profile-split">
        <section class="card box">
          <div class="boxhead"><h3>${esc(u.fullName)}</h3>${badge(u.accountStatus)}</div>
          <p class="muted">Member ${esc(u.id)} · Joined ${esc(u.createdAt.slice(0, 10))}</p>
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
                  <thead><tr><th>Member</th><th>Mobile</th><th>Joined</th><th>Status</th></tr></thead>
                  <tbody>
                    ${refs.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.mobile)}</td><td>${esc(r.date)}</td><td>${badge(r.status)}</td></tr>`).join('') || '<tr><td colspan="4">No referrals yet.</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>` : ''}
        </section>
      </div>`;
    document.getElementById('profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const result = Store.updateProfile({
        fullName: document.getElementById('pf-name').value.trim(),
        mobile: document.getElementById('pf-mobile').value.trim(),
      });
      toast(result.ok ? 'Profile saved' : result.error);
      if (result.ok) renderProfile();
    });
    const pw = document.getElementById('pw-form');
    if (pw) {
      pw.addEventListener('submit', (e) => {
        e.preventDefault();
        const err = document.getElementById('pw-error');
        const next = document.getElementById('pw-next').value;
        const confirm = document.getElementById('pw-confirm').value;
        if (next !== confirm) {
          err.hidden = false;
          err.textContent = 'Passwords do not match.';
          return;
        }
        const result = Store.changePassword(document.getElementById('pw-current').value, next);
        if (!result.ok) {
          err.hidden = false;
          err.textContent = result.error;
          return;
        }
        e.target.reset();
        err.hidden = true;
        toast('Password updated');
      });
    }
  }

  function openWithdrawPassword() {
    openModal(`
      <h3>Withdrawal password</h3>
      <form id="wp-form" class="fields">
        <div class="field"><label for="wp-current">Current withdrawal password</label><input id="wp-current" type="password" placeholder="Required if already set"></div>
        <div class="field"><label for="wp-next">New withdrawal password</label><input id="wp-next" type="password"></div>
        <p class="field-error" id="wp-error" hidden></p>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Cancel</button>
          <button class="btn primary" type="submit">Save</button>
        </div>
      </form>`);
    document.getElementById('wp-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const result = Store.setWithdrawalPassword(
        document.getElementById('wp-current').value,
        document.getElementById('wp-next').value
      );
      if (!result.ok) {
        const err = document.getElementById('wp-error');
        err.hidden = false;
        err.textContent = result.error;
        return;
      }
      closeModal();
      toast('Withdrawal password saved');
    });
  }

  function render() {
    const page = document.body.dataset.page;
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
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || document.body.dataset.app !== 'member') return;
    const action = el.dataset.action;
    if (action === 'open-activate') openActivate(el.dataset.id);
    if (action === 'open-cash-in') openCashIn();
    if (action === 'open-cash-out') openCashOut();
    if (action === 'confirm-activate') {
      const result = Store.activate(el.dataset.id);
      if (!result.ok) { toast(result.error); return; }
      closeModal();
      toast('Project activated');
      window.location.href = `orders.html?id=${result.orderId}`;
    }
    if (action === 'copy-address') copyText(Store.settings().demoCashInUSDTAddress);
    if (action === 'copy') copyText(el.dataset.value);
    if (action === 'logout') {
      localStorage.removeItem('ps_token');
      window.location.href = '../index.html';
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
      const result = Store.removeAccount(el.dataset.id);
      toast(result.ok ? 'Address removed' : result.error);
      if (result.ok) renderWallet();
    }
  });

  return { render };
})();

if (document.body.dataset.app === 'member') Member.render();
