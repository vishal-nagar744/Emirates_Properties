/* ============================================================
   Admin workspace (UI demo)
   ============================================================ */

const Admin = (() => {
  function pageEl() {
    return document.getElementById('page');
  }

  function kpi(label, value) {
    return `<div class="card kpi"><small>${label}</small><b>${value}</b></div>`;
  }

  function renderDashboard() {
    const users = Store.users();
    const projects = Store.projects();
    const orders = Store.allOrders();
    const cashouts = Store.cashouts();
    const comm = Store.load().commissions || [];
    const db = Store.load();
    const walletSum = users.reduce((s, u) => s + u.walletBalance, 0);
    const commSum = db.commissions.reduce((s, c) => s + c.amount, 0);
    pageEl().innerHTML = `
      <div class="page-head"><div><h2 class="serif">Overview</h2></div></div>
      <div class="kpis">
        ${kpi('Users', users.length)}
        ${kpi('Active users', users.filter((u) => u.accountStatus === 'active').length)}
        ${kpi('Projects', projects.length)}
        ${kpi('Active projects', projects.filter((p) => p.status === 'active').length)}
      </div>
      <div class="kpis kpis-secondary">
        ${kpi('Orders', orders.length)}
        ${kpi('Active orders', orders.filter((o) => o.status === 'active').length)}
        ${kpi('Wallet balances', Store.money(walletSum))}
        ${kpi('Commission', Store.money(commSum))}
      </div>
      <div class="kpis kpis-secondary">
        ${kpi('Pending cash outs', cashouts.filter((c) => c.status === 'pending').length)}
        ${kpi('Completed cash outs', cashouts.filter((c) => c.status === 'completed').length)}
        ${kpi('Referrals', db.referrals.length)}
        ${kpi('Today’s commissions', db.commissions.filter((c) => c.date === Store.dayKey(0)).length)}
      </div>
      <section class="card box" style="margin-top:16px">
        <div class="boxhead"><h3>Recent orders</h3></div>
        <div class="tablewrap"><table class="data-table">
          <thead><tr><th>Order</th><th>User</th><th>Project</th><th>Activated</th><th>Daily</th><th>Earned</th><th>Status</th></tr></thead>
          <tbody>${orders.map((o) => `<tr><td>${o.id}</td><td>${o.userId}</td><td>${o.projectName}</td><td>${Store.money(o.activationAmount)}</td><td>${Store.money(o.dailyCommission)}</td><td>${Store.money(o.earnedCommission)}</td><td>${badge(o.status)}</td></tr>`).join('')}</tbody>
        </table></div>
      </section>`;
    void comm;
  }

  function renderUsers() {
    const qRaw = document.getElementById('user-q')?.value || '';
    const status = document.getElementById('user-status')?.value || 'all';
    const q = qRaw.toLowerCase();
    let users = Store.users();
    if (status !== 'all') users = users.filter((u) => u.accountStatus === status);
    if (q) users = users.filter((u) => `${u.fullName} ${u.mobile}`.toLowerCase().includes(q));
    const caret = document.activeElement && document.activeElement.id === 'user-q'
      ? document.activeElement.selectionStart
      : null;
    pageEl().innerHTML = `
      <div class="page-head"><div><h2 class="serif">Users</h2></div></div>
      <div class="filters">
        <input id="user-q" type="search" placeholder="Search name or mobile" value="${qRaw.replace(/"/g, '&quot;')}">
        <select id="user-status">
          ${['all', 'active', 'frozen', 'suspended'].map((s) => `<option value="${s}"${s === status ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <section class="card box">
        <div class="tablewrap"><table class="data-table">
          <thead><tr><th>Name</th><th>Mobile</th><th>Code</th><th>Balance</th><th>Pending</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${users.map((u) => `<tr>
              <td>${u.fullName}</td><td>${u.mobile}</td><td>${u.referralCode}</td>
              <td>${Store.money(u.walletBalance)}</td><td>${Store.money(u.pendingCashOut)}</td>
              <td>${badge(u.accountStatus)}</td>
              <td><button class="btn light" type="button" data-action="user" data-id="${u.id}">View</button></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </section>`;
    const input = document.getElementById('user-q');
    input.addEventListener('input', renderUsers);
    document.getElementById('user-status').addEventListener('change', renderUsers);
    if (caret !== null) {
      input.focus();
      input.setSelectionRange(caret, caret);
    }
  }

  function openUser(id) {
    const u = Store.users().find((x) => x.id === id);
    if (!u) return;
    const referred = Store.load().referrals.filter((r) => r.referrerId === id);
    const by = Store.users().find((x) => x.id === u.referredBy);
    const orders = Store.allOrders().filter((o) => o.userId === id);
    openModal(`
      <h3>${u.fullName}</h3>
      <p class="muted">${u.mobile} · ${u.referralCode} · ${badge(u.accountStatus)}</p>
      <dl class="stack-stats">
        <div class="stack-row"><span>Balance</span><b>${Store.money(u.walletBalance)}</b></div>
        <div class="stack-row"><span>Pending cash out</span><b>${Store.money(u.pendingCashOut)}</b></div>
        <div class="stack-row"><span>Referred by</span><b>${by ? by.fullName : '—'}</b></div>
        <div class="stack-row"><span>Referrals</span><b>${referred.length}</b></div>
        <div class="stack-row"><span>Orders</span><b>${orders.length}</b></div>
      </dl>
      <div class="hero-ctas">
        <button class="btn light" type="button" data-action="status" data-id="${u.id}" data-status="active">Unfreeze</button>
        <button class="btn light" type="button" data-action="status" data-id="${u.id}" data-status="frozen">Freeze</button>
        <button class="btn light" type="button" data-action="status" data-id="${u.id}" data-status="suspended">Suspend</button>
      </div>
      <form id="adjust-form" class="fields" style="margin-top:14px">
        <div class="form-2">
          <div class="field"><label for="adj-amount">Adjust amount (+ / −)</label><input id="adj-amount" type="number" step="1"></div>
          <div class="field"><label for="adj-reason">Reason</label><input id="adj-reason" placeholder="Reason"></div>
        </div>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Close</button>
          <button class="btn primary" type="submit">Apply adjustment</button>
        </div>
      </form>`);
    document.getElementById('adjust-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const result = Store.adjustWallet(id, document.getElementById('adj-amount').value, document.getElementById('adj-reason').value.trim());
      if (!result.ok) { toast(result.error); return; }
      closeModal();
      toast('Wallet adjusted');
      renderUsers();
    });
  }

  function renderProjects() {
    const list = Store.projects();
    pageEl().innerHTML = `
      <div class="page-head">
        <div><h2 class="serif">Projects</h2></div>
        <button class="btn primary" type="button" data-action="edit-project">New project</button>
      </div>
      <div class="grid-4">
        ${list.map((p) => `
          <article class="card box">
            <div class="boxhead"><h3>${p.name}</h3>${badge(p.status)}</div>
            <dl class="prop-stats">
              <div><dt>Activate</dt><dd>${Store.money(p.activationAmount)}</dd></div>
              <div><dt>Daily</dt><dd>${Store.money(p.dailyCommission)}</dd></div>
              <div><dt>Days</dt><dd>${p.durationDays}</dd></div>
              <div><dt>Total</dt><dd>${Store.money(p.totalCommission)}</dd></div>
            </dl>
            <div class="hero-ctas">
              <button class="btn light" type="button" data-action="edit-project" data-id="${p.id}">Edit</button>
              <button class="btn light" type="button" data-action="toggle-project" data-id="${p.id}" data-status="${p.status === 'active' ? 'inactive' : 'active'}">${p.status === 'active' ? 'Deactivate' : 'Activate'}</button>
            </div>
          </article>`).join('')}
      </div>`;
  }

  function editProject(id) {
    const p = id ? Store.projectById(id) : {
      id: '', name: '', image: '', description: '', activationAmount: 1000, dailyCommission: 10, durationDays: 30, status: 'active', tag: 'Custom',
    };
    openModal(`
      <h3>${id ? 'Edit project' : 'New project'}</h3>
      <form id="proj-form" class="fields">
        <div class="field"><label>Name</label><input id="pj-name" value="${p.name || ''}" required></div>
        <div class="field"><label>Description</label><input id="pj-desc" value="${p.description || ''}"></div>
        <div class="field"><label>Image URL</label><input id="pj-image" value="${p.image || ''}"></div>
        <div class="form-2">
          <div class="field"><label>Activation</label><input id="pj-amount" type="number" value="${p.activationAmount || 0}"></div>
          <div class="field"><label>Daily commission</label><input id="pj-daily" type="number" value="${p.dailyCommission || 0}"></div>
          <div class="field"><label>Duration days</label><input id="pj-days" type="number" value="${p.durationDays || 0}"></div>
          <div class="field"><label>Status</label>
            <select id="pj-status"><option ${p.status === 'active' ? 'selected' : ''}>active</option><option ${p.status === 'inactive' ? 'selected' : ''}>inactive</option></select>
          </div>
        </div>
        <p class="muted" id="pj-total">Total commission updates from daily × days.</p>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Cancel</button>
          <button class="btn primary" type="submit">Save</button>
        </div>
      </form>`);
    const updateTotal = () => {
      const total = (Number(document.getElementById('pj-daily').value) || 0) * (Number(document.getElementById('pj-days').value) || 0);
      document.getElementById('pj-total').textContent = `Total commission ${Store.money(total)}`;
    };
    document.getElementById('pj-daily').addEventListener('input', updateTotal);
    document.getElementById('pj-days').addEventListener('input', updateTotal);
    updateTotal();
    document.getElementById('proj-form').addEventListener('submit', (e) => {
      e.preventDefault();
      Store.upsertProject({
        id: p.id,
        name: document.getElementById('pj-name').value.trim(),
        description: document.getElementById('pj-desc').value.trim(),
        image: document.getElementById('pj-image').value.trim(),
        activationAmount: document.getElementById('pj-amount').value,
        dailyCommission: document.getElementById('pj-daily').value,
        durationDays: document.getElementById('pj-days').value,
        status: document.getElementById('pj-status').value,
        tag: p.tag || 'Custom',
      });
      closeModal();
      toast('Project saved');
      renderProjects();
    });
  }

  function renderCashouts() {
    const tab = new URLSearchParams(location.search).get('status') || 'pending';
    const list = Store.cashouts().filter((c) => (tab === 'all' ? true : c.status === tab));
    pageEl().innerHTML = `
      <div class="page-head"><div><h2 class="serif">Cash out</h2></div></div>
      <div class="chips">
        ${['pending', 'processing', 'completed', 'rejected', 'all'].map((s) => `<a class="chip${s === tab ? ' active' : ''}" href="cashouts.html?status=${s}">${s}</a>`).join('')}
      </div>
      <section class="card box"><div class="tablewrap"><table class="data-table">
        <thead><tr><th>User</th><th>Amount</th><th>Method</th><th>Destination</th><th>When</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${list.map((c) => `<tr>
            <td>${c.userName}<div class="muted">${c.mobile}</div></td>
            <td>${Store.money(c.amount)}</td><td>${c.method}</td><td>${c.destination}</td>
            <td>${c.requestedAt.slice(0, 16).replace('T', ' ')}</td><td>${badge(c.status)}</td>
            <td>${c.status === 'pending' || c.status === 'processing' ? `<button class="btn light" type="button" data-action="approve" data-id="${c.id}">Approve</button> <button class="btn light" type="button" data-action="reject" data-id="${c.id}">Reject</button>` : (c.rejectionReason || '—')}</td>
          </tr>`).join('') || '<tr><td colspan="7">None in this tab.</td></tr>'}
        </tbody>
      </table></div></section>`;
  }

  function renderReferrals() {
    const q = (document.getElementById('ref-q')?.value || '').toLowerCase();
    const users = Store.users().filter((u) => !q || `${u.fullName} ${u.referralCode} ${u.mobile}`.toLowerCase().includes(q));
    const refs = Store.load().referrals;
    pageEl().innerHTML = `
      <div class="page-head"><div><h2 class="serif">Referrals</h2></div></div>
      <div class="filters"><input id="ref-q" type="search" placeholder="Search code, name, or mobile" value="${q}"></div>
      <section class="card box"><div class="tablewrap"><table class="data-table">
        <thead><tr><th>Member</th><th>Code</th><th>Referred by</th><th>Count</th><th>Joined</th></tr></thead>
        <tbody>
          ${users.map((u) => {
            const parent = Store.users().find((x) => x.id === u.referredBy);
            const count = refs.filter((r) => r.referrerId === u.id).length;
            return `<tr><td>${u.fullName}</td><td>${u.referralCode}</td><td>${parent ? parent.fullName : '—'}</td><td>${count}</td><td>${String(u.createdAt).slice(0, 10)}</td></tr>`;
          }).join('')}
        </tbody>
      </table></div></section>`;
    document.getElementById('ref-q').addEventListener('input', renderReferrals);
  }

  function renderSettings() {
    const s = Store.settings();
    pageEl().innerHTML = `
      <div class="page-head"><div><h2 class="serif">Settings</h2></div></div>
      <form id="settings-form" class="card box fields">
        <div class="field"><label for="set-name">Platform name</label><input id="set-name" value="${s.platformName}"></div>
        <div class="form-2">
          <div class="field"><label for="set-bonus">Welcome bonus</label><input id="set-bonus" type="number" value="${s.welcomeBonusAmount}"></div>
          <div class="field"><label for="set-min">Minimum cash out</label><input id="set-min" type="number" value="${s.minCashOutAmount}"></div>
          <div class="field"><label for="set-symbol">Currency symbol</label><input id="set-symbol" value="${s.currencySymbol}"></div>
          <div class="field"><label for="set-tg">Telegram username</label><input id="set-tg" value="${s.supportTelegramUsername}"></div>
        </div>
        <div class="field"><label for="set-addr">Cash-in address</label><input id="set-addr" value="${s.demoCashInUSDTAddress}"></div>
        <button class="btn primary" type="submit">Save settings</button>
      </form>
      <p style="margin-top:16px"><button class="btn light" type="button" data-action="reset-demo">Reset data</button></p>`;
    document.getElementById('settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      Store.updateSettings({
        platformName: document.getElementById('set-name').value.trim(),
        welcomeBonusAmount: document.getElementById('set-bonus').value,
        minCashOutAmount: document.getElementById('set-min').value,
        currencySymbol: document.getElementById('set-symbol').value.trim() || 'AED',
        supportTelegramUsername: document.getElementById('set-tg').value.trim(),
        demoCashInUSDTAddress: document.getElementById('set-addr').value.trim(),
      });
      toast('Settings saved');
    });
  }

  function render() {
    if (!document.getElementById('page')) return;
    const page = document.body.dataset.page;
    const map = {
      dashboard: renderDashboard,
      users: renderUsers,
      projects: renderProjects,
      cashouts: renderCashouts,
      referrals: renderReferrals,
      settings: renderSettings,
    };
    (map[page] || renderDashboard)();
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || document.body.dataset.app !== 'admin') return;
    const action = el.dataset.action;
    if (action === 'user') openUser(el.dataset.id);
    if (action === 'status') {
      Store.setUserStatus(el.dataset.id, el.dataset.status);
      closeModal();
      toast('Account status updated');
      renderUsers();
    }
    if (action === 'edit-project') editProject(el.dataset.id);
    if (action === 'toggle-project') {
      Store.setProjectStatus(el.dataset.id, el.dataset.status);
      toast('Project updated');
      renderProjects();
    }
    if (action === 'approve') {
      Store.setCashoutStatus(el.dataset.id, 'completed');
      toast('Cash out approved');
      renderCashouts();
    }
    if (action === 'reject') {
      const reason = window.prompt('Rejection reason');
      if (!reason) return;
      const result = Store.setCashoutStatus(el.dataset.id, 'rejected', reason);
      toast(result.ok ? 'Cash out rejected and refunded' : result.error);
      renderCashouts();
    }
    if (action === 'reset-demo') {
      Store.reset();
      toast('Data reset');
      renderSettings();
    }
  });

  return { render };
})();

if (document.body.dataset.app === 'admin' && Store.requireAdmin()) Admin.render();
