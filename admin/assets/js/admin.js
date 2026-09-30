/* ============================================================
   Admin workspace (UI demo)
   ============================================================ */

const Admin = (() => {
  const API_BASE = 'http://127.0.0.1:4000';
  let userStatus = 'all';
  let directory = [];
  let catalog = [];
  let referralRows = [];
  let cashoutRows = [];
  let platform = null;
  let loadNote = '';

  function adminToken() {
    return sessionStorage.getItem('ps_admin_token') || '';
  }

  async function adminApi(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json', Authorization: `Bearer ${adminToken()}` };
    if (body) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      sessionStorage.removeItem('ps_admin');
      sessionStorage.removeItem('ps_admin_token');
      window.location.href = 'login.html';
      throw new Error(data.message || 'Admin sign in required.');
    }
    if (!res.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }

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

  function emptyState(icon, title, text) {
    return `<div class="empty-state">${navIcon(icon)}<b>${esc(title)}</b><p>${esc(text)}</p></div>`;
  }

  function renderDashboard() {
    const users = directory;
    const active = users.filter((u) => u.accountStatus === 'active').length;
    const walletSum = users.reduce((s, u) => s + (Number(u.walletBalance) || 0), 0);
    pageEl().innerHTML = `
      <div class="page-head"><h2 class="serif">Dashboard</h2></div>
      <div class="kpis">
        ${kpi('Users', users.length, 'Member accounts')}
        ${kpi('Active users', active, 'Can sign in')}
        ${kpi('Projects', catalog.length, 'In the catalog')}
        ${kpi('Wallet balances', Store.money(walletSum), 'All members')}
      </div>
      <section class="card box" style="margin-top:16px">
        <div class="boxhead"><h3>Recent members</h3></div>
        <div class="tablewrap"><table class="data-table">
          <thead><tr><th>Name</th><th>Mobile</th><th>Code</th><th>Balance</th><th>Joined</th><th>Status</th></tr></thead>
          <tbody>${users.length ? users.slice(0, 8).map((u) => `<tr>
            <td>${esc(u.fullName)}</td><td>${esc(u.mobile)}</td><td>${esc(u.referralCode)}</td>
            <td>${Store.money(u.walletBalance)}</td><td>${esc(String(u.createdAt || '').slice(0, 10))}</td><td>${badge(u.accountStatus)}</td>
          </tr>`).join('') : `<tr><td colspan="6">${emptyState('users', 'No members yet', 'Accounts appear here after someone signs up.')}</td></tr>`}</tbody>
        </table></div>
      </section>`;
  }

  function renderUsers() {
    const qRaw = document.getElementById('user-q')?.value || '';
    const q = qRaw.toLowerCase();
    let users = directory;
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
            ${users.length ? users.map((u) => `<tr class="order-row" tabindex="0" data-action="user" data-id="${esc(u.id)}">
              <td>${esc(u.fullName)}</td><td>${esc(u.mobile)}</td><td>${esc(u.referralCode)}</td>
              <td>${Store.money(u.walletBalance)}</td><td>${Store.money(u.pendingCashOut)}</td>
              <td>${badge(u.accountStatus)}</td>
              <td><button class="btn light" type="button" data-action="user" data-id="${esc(u.id)}">Manage</button></td>
            </tr>`).join('') : `<tr><td colspan="7">${emptyState('users', directory.length ? 'No users match' : 'No members yet', directory.length ? 'Try a different name, mobile, or status.' : 'Accounts appear here after someone signs up.')}</td></tr>`}
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
    const u = directory.find((x) => x.id === id);
    if (!u) return;
    const byName = u.referredByName || '';
    openModal(`
      <h3>${esc(u.fullName)}</h3>
      <p class="muted">${esc(u.mobile)} · ${esc(u.referralCode)}</p>
      <dl class="stack-stats">
        <div class="stack-row"><span>Balance</span><b>${Store.money(u.walletBalance)}</b></div>
        <div class="stack-row"><span>Pending cash out</span><b>${Store.money(u.pendingCashOut)}</b></div>
        <div class="stack-row"><span>Referred by</span><b>${byName ? esc(byName) : '—'}</b></div>
        <div class="stack-row"><span>Referrals</span><b>${u.referralCount || 0}</b></div>
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
    document.getElementById('adjust-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await adminApi(`/api/users/${id}/adjustment`, {
          method: 'POST',
          body: {
            amount: document.getElementById('adj-amount').value,
            reason: document.getElementById('adj-reason').value.trim(),
          },
        });
        directory = directory.map((row) => (row.id === data.user.id ? data.user : row));
        closeModal();
        toast('Wallet adjusted');
        renderUsers();
      } catch (err) {
        toast(err.message);
      }
    });
  }

  function renderProjects() {
    const list = catalog;
    pageEl().innerHTML = `
      <div class="page-head">
        <h2 class="serif">Projects</h2>
        <button class="btn primary" type="button" data-action="edit-project">New project</button>
      </div>
      ${list.length ? `<div class="grid-4">
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
          </article>`).join('')}
      </div>` : `<div class="empty-wrap">${emptyState('grid', 'No projects yet', 'Create a project to show it in the catalog.')}</div>`}`;
  }

  function editProject(id) {
    const found = id ? catalog.find((item) => item.id === id) : null;
    if (id && !found) return;
    const p = found || {
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
    document.getElementById('proj-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
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
      };
      try {
        const data = p.id
          ? await adminApi(`/api/projects/${p.id}`, { method: 'PATCH', body: payload })
          : await adminApi('/api/projects', { method: 'POST', body: payload });
        catalog = [data.project, ...catalog.filter((item) => item.id !== data.project.id)];
        closeModal();
        toast('Project saved');
        renderProjects();
      } catch (err) {
        toast(err.message);
      }
    });
  }

  function renderCashouts() {
    const tab = new URLSearchParams(location.search).get('status') || 'pending';
    const list = cashoutRows.filter((c) => (tab === 'all' ? true : c.status === tab));
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
          ${list.length ? list.map((c) => `<tr>
            <td>${esc(c.userName)}<div class="muted">${esc(c.mobile)}</div></td>
            <td>${Store.money(c.amount)}</td><td>${esc(c.method)}</td><td>${esc(c.destination)}</td>
            <td>${esc(String(c.requestedAt || '').slice(0, 16).replace('T', ' '))}</td><td>${badge(c.status)}</td>
            <td>${c.status === 'pending' || c.status === 'processing' ? `<div class="row-actions"><button class="btn light" type="button" data-action="approve" data-id="${esc(c.id)}">Approve</button><button class="btn light" type="button" data-action="reject" data-id="${esc(c.id)}">Reject</button></div>` : esc(c.rejectionReason || '—')}</td>
          </tr>`).join('') : `<tr><td colspan="7"><div class="empty-wrap">${emptyState('card', loadNote || 'No cash outs in this view', loadNote ? 'Refresh the page and try again.' : 'Requests show here when a member asks to cash out.')}</div></td></tr>`}
        </tbody>
      </table></div></section>`;
  }

  function renderReferrals() {
    const qRaw = document.getElementById('ref-q')?.value || '';
    const q = qRaw.toLowerCase();
    const caret = document.activeElement && document.activeElement.id === 'ref-q'
      ? document.activeElement.selectionStart
      : null;
    const rows = referralRows.filter((r) => {
      const blob = `${r.name} ${r.mobile} ${r.referrerName} ${r.referralCode}`.toLowerCase();
      return !q || blob.includes(q);
    });
    pageEl().innerHTML = `
      <div class="page-head"><h2 class="serif">Referrals</h2></div>
      <label class="search-bar page-search catalog-search">
        ${searchIcon()}
        <input id="ref-q" type="search" placeholder="Search member, code, or mobile" aria-label="Search referrals" value="${esc(qRaw)}">
      </label>
      <section class="card box">
        ${rows.length ? `<div class="tablewrap"><table class="data-table">
        <thead><tr><th>Member</th><th>Mobile</th><th>Referrer</th><th>Code</th><th>Joined</th><th>Status</th></tr></thead>
        <tbody>
          ${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.mobile)}</td><td>${esc(r.referrerName || '—')}</td><td>${esc(r.referralCode || '—')}</td><td>${esc(r.date)}</td><td>${badge(r.status)}</td></tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-wrap">${emptyState('share', loadNote ? 'Could not load referrals' : (q ? 'No referrals match' : 'No referrals yet'), loadNote || (q ? 'Try another name, code, or mobile.' : 'A referral is recorded when someone signs up with a member code.'))}</div>`}
      </section>`;
    const input = document.getElementById('ref-q');
    input.addEventListener('input', renderReferrals);
    if (caret !== null) {
      input.focus();
      input.setSelectionRange(caret, caret);
    }
  }

  function renderSettings() {
    const s = platform || {
      platformName: '',
      welcomeBonusAmount: 100,
      minCashOutAmount: 500,
      supportTelegramUsername: '',
      demoCashInUSDTAddress: '',
    };
    pageEl().innerHTML = `
      <div class="page-head"><h2 class="serif">Settings</h2></div>
      ${loadNote ? `<div class="empty-wrap">${emptyState('gear', 'Could not load settings', loadNote)}</div>` : `
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
        </div>
      </form>`}`;
    const form = document.getElementById('settings-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const data = await adminApi('/api/settings', {
          method: 'PATCH',
          body: {
            platformName: document.getElementById('set-name').value.trim(),
            welcomeBonusAmount: document.getElementById('set-bonus').value,
            minCashOutAmount: document.getElementById('set-min').value,
            supportTelegramUsername: document.getElementById('set-tg').value.trim(),
            demoCashInUSDTAddress: document.getElementById('set-addr').value.trim(),
          },
        });
        platform = data.settings;
        toast('Settings saved');
      } catch (err) {
        toast(err.message);
      }
    });
  }

  async function load() {
    const page = document.body.dataset.page;
    loadNote = '';
    try {
      if (page === 'dashboard' || page === 'users') {
        directory = (await adminApi('/api/users')).users || [];
      }
      if (page === 'dashboard' || page === 'projects') {
        catalog = (await adminApi('/api/projects?all=1')).projects || [];
      }
      if (page === 'referrals') {
        referralRows = (await adminApi('/api/referrals/all')).referrals || [];
      }
      if (page === 'cashouts') {
        const tab = new URLSearchParams(location.search).get('status') || 'pending';
        cashoutRows = (await adminApi(`/api/cashouts/all?status=${encodeURIComponent(tab)}`)).cashouts || [];
      }
      if (page === 'settings') {
        platform = (await adminApi('/api/settings')).settings;
      }
    } catch (err) {
      loadNote = err.message || 'Could not load this page.';
    }
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
      adminApi(`/api/users/${el.dataset.id}/status`, {
        method: 'PATCH',
        body: { accountStatus: el.dataset.status },
      }).then((data) => {
        directory = directory.map((row) => (row.id === data.user.id ? data.user : row));
        closeModal();
        toast('Account status updated');
        renderUsers();
      }).catch((err) => toast(err.message));
    }
    if (action === 'edit-project') editProject(el.dataset.id);
    if (action === 'toggle-project') {
      adminApi(`/api/projects/${el.dataset.id}/status`, {
        method: 'PATCH',
        body: { status: el.dataset.status },
      }).then((data) => {
        catalog = catalog.map((item) => (item.id === data.project.id ? data.project : item));
        toast('Project updated');
        renderProjects();
      }).catch((err) => toast(err.message));
    }
    if (action === 'approve') {
      adminApi(`/api/cashouts/${el.dataset.id}`, {
        method: 'PATCH',
        body: { status: 'completed' },
      }).then((data) => {
        cashoutRows = cashoutRows.map((row) => (row.id === data.cashout.id ? data.cashout : row));
        toast('Cash out approved');
        renderCashouts();
      }).catch((err) => toast(err.message));
    }
    if (action === 'reject') {
      const reason = window.prompt('Rejection reason');
      if (!reason) return;
      adminApi(`/api/cashouts/${el.dataset.id}`, {
        method: 'PATCH',
        body: { status: 'rejected', rejectionReason: reason },
      }).then((data) => {
        cashoutRows = cashoutRows.map((row) => (row.id === data.cashout.id ? data.cashout : row));
        toast('Cash out rejected and refunded');
        renderCashouts();
      }).catch((err) => toast(err.message));
    }
  });

  return { load, render };
})();

if (document.body.dataset.app === 'admin' && Store.requireAdmin()) {
  Admin.load().then(() => Admin.render()).catch((err) => toast(err.message));
}
