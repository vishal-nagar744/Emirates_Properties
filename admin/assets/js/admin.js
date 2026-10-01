/* ============================================================
   Admin workspace (UI demo)
   ============================================================ */

const Admin = (() => {
  const API_BASE = window.apiBase ? window.apiBase() : 'http://127.0.0.1:4000';
  let userStatus = 'all';
  let directory = [];
  let catalog = [];
  let groups = [];
  let referralRows = [];
  let cashoutRows = [];
  let txRows = [];
  let platform = null;
  let loadNote = '';
  let loading = false;

  function adminToken() {
    return sessionStorage.getItem('ps_admin_token') || '';
  }

  function expireAdminSession() {
    sessionStorage.removeItem('ps_admin');
    sessionStorage.removeItem('ps_admin_token');
    sessionStorage.removeItem('ps_admin_user');
    localStorage.removeItem('ps_admin');
    localStorage.removeItem('ps_admin_token');
    localStorage.removeItem('ps_admin_user');
    window.location.href = 'login.html';
    return new Promise(() => {});
  }

  async function adminApi(path, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json', Authorization: `Bearer ${adminToken()}` };
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
    if (res.status === 401) return expireAdminSession();
    if (!res.ok) throw new Error(data.message || 'Request failed.');
    return data;
  }

  async function uploadProjectImage(file) {
    const body = new FormData();
    body.append('image', file);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let res;
    try {
      res = await fetch(`${API_BASE}/api/projects/image`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${adminToken()}` },
        body,
        signal: controller.signal,
      });
    } catch (err) {
      if (err && err.name === 'AbortError') throw new Error('The upload took too long.');
      throw new Error('Could not reach the server.');
    } finally {
      clearTimeout(timer);
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) return expireAdminSession();
    if (!res.ok) throw new Error(data.message || 'Could not upload the image.');
    return data.image;
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
        ${kpi('Users', users.length, 'User accounts')}
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
    const filters = [['all', 'All'], ['active', 'Active'], ['pending', 'Pending'], ['blocked', 'Blocked'], ['suspended', 'Suspended']];
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
      <div class="modal-title">
        <h3>${esc(u.fullName)}</h3>
        <button class="icon-btn" type="button" data-action="user-sessions" data-id="${esc(u.id)}" data-name="${esc(u.fullName)}" aria-label="View sessions"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></button>
      </div>
      <p class="muted">${esc(u.mobile)} · ${esc(u.referralCode)}</p>
      <dl class="stack-stats">
        <div class="stack-row"><span>Balance</span><b>${Store.money(u.walletBalance)}</b></div>
        <div class="stack-row"><span>Pending cash out</span><b>${Store.money(u.pendingCashOut)}</b></div>
        <div class="stack-row"><span>Referred by</span><b>${byName ? esc(byName) : '—'}</b></div>
        <div class="stack-row"><span>Referrals</span><b>${u.referralCount || 0}</b></div>
      </dl>
      <div class="field status-field">
        <label for="user-status">Account status</label>
        <select id="user-status">
          <option value="active"${u.accountStatus === 'active' ? ' selected' : ''}>Active</option>
          <option value="pending"${u.accountStatus === 'pending' ? ' selected' : ''}>Pending</option>
          <option value="blocked"${u.accountStatus === 'blocked' ? ' selected' : ''}>Blocked</option>
          <option value="suspended"${u.accountStatus === 'suspended' ? ' selected' : ''}>Suspended</option>
        </select>
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
      const accountStatus = document.getElementById('user-status').value;
      const amount = document.getElementById('adj-amount').value.trim();
      const reason = document.getElementById('adj-reason').value.trim();
      try {
        const statusData = await adminApi(`/api/users/${id}/status`, {
          method: 'PATCH',
          body: { accountStatus },
        });
        let user = statusData.user;
        directory = directory.map((row) => (row.id === user.id ? user : row));
        if (amount !== '') {
          const data = await adminApi(`/api/users/${id}/adjustment`, {
            method: 'POST',
            body: { amount, reason },
          });
          user = data.user;
          directory = directory.map((row) => (row.id === user.id ? user : row));
        }
        closeModal();
        toast(amount !== '' ? 'Account updated' : 'Account status updated');
        renderUsers();
      } catch (err) {
        toast(err.message);
        renderUsers();
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

  function sessionCards(rows, userId) {
    if (!rows.length) return emptyState('users', 'No sessions yet', 'Sessions appear here after this member signs in.');
    return `<div class="session-list">${rows.map((row) => `
      <article class="session-card">
        <div class="session-top">
          <b>${esc(shown(row.browser))} · ${esc(shown(row.os))}</b>
          ${badge(row.status)}
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
        ${row.status === 'active' ? `<button class="btn light session-revoke" type="button" data-action="revoke-user-session" data-id="${esc(row.id)}" data-user="${esc(userId)}">Revoke session</button>` : ''}
      </article>`).join('')}</div>`;
  }

  async function openSessions(userId, name) {
    openModal(`<h3>${esc(name || 'Sessions')}</h3><p class="muted">Loading sessions…</p>`);
    try {
      const data = await adminApi(`/api/users/${encodeURIComponent(userId)}/sessions`);
      const rows = data.sessions || [];
      openModal(`
        <div class="modal-title">
          <h3>${esc(name || 'Sessions')}</h3>
          <button class="btn light" type="button" data-action="user" data-id="${esc(userId)}">Back</button>
        </div>
        <p class="muted">Sign-in sessions for this member.</p>
        ${sessionCards(rows, userId)}`);
    } catch (err) {
      openModal(`<h3>${esc(name || 'Sessions')}</h3><p>${esc(err.message)}</p><div class="modal-actions"><button class="btn light" type="button" data-dismiss>Close</button></div>`);
    }
  }

  function currentGroupId() {
    return new URLSearchParams(location.search).get('group') || '';
  }

  function backControl(href, label) {
    return `<a class="icon-btn back-btn" href="${esc(href)}" aria-label="${esc(label)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg></a>`;
  }

  async function refreshCatalog() {
    const [projectData, groupData] = await Promise.all([
      adminApi('/api/projects?all=1'),
      adminApi('/api/groups'),
    ]);
    catalog = projectData.projects || [];
    groups = groupData.groups || [];
  }

  function renderProjects() {
    const groupId = currentGroupId();
    if (!groupId) {
      setBreadcrumb([
        { href: 'dashboard.html', label: 'Admin' },
        { label: 'Projects' },
      ]);
      pageEl().innerHTML = `
        <div class="page-head">
          <h2 class="serif">Projects</h2>
          <button class="btn primary" type="button" data-action="edit-group">New group</button>
        </div>
        ${groups.length ? `<div class="admin-project-grid">
          ${groups.map((group) => `
            <article class="card admin-project">
              <a class="admin-project-photo" href="projects.html?group=${esc(group.id)}">
                ${group.image ? `<img src="${esc(group.image)}" alt="">` : '<div class="admin-photo-empty"></div>'}
              </a>
              <div class="admin-project-body">
                <div class="admin-project-top">
                  <span>${group.projectCount} project${group.projectCount === 1 ? '' : 's'}</span>
                </div>
                <h3><a href="projects.html?group=${esc(group.id)}">${esc(group.name)}</a></h3>
                ${group.description ? `<p class="group-desc">${esc(group.description)}</p>` : ''}
                <div class="admin-project-actions">
                  <a class="btn light" href="projects.html?group=${esc(group.id)}">Open</a>
                  <button class="btn light" type="button" data-action="edit-group" data-id="${esc(group.id)}">Edit</button>
                  <button class="icon-btn" type="button" data-action="delete-group" data-id="${esc(group.id)}" data-name="${esc(group.name)}" aria-label="Delete ${esc(group.name)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13"/></svg></button>
                </div>
              </div>
            </article>`).join('')}
        </div>` : `<div class="empty-wrap">${emptyState('grid', loadNote ? 'Could not load groups' : 'No groups yet', loadNote || 'Create a group, then add projects inside it.')}</div>`}`;
      return;
    }
    const group = groups.find((item) => item.id === groupId);
    const list = catalog.filter((project) => project.groupId === groupId);
    setBreadcrumb([
      { href: 'dashboard.html', label: 'Admin' },
      { href: 'projects.html', label: 'Projects' },
      { label: group ? group.name : 'Group' },
    ]);
    pageEl().innerHTML = `
      <div class="page-head">
        <div class="page-title-row">
          ${backControl('projects.html', 'Back to projects')}
          <h2 class="serif">${esc(group ? group.name : 'Group')}</h2>
        </div>
        <button class="btn primary" type="button" data-action="edit-project">New project</button>
      </div>
      ${list.length ? `<div class="admin-project-grid">
        ${list.map((p) => `
          <article class="card admin-project${p.status === 'active' ? '' : ' is-closed'}">
            <div class="admin-project-photo">
              ${p.image ? `<img src="${esc(p.image)}" alt="">` : '<div class="admin-photo-empty"></div>'}
            </div>
            <div class="admin-project-body">
              <div class="admin-project-top">
                <span>${esc(p.commissionRatio)}%</span>
                <span class="admin-project-state">${p.status === 'active' ? 'Available' : 'Closed'}</span>
              </div>
              <h3>${esc(p.name)}</h3>
              ${p.address ? `<p>${esc(p.address)}</p>` : ''}
              ${p.developer ? `<p>${esc(p.developer)}</p>` : ''}
              <dl class="admin-project-stats">
                <div><dt>Price</dt><dd>${Store.money(p.price)}</dd></div>
                <div><dt>Ratio</dt><dd>${esc(p.commissionRatio)}%</dd></div>
                <div><dt>Commission</dt><dd>${Store.money(p.commissionAmount)}</dd></div>
              </dl>
              <div class="admin-project-actions">
                <button class="btn light" type="button" data-action="edit-project" data-id="${esc(p.id)}">Edit</button>
                <button class="btn light" type="button" data-action="toggle-project" data-id="${esc(p.id)}" data-status="${p.status === 'active' ? 'inactive' : 'active'}">${p.status === 'active' ? 'Close' : 'Open'}</button>
                <button class="icon-btn" type="button" data-action="delete-project" data-id="${esc(p.id)}" data-name="${esc(p.name)}" aria-label="Delete ${esc(p.name)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13"/></svg></button>
              </div>
            </div>
          </article>`).join('')}
      </div>` : `<div class="empty-wrap">${emptyState('grid', 'No projects in this group', 'Add a project to show it to members.')}</div>`}`;
  }

  function bindPhotoUpload(inputId, noteId, previewId, saveButton, initialUrl) {
    let imageUrl = initialUrl || '';
    let uploadTask = Promise.resolve();
    const note = document.getElementById(noteId);
    const preview = document.getElementById(previewId);
    const input = document.getElementById(inputId);
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      uploadTask = (async () => {
        if (note) note.textContent = 'Uploading…';
        saveButton.disabled = true;
        preview.src = URL.createObjectURL(file);
        preview.hidden = false;
        try {
          imageUrl = await uploadProjectImage(file);
          preview.src = imageUrl;
          if (note) note.textContent = '';
        } catch (err) {
          if (note) note.textContent = err.message;
          toast(err.message);
        } finally {
          saveButton.disabled = false;
        }
      })();
    });
    return {
      url: () => imageUrl,
      ready: () => uploadTask,
    };
  }

  function editGroup(id) {
    const found = id ? groups.find((item) => item.id === id) : null;
    if (id && !found) return;
    const group = found || { id: '', name: '', description: '', image: '' };
    openModal(`
      <h3>${id ? 'Edit group' : 'New group'}</h3>
      <form id="group-form" class="fields">
        <div class="field"><label for="gr-name">Group name</label><input id="gr-name" value="${esc(group.name)}" required></div>
        <div class="field"><label for="gr-desc">Description</label><textarea id="gr-desc" rows="3">${esc(group.description)}</textarea></div>
        <div class="field photo-field">
          <span class="field-label" id="gr-photo-label">Image</span>
          <label class="btn light photo-pick" for="gr-file">Choose image</label>
          <input id="gr-file" class="photo-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-labelledby="gr-photo-label">
          <p class="field-error" id="gr-photo-note" role="alert"></p>
          <img id="gr-preview" alt="" ${group.image ? `src="${esc(group.image)}"` : 'hidden'}>
        </div>
        <p class="field-error" id="gr-error" role="alert" hidden></p>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Cancel</button>
          <button class="btn primary" type="submit">Save</button>
        </div>
      </form>`);
    const saveBtn = document.querySelector('#group-form button[type="submit"]');
    const currentImage = bindPhotoUpload('gr-file', 'gr-photo-note', 'gr-preview', saveBtn, group.image || '');
    document.getElementById('group-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('gr-error');
      err.hidden = true;
      const name = document.getElementById('gr-name').value.trim();
      if (!name) {
        err.hidden = false;
        err.textContent = 'Enter a group name.';
        return;
      }
      saveBtn.disabled = true;
      try {
        await currentImage.ready();
        const image = currentImage.url();
        if (image.startsWith('blob:') || image.startsWith('data:')) {
          err.hidden = false;
          err.textContent = 'Wait for the image to finish uploading.';
          saveBtn.disabled = false;
          return;
        }
        const payload = {
          name,
          description: document.getElementById('gr-desc').value.trim(),
          image,
        };
        if (group.id) await adminApi(`/api/groups/${group.id}`, { method: 'PATCH', body: payload });
        else await adminApi('/api/groups', { method: 'POST', body: payload });
        await refreshCatalog();
        closeModal();
        toast('Group saved');
        renderProjects();
      } catch (error) {
        err.hidden = false;
        err.textContent = error.message;
        saveBtn.disabled = false;
      }
    });
  }

  function editProject(id) {
    const groupId = currentGroupId();
    const found = id ? catalog.find((item) => item.id === id) : null;
    if (id && !found) return;
    const p = found || {
      id: '', groupId, name: '', image: '', description: '', address: '', developer: '', price: '', commissionRatio: '', status: 'active',
    };
    openModal(`
      <h3>${id ? 'Edit project' : 'New project'}</h3>
      <form id="proj-form" class="fields">
        <div class="field"><label for="pj-name">Name</label><input id="pj-name" value="${esc(p.name)}" required></div>
        <div class="form-2">
          <div class="field"><label for="pj-address">Address</label><input id="pj-address" value="${esc(p.address)}"></div>
          <div class="field"><label for="pj-developer">Developer</label><input id="pj-developer" value="${esc(p.developer)}"></div>
        </div>
        <div class="field photo-field">
          <span class="field-label" id="pj-photo-label">Photo</span>
          <label class="btn light photo-pick" for="pj-file">Choose photo</label>
          <input id="pj-file" class="photo-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-labelledby="pj-photo-label">
          <p class="field-error" id="pj-photo-note" role="alert"></p>
          <img id="pj-preview" alt="" ${p.image ? `src="${esc(p.image)}"` : 'hidden'}>
        </div>
        <div class="form-2">
          <div class="field"><label for="pj-price">Price (AED)</label><input id="pj-price" type="number" min="0" step="0.01" value="${p.price === '' ? '' : p.price}"></div>
          <div class="field"><label for="pj-ratio">Commission ratio (%)</label><input id="pj-ratio" type="number" min="0" max="100" step="0.01" value="${p.commissionRatio === '' ? '' : p.commissionRatio}"></div>
          <div class="field"><label for="pj-status">Status</label>
            <select id="pj-status">
              <option value="active" ${p.status === 'active' ? 'selected' : ''}>Available</option>
              <option value="inactive" ${p.status === 'inactive' ? 'selected' : ''}>Closed</option>
            </select>
          </div>
        </div>
        <p class="muted" id="pj-total"></p>
        <p class="field-error" id="pj-error" role="alert" hidden></p>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Cancel</button>
          <button class="btn primary" type="submit">Save</button>
        </div>
      </form>`);
    const updateTotal = () => {
      const price = Number(document.getElementById('pj-price').value);
      const ratio = Number(document.getElementById('pj-ratio').value);
      const amount = Number.isFinite(price) && Number.isFinite(ratio) ? (price * ratio) / 100 : 0;
      document.getElementById('pj-total').textContent = `Commission ${Store.money(amount)}`;
    };
    document.getElementById('pj-price').addEventListener('input', updateTotal);
    document.getElementById('pj-ratio').addEventListener('input', updateTotal);
    updateTotal();
    const saveBtn = document.querySelector('#proj-form button[type="submit"]');
    const currentImage = bindPhotoUpload('pj-file', 'pj-photo-note', 'pj-preview', saveBtn, p.image || '');
    document.getElementById('proj-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('pj-error');
      err.hidden = true;
      const price = document.getElementById('pj-price').value;
      const ratio = document.getElementById('pj-ratio').value;
      if (price === '' || Number(price) < 0) {
        err.hidden = false;
        err.textContent = 'Enter a valid price.';
        return;
      }
      if (ratio === '' || Number(ratio) < 0 || Number(ratio) > 100) {
        err.hidden = false;
        err.textContent = 'Commission ratio must be between 0 and 100.';
        return;
      }
      await currentImage.ready();
      const image = currentImage.url();
      if (image.startsWith('blob:') || image.startsWith('data:')) {
        err.hidden = false;
        err.textContent = 'Wait for the photo to finish uploading.';
        return;
      }
      const payload = {
        groupId: p.groupId || groupId,
        name: document.getElementById('pj-name').value.trim(),
        description: p.description || '',
        address: document.getElementById('pj-address').value.trim(),
        developer: document.getElementById('pj-developer').value.trim(),
        image,
        price,
        commissionRatio: ratio,
        status: document.getElementById('pj-status').value,
      };
      saveBtn.disabled = true;
      try {
        if (p.id) await adminApi(`/api/projects/${p.id}`, { method: 'PATCH', body: payload });
        else await adminApi('/api/projects', { method: 'POST', body: payload });
        await refreshCatalog();
        closeModal();
        toast('Project saved');
        renderProjects();
      } catch (error) {
        err.hidden = false;
        err.textContent = error.message;
        saveBtn.disabled = false;
      }
    });
  }

  function renderCashouts() {
    const tab = new URLSearchParams(location.search).get('status') || 'all';
    const list = cashoutRows.filter((c) => (tab === 'all' ? true : c.status === tab));
    const filters = [['all', 'All'], ['pending', 'Pending'], ['processing', 'Processing'], ['completed', 'Completed'], ['rejected', 'Rejected']];
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
        <thead><tr><th>User</th><th>Amount</th><th>Method</th><th>Destination</th><th>When</th><th>Status</th><th></th></tr></thead>
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

  function txType(type) {
    const labels = {
      welcome_bonus: 'Welcome bonus',
      demo_cash_in: 'Cash in',
      project_activation: 'Activation',
      daily_commission: 'Commission',
      project_purchase: 'Property',
      project_commission: 'Commission',
      cash_out: 'Cash out',
      refund: 'Refund',
      adjustment: 'Adjustment',
    };
    return labels[type] || String(type || '').replaceAll('_', ' ');
  }

  function renderTransactions() {
    pageEl().innerHTML = `
      <div class="page-head">
        <h2 class="serif">Transactions</h2>
      </div>
      <section class="card box"><div class="tablewrap"><table class="data-table">
        <thead><tr><th>User</th><th>Type</th><th>Activity</th><th>Amount</th><th>Status</th><th>When</th></tr></thead>
        <tbody>
          ${txRows.length ? txRows.map((row) => `<tr>
            <td>${esc(row.userName)}<div class="muted">${esc(row.mobile)}</div></td>
            <td>${esc(txType(row.type))}</td>
            <td>${esc(row.description)}</td>
            <td>${row.direction === 'debit' ? '−' : '+'}${Store.money(row.amount)}</td>
            <td>${badge(row.status)}</td>
            <td>${esc(String(row.createdAt || '').slice(0, 16).replace('T', ' '))}</td>
          </tr>`).join('') : `<tr><td colspan="6"><div class="empty-wrap">${emptyState('list', loadNote || 'No transactions yet', loadNote ? 'Refresh the page and try again.' : 'Wallet credits, activations, and cash outs show here.')}</div></td></tr>`}
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
        <thead><tr><th>User</th><th>Mobile</th><th>Referrer</th><th>Code</th><th>Joined</th><th>Status</th></tr></thead>
        <tbody>
          ${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${esc(r.mobile)}</td><td>${esc(r.referrerName || '—')}</td><td>${esc(r.referralCode || '—')}</td><td>${esc(r.date)}</td><td>${badge(r.status)}</td></tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-wrap">${emptyState('share', loadNote ? 'Could not load referrals' : (loading ? 'Loading referrals' : (q ? 'No referrals match' : 'No referrals yet')), loadNote || (loading ? 'Checking referral records.' : (q ? 'Try another name, code, or mobile.' : 'A referral is recorded when someone signs up with a member code.')))}</div>`}
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

  function safeRender() {
    const el = document.getElementById('page');
    if (!el) return;
    try {
      render();
    } catch (err) {
      el.innerHTML = `<div class="empty-wrap">${emptyState('share', 'This page could not be shown', err.message || 'Refresh and try again.')}</div>`;
    }
  }

  async function load() {
    const page = document.body.dataset.page;
    loadNote = '';
    loading = true;
    safeRender();
    try {
      if (page === 'dashboard' || page === 'users') {
        directory = (await adminApi('/api/users')).users || [];
      }
      if (page === 'dashboard' || page === 'projects') {
        catalog = (await adminApi('/api/projects?all=1')).projects || [];
      }
      if (page === 'projects') {
        groups = (await adminApi('/api/groups')).groups || [];
      }
      if (page === 'referrals') {
        const data = await adminApi('/api/referrals/all');
        referralRows = Array.isArray(data.referrals) ? data.referrals : [];
      }
      if (page === 'cashouts') {
        const tab = new URLSearchParams(location.search).get('status') || 'all';
        cashoutRows = (await adminApi(`/api/cashouts/all?status=${encodeURIComponent(tab)}`)).cashouts || [];
      }
      if (page === 'transactions') {
        txRows = (await adminApi('/api/wallet/all')).transactions || [];
      }
      if (page === 'settings') {
        platform = (await adminApi('/api/settings')).settings;
      }
    } catch (err) {
      loadNote = err.message || 'Could not load this page.';
    } finally {
      loading = false;
      safeRender();
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
      transactions: renderTransactions,
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
    if (action === 'user-sessions') openSessions(el.dataset.id, el.dataset.name);
    if (action === 'revoke-user-session') {
      adminApi(`/api/users/${encodeURIComponent(el.dataset.user)}/sessions/${encodeURIComponent(el.dataset.id)}`, { method: 'DELETE' })
        .then(() => {
          toast('Session revoked');
          const title = document.querySelector('#modal-root h3');
          openSessions(el.dataset.user, title ? title.textContent : '');
        })
        .catch((err) => toast(err.message));
    }
    if (action === 'user-filter') {
      userStatus = el.dataset.status || 'all';
      renderUsers();
    }
    if (action === 'edit-group') editGroup(el.dataset.id);
    if (action === 'delete-group') {
      openModal(`
        <h3>Delete group</h3>
        <p class="muted">Delete ${esc(el.dataset.name || 'this group')}? A group that still has projects cannot be deleted.</p>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Cancel</button>
          <button class="btn danger" type="button" data-action="confirm-delete-group" data-id="${esc(el.dataset.id)}">Delete</button>
        </div>`);
    }
    if (action === 'confirm-delete-group') {
      adminApi(`/api/groups/${el.dataset.id}`, { method: 'DELETE' }).then(() => {
        groups = groups.filter((item) => item.id !== el.dataset.id);
        closeModal();
        toast('Group deleted');
        renderProjects();
      }).catch((err) => toast(err.message));
    }
    if (action === 'edit-project') editProject(el.dataset.id);
    if (action === 'delete-project') {
      const id = el.dataset.id;
      const name = el.dataset.name || 'this project';
      openModal(`
        <h3>Delete project</h3>
        <p class="muted">Delete ${esc(name)}? A project that already has an order cannot be deleted.</p>
        <div class="modal-actions">
          <button class="btn light" type="button" data-dismiss>Cancel</button>
          <button class="btn danger" type="button" data-action="confirm-delete-project" data-id="${esc(id)}">Delete</button>
        </div>`);
    }
    if (action === 'confirm-delete-project') {
      adminApi(`/api/projects/${el.dataset.id}`, { method: 'DELETE' }).then(async () => {
        await refreshCatalog();
        closeModal();
        toast('Project deleted');
        renderProjects();
      }).catch((err) => toast(err.message));
    }
    if (action === 'toggle-project') {
      adminApi(`/api/projects/${el.dataset.id}/status`, {
        method: 'PATCH',
        body: { status: el.dataset.status },
      }).then(async () => {
        await refreshCatalog();
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
  Admin.load().catch((err) => toast(err.message));
}
