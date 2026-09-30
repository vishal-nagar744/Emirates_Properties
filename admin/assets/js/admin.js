/* ============================================================
   Admin workspace (UI demo)
   ============================================================ */

const Admin = (() => {
  let userStatus = 'all';

  function pageEl() {
    return document.getElementById('page');
  }

  function esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function kpi(label, value, hint) {
    return `<div class="card kpi"><small>${label}</small><b>${value}</b>${hint ? `<span>${hint}</span>` : ''}</div>`;
  }

  function searchIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16.5 20 20.5"/></svg>';
  }

  function renderDashboard() {
    const users = Store.users();
    const orders = Store.allOrders();
    const cashouts = Store.cashouts();
    const walletSum = users.reduce((s, u) => s + u.walletBalance, 0);
    const pending = cashouts.filter((c) => c.status === 'pending').length;
    pageEl().innerHTML = `
      <div class="page-head"><h2 class="serif">Dashboard</h2></div>
      <div class="kpis">
        ${kpi('Users', users.length, 'Accounts')}
        ${kpi('Active orders', orders.filter((o) => o.status === 'active').length, 'Running now')}
        ${kpi('Pending cash outs', pending, 'Need a decision')}
        ${kpi('Wallet balances', Store.money(walletSum), 'All members')}
      </div>
      <section class="card box" style="margin-top:16px">
        <div class="boxhead"><h3>Recent orders</h3></div>
        <div class="tablewrap"><table class="data-table">
          <thead><tr><th>Order</th><th>Member</th><th>Project</th><th>Activated</th><th>Daily</th><th>Earned</th><th>Status</th></tr></thead>
          <tbody>${orders.map((o) => {
            const member = users.find((u) => u.id === o.userId);
            return `<tr><td>${esc(o.id)}</td><td>${esc(member ? member.fullName : o.userId)}</td><td>${esc(o.projectName)}</td><td>${Store.money(o.activationAmount)}</td><td>${Store.money(o.dailyCommission)}</td><td>${Store.money(o.earnedCommission)}</td><td>${badge(o.status)}</td></tr>`;
          }).join('') || '<tr><td colspan="7">No orders yet.</td></tr>'}</tbody>
        </table></div>
      </section>`;
  }

  function renderUsers() {
    const qRaw = document.getElementById('user-q')?.value || '';
    const q = qRaw.toLowerCase();
    let users = Store.users();
    if (userStatus !== 'all') users = users.filter((u) => u.accountStatus === userStatus);
    if (q) users = users.filter((u) => `${u.fullName} ${u.mobile} ${u.referralCode}`.toLowerCase().includes(q));
    const caret = document.activeElement && document.activeElement.id === 'user-q'
      ? document.activeElement.selectionStart
      : null;
    const filters = [['all', 'All'], ['active', 'Active'], ['frozen', 'Frozen'], ['suspended', 'Suspended']];
    pageEl().innerHTML = `
      <div class="page-head"><h2 class="serif">Users</h2></div>
      <div class="catalog-bar">
        <label class="search-bar page-search">
          ${searchIcon()}
          <input id="user-q" type="search" placeholder="Search name, mobile, or code" aria-label="Search users" value="${esc(qRaw)}">
        </label>
        <div class="catalog-filters" role="group" aria-label="Filter users">
          ${filters.map(([id, label]) => `<button class="chip${userStatus === id ? ' active' : ''}" type="button" data-action="user-filter" data-status="${id}" aria-pressed="${userStatus === id}">${label}</button>`).join('')}
        </div>
      </div>
      <section class="card box">
        <div class="tablewrap"><table class="data-table">
          <thead><tr><th>Name</th><th>Mobile</th><th>Code</th><th>Balance</th><th>Pending</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${users.map((u) => `<tr class="order-row" tabindex="0" data-action="user" data-id="${esc(u.id)}">
              <td>${esc(u.fullName)}</td><td>${esc(u.mobile)}</td><td>${esc(u.referralCode)}</td>
              <td>${Store.money(u.walletBalance)}</td><td>${Store.money(u.pendingCashOut)}</td>
              <td>${badge(u.accountStatus)}</td>
              <td><button class="btn light" type="button" data-action="user" data-id="${esc(u.id)}">Manage</button></td>
            </tr>`).join('') || '<tr><td colspan="7">No users match.</td></tr>'}
          </tbody>
        </table></div>
      </section>`;
    const input = document.getElementById('user-q');
    input.addEventListener('input', renderUsers);
    document.querySelectorAll('#page tr.order-row').forEach((row) => {
      row.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openUser(row.dataset.id);
      });
    });
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
      <h3>${esc(u.fullName)}</h3>
      <p class="muted">${esc(u.mobile)} · ${esc(u.referralCode)}</p>
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
        <h2 class="serif">Projects</h2>
        <button class="btn primary" type="button" data-action="edit-project">New project</button>
      </div>
      <div class="grid-4">
        ${list.map((p) => `
          <article class="card admin-project">
            <div class="property-img">
              ${p.image ? `<img src="${esc(p.image)}" alt="">` : '<div class="admin-photo-empty"></div>'}
              <span class="prop-tag">${esc(p.tag || 'Project')}</span>
            </div>
            <div class="prop-body">
              <div class="prop-meta"><span>${p.durationDays} days</span><span class="prop-status">${p.status === 'active' ? 'Available' : 'Closed'}</span></div>
              <h3>${esc(p.name)}</h3>
              <p class="prop-line">${esc(p.address || 'Dubai')}</p>
              <p class="prop-line">${esc(p.developer || 'Developer')}</p>
              <dl class="prop-stats">
                <div><dt>Activate</dt><dd>${Store.money(p.activationAmount)}</dd></div>
                <div><dt>Daily</dt><dd>${Store.money(p.dailyCommission)}</dd></div>
                <div><dt>Total</dt><dd>${Store.money(p.totalCommission)}</dd></div>
              </dl>
              <div class="admin-project-actions">
                <button class="btn light" type="button" data-action="edit-project" data-id="${esc(p.id)}">Edit</button>
                <button class="btn light" type="button" data-action="toggle-project" data-id="${esc(p.id)}" data-status="${p.status === 'active' ? 'inactive' : 'active'}">${p.status === 'active' ? 'Close' : 'Open'}</button>
              </div>
            </div>
          </article>`).join('') || '<p class="muted">No projects yet.</p>'}
      </div>`;
  }

  function editProject(id) {
    const p = id ? Store.projectById(id) : {
      id: '', name: '', image: '', description: '', address: '', developer: '', activationAmount: 1000, dailyCommission: 10, durationDays: 30, status: 'active', tag: 'Custom',
    };
    openModal(`
      <h3>${id ? 'Edit project' : 'New project'}</h3>
      <form id="proj-form" class="fields">
        <div class="field"><label for="pj-name">Name</label><input id="pj-name" value="${esc(p.name)}" required></div>
        <div class="field"><label for="pj-desc">Description</label><input id="pj-desc" value="${esc(p.description)}"></div>
        <div class="form-2">
          <div class="field"><label for="pj-address">Address</label><input id="pj-address" value="${esc(p.address)}"></div>
          <div class="field"><label for="pj-developer">Developer</label><input id="pj-developer" value="${esc(p.developer)}"></div>
        </div>
        <div class="field"><label for="pj-image">Image URL</label><input id="pj-image" value="${esc(p.image)}"></div>
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
        address: document.getElementById('pj-address').value.trim(),
        developer: document.getElementById('pj-developer').value.trim(),
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
    const filters = [['pending', 'Pending'], ['processing', 'Processing'], ['completed', 'Completed'], ['rejected', 'Rejected'], ['all', 'All']];
    pageEl().innerHTML = `
      <div class="page-head">
        <h2 class="serif">Cash out</h2>
        <div class="page-tools">
          <div class="chips" role="group" aria-label="Filter cash outs">
            ${filters.map(([id, label]) => `<a class="chip${id === tab ? ' active' : ''}" href="cashouts.html?status=${id}">${label}</a>`).join('')}
          </div>
        </div>
      </div>
      <section class="card box"><div class="tablewrap"><table class="data-table">
        <thead><tr><th>Member</th><th>Amount</th><th>Method</th><th>Destination</th><th>When</th><th>Status</th><th></th></tr></thead>
        <tbody>
          ${list.map((c) => `<tr>
            <td>${esc(c.userName)}<div class="muted">${esc(c.mobile)}</div></td>
            <td>${Store.money(c.amount)}</td><td>${esc(c.method)}</td><td>${esc(c.destination)}</td>
            <td>${c.requestedAt.slice(0, 16).replace('T', ' ')}</td><td>${badge(c.status)}</td>
            <td>${c.status === 'pending' || c.status === 'processing' ? `<div class="row-actions"><button class="btn light" type="button" data-action="approve" data-id="${esc(c.id)}">Approve</button><button class="btn light" type="button" data-action="reject" data-id="${esc(c.id)}">Reject</button></div>` : esc(c.rejectionReason || '—')}</td>
          </tr>`).join('') || '<tr><td colspan="7">None in this view.</td></tr>'}
        </tbody>
      </table></div></section>`;
  }

  function renderReferrals() {
    const qRaw = document.getElementById('ref-q')?.value || '';
    const q = qRaw.toLowerCase();
    const users = Store.users();
    const caret = document.activeElement && document.activeElement.id === 'ref-q'
      ? document.activeElement.selectionStart
      : null;
    const rows = Store.load().referrals.filter((r) => {
      const parent = users.find((u) => u.id === r.referrerId);
      const blob = `${r.name} ${r.mobile} ${parent ? parent.fullName : ''} ${parent ? parent.referralCode : ''}`.toLowerCase();
      return !q || blob.includes(q);
    });
    pageEl().innerHTML = `
      <div class="page-head"><h2 class="serif">Referrals</h2></div>
      <label class="search-bar page-search catalog-search">
        ${searchIcon()}
        <input id="ref-q" type="search" placeholder="Search member, code, or mobile" aria-label="Search referrals" value="${esc(qRaw)}">
      </label>
      <section class="card box"><div class="tablewrap"><table class="data-table">
        <thead><tr><th>Member</th><th>Mobile</th><th>Referrer</th><th>Code</th><th>Joined</th><th>Status</th></tr></thead>
        <tbody>
          ${rows.map((r) => {
            const parent = users.find((u) => u.id === r.referrerId);
            return `<tr><td>${esc(r.name)}</td><td>${esc(r.mobile)}</td><td>${esc(parent ? parent.fullName : '—')}</td><td>${esc(parent ? parent.referralCode : '—')}</td><td>${esc(r.date)}</td><td>${badge(r.status)}</td></tr>`;
          }).join('') || '<tr><td colspan="6">No referrals match.</td></tr>'}
        </tbody>
      </table></div></section>`;
    const input = document.getElementById('ref-q');
    input.addEventListener('input', renderReferrals);
    if (caret !== null) {
      input.focus();
      input.setSelectionRange(caret, caret);
    }
  }

  function renderSettings() {
    const s = Store.settings();
    pageEl().innerHTML = `
      <div class="page-head"><h2 class="serif">Settings</h2></div>
      <form id="settings-form" class="card box fields">
        <div class="field"><label for="set-name">Platform name</label><input id="set-name" value="${esc(s.platformName)}"></div>
        <div class="form-2">
          <div class="field"><label for="set-bonus">Welcome bonus (AED)</label><input id="set-bonus" type="number" value="${s.welcomeBonusAmount}"></div>
          <div class="field"><label for="set-min">Minimum cash out (AED)</label><input id="set-min" type="number" value="${s.minCashOutAmount}"></div>
        </div>
        <div class="form-2">
          <div class="field"><label for="set-tg">Telegram username</label><input id="set-tg" value="${esc(s.supportTelegramUsername)}"></div>
          <div class="field"><label for="set-addr">Cash-in address</label><input id="set-addr" value="${esc(s.demoCashInUSDTAddress)}"></div>
        </div>
        <div class="settings-actions">
          <button class="btn primary" type="submit">Save settings</button>
          <button class="btn light" type="button" data-action="reset-demo">Reset data</button>
        </div>
      </form>`;
    document.getElementById('settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      Store.updateSettings({
        platformName: document.getElementById('set-name').value.trim(),
        welcomeBonusAmount: document.getElementById('set-bonus').value,
        minCashOutAmount: document.getElementById('set-min').value,
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
    if (action === 'user-filter') {
      userStatus = el.dataset.status || 'all';
      renderUsers();
    }
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
