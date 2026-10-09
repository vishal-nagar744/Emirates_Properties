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
          <thead><tr><th>Name</th><th>Mobile</th><th>Balance</th><th>Joined</th><th>Status</th></tr></thead>
          <tbody>${users.length ? users.slice(0, 8).map((u) => `<tr>
            <td>${esc(u.fullName)}</td><td>${esc(u.mobile)}</td>
            <td>${Store.money(u.walletBalance)}</td><td>${esc(String(u.createdAt || '').slice(0, 10))}</td><td>${badge(u.accountStatus)}</td>
          </tr>`).join('') : `<tr><td colspan="5">${emptyState('users', 'No members yet', 'Accounts appear here after someone signs up.')}</td></tr>`}</tbody>
        </table></div>
      </section>`;
  }

  function renderUsers() {
    const qRaw = document.getElementById('user-q')?.value || '';
    const q = qRaw.toLowerCase();
    let users = directory;
    if (userStatus !== 'all') users = users.filter((u) => u.accountStatus === userStatus);
    if (q) users = users.filter((u) => `${u.fullName} ${u.mobile}`.toLowerCase().includes(q));
    const caret = document.activeElement && document.activeElement.id === 'user-q'
      ? document.activeElement.selectionStart
      : null;
    const filters = [['all', 'All'], ['active', 'Active'], ['pending', 'Pending'], ['blocked', 'Blocked'], ['suspended', 'Suspended']];
    pageEl().innerHTML = `
      <div class="page-head"><h2 class="serif">Users</h2></div>
      <div class="catalog-bar">
        <label class="search-bar page-search">
          ${searchIcon()}
          <input id="user-q" type="search" placeholder="Search name or mobile" aria-label="Search users" value="${esc(qRaw)}">
        </label>
        <div class="catalog-filters" role="group" aria-label="Filter users">
          ${filters.map(([id, label]) => `<button class="chip${userStatus === id ? ' active' : ''}" type="button" data-action="user-filter" data-status="${id}" aria-pressed="${userStatus === id}">${label}</button>`).join('')}
        </div>
      </div>
      <section class="card box">
        <div class="tablewrap"><table class="data-table">
          <thead><tr><th>Name</th><th>Mobile</th><th>Balance</th><th>Pending</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${users.length ? users.map((u) => `<tr class="order-row" tabindex="0" data-action="user" data-id="${esc(u.id)}">
              <td>${esc(u.fullName)}</td><td>${esc(u.mobile)}</td>
              <td>${Store.money(u.walletBalance)}</td><td>${Store.money(u.pendingCashOut)}</td>
              <td>${badge(u.accountStatus)}</td>
              <td class="row-actions">
                <button class="icon-btn" type="button" data-action="user-history" data-id="${esc(u.id)}" data-name="${esc(u.fullName)}" aria-label="Daily history"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l2.5 1.5"/></svg></button>
                <button class="btn light" type="button" data-action="user" data-id="${esc(u.id)}">Manage</button>
              </td>
            </tr>`).join('') : `<tr><td colspan="6">${emptyState('users', directory.length ? 'No users match' : 'No members yet', directory.length ? 'Try a different name, mobile, or status.' : 'Accounts appear here after someone signs up.')}</td></tr>`}
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

  function groupLockLabel(user) {
    const open = new Set(Array.isArray(user.unlockedGroupIds) ? user.unlockedGroupIds : []);
    const names = groups.filter((group) => !open.has(group.id)).map((group) => group.name);
    if (!names.length) return 'None locked';
    if (names.length <= 2) return names.join(', ');
    return `${names.length} groups locked`;
  }

  function setIsOpen(user, groupId, setNumber) {
    if (!user.setAccessSet) return Number(setNumber) === 1;
    const keys = Array.isArray(user.unlockedSetKeys) ? user.unlockedSetKeys : [];
    return keys.includes(`${groupId}:${setNumber}`);
  }

  function setLockLabel(user) {
    let locked = 0;
    groups.forEach((group) => {
      [1, 2, 3].forEach((setNumber) => {
        if (!setIsOpen(user, group.id, setNumber)) locked += 1;
      });
    });
    if (!locked) return 'None locked';
    if (locked === 1) return '1 set locked';
    return `${locked} sets locked`;
  }

  function bindLockPicker(rootSelector, onChange) {
    const picker = document.querySelector(rootSelector);
    if (!picker) return;
    const btn = picker.querySelector('.picker-btn');
    const menu = picker.querySelector('.group-menu');
    const label = picker.querySelector('.picker-label');
    const place = () => {
      const rect = btn.getBoundingClientRect();
      menu.hidden = false;
      menu.style.width = `${rect.width}px`;
      const height = menu.offsetHeight;
      const below = window.innerHeight - rect.bottom;
      const top = below < height + 12 && rect.top > height + 12 ? rect.top - height - 6 : rect.bottom + 6;
      menu.style.top = `${top}px`;
      menu.style.left = `${Math.max(8, rect.left)}px`;
    };
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (menu.hidden) {
        place();
        btn.setAttribute('aria-expanded', 'true');
      } else {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    menu.addEventListener('change', () => onChange(menu, label));
    if (!bindLockPicker.bound) {
      bindLockPicker.bound = true;
      document.addEventListener('click', (event) => {
        if (event.target.closest('.group-picker, .set-picker')) return;
        document.querySelectorAll('.group-menu').forEach((node) => { node.hidden = true; });
        document.querySelectorAll('.group-picker .picker-btn, .set-picker .picker-btn').forEach((node) => node.setAttribute('aria-expanded', 'false'));
      });
    }
  }

  function bindGroupPicker(userId) {
    bindLockPicker('.group-picker', async (menu, label) => {
      const lockedIds = new Set([...menu.querySelectorAll('input:checked')].map((input) => input.value));
      const groupIds = groups.filter((group) => !lockedIds.has(group.id)).map((group) => group.id);
      const previous = directory.find((row) => row.id === userId);
      label.textContent = groupLockLabel({ unlockedGroupIds: groupIds });
      try {
        const data = await adminApi(`/api/users/${encodeURIComponent(userId)}/groups`, {
          method: 'PATCH',
          body: { groupIds },
        });
        if (data.user) directory = directory.map((row) => (row.id === data.user.id ? data.user : row));
        toast('Groups updated');
      } catch (err) {
        if (previous) {
          const open = new Set(Array.isArray(previous.unlockedGroupIds) ? previous.unlockedGroupIds : []);
          menu.querySelectorAll('input').forEach((input) => {
            input.checked = !open.has(input.value);
          });
          label.textContent = groupLockLabel(previous);
        }
        toast(err.message);
      }
    });
  }

  function bindSetPicker(userId) {
    bindLockPicker('.set-picker', async (menu, label) => {
      const lockedKeys = new Set([...menu.querySelectorAll('input:checked')].map((input) => input.value));
      const setKeys = [];
      groups.forEach((group) => {
        [1, 2, 3].forEach((setNumber) => {
          const key = `${group.id}:${setNumber}`;
          if (!lockedKeys.has(key)) setKeys.push(key);
        });
      });
      const previous = directory.find((row) => row.id === userId);
      label.textContent = setLockLabel({ setAccessSet: true, unlockedSetKeys: setKeys });
      try {
        const data = await adminApi(`/api/users/${encodeURIComponent(userId)}/sets`, {
          method: 'PATCH',
          body: { setKeys },
        });
        if (data.user) directory = directory.map((row) => (row.id === data.user.id ? data.user : row));
        toast('Sets updated');
      } catch (err) {
        if (previous) {
          menu.querySelectorAll('input').forEach((input) => {
            const [groupId, rawSet] = String(input.value).split(':');
            input.checked = !setIsOpen(previous, groupId, Number(rawSet));
          });
          label.textContent = setLockLabel(previous);
        }
        toast(err.message);
      }
    });
  }

  function historyClock(iso) {
    if (!iso) return '';
    const when = new Date(iso);
    if (Number.isNaN(when.getTime())) return '';
    return when.toLocaleTimeString('en-AE', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dubai' });
  }

  function historyDayView(day) {
    if (!day) return '<p class="muted">No orders on this day.</p>';
    const groups = day.groups || [];
    const orders = groups.flatMap((group) => group.orders || []);
    const spentOf = (group) => (group.orders || []).reduce((sum, order) => sum + (Number(order.price) || 0), 0);
    const earnedOf = (group) => (group.orders || []).reduce((sum, order) => sum + (Number(order.commissionAmount) || 0), 0);
    const spent = groups.reduce((sum, group) => sum + (Number.isFinite(Number(group.spent)) ? Number(group.spent) : spentOf(group)), 0);
    const commission = groups.reduce((sum, group) => sum + (Number.isFinite(Number(group.commission)) ? Number(group.commission) : earnedOf(group)), 0);
    return `
      <dl class="stack-stats history-totals">
        <div class="stack-row"><span>Projects completed</span><b>${orders.length}</b></div>
        <div class="stack-row"><span>Price bought</span><b>${Store.money(spent)}</b></div>
        <div class="stack-row"><span>Commission earned</span><b>${Store.money(commission)}</b></div>
      </dl>
      ${groups.map((group) => `
        <article class="history-group">
          <div class="history-meta">
            <b>${esc(group.groupName)}</b>
            <span>${group.completed} of ${group.total}</span>
          </div>
          <p class="history-stop">${group.finished ? 'Finished this group' : `Stopped before ${esc(group.stoppedAt || 'the next project')}`}</p>
          <dl class="stack-stats">
            <div class="stack-row"><span>Price bought</span><b>${Store.money(Number.isFinite(Number(group.spent)) ? group.spent : spentOf(group))}</b></div>
            <div class="stack-row"><span>Commission earned</span><b>${Store.money(Number.isFinite(Number(group.commission)) ? group.commission : earnedOf(group))}</b></div>
          </dl>
          <ul class="history-orders">
            ${(group.orders || []).map((order) => `
              <li>
                <span><b>${esc(order.projectName)}</b><small>${esc(historyClock(order.createdAt))}</small></span>
                <span class="history-figures"><span>Bought ${Store.money(order.price)}</span><span>Earned ${Store.money(order.commissionAmount)}</span></span>
              </li>`).join('')}
          </ul>
        </article>`).join('')}`;
  }

  async function openUserHistory(id, name) {
    openModal(`<h3>Daily history</h3><p class="muted">${esc(name || 'User')}</p><p class="muted">Loading…</p>`);
    try {
      const data = await adminApi(`/api/users/${encodeURIComponent(id)}/history`);
      const days = Array.isArray(data.days) ? data.days : [];
      const byDate = new Map(days.map((day) => [day.date, day]));
      const latest = days[0] ? days[0].date : '';
      const earliest = days.length ? days[days.length - 1].date : '';
      openModal(`
        <h3>Daily history</h3>
        <p class="muted">${esc(name || 'User')}</p>
        <label class="field history-date" for="history-date">Date</label>
        <input id="history-date" type="date" value="${esc(latest)}" ${earliest ? `min="${esc(earliest)}" max="${esc(latest)}"` : ''}>
        <div id="history-body"></div>
        <div class="modal-actions"><button class="btn light" type="button" data-dismiss>Close</button></div>`);
      const input = document.getElementById('history-date');
      const body = document.getElementById('history-body');
      const paint = () => {
        if (!body) return;
        body.innerHTML = days.length ? historyDayView(byDate.get(input.value)) : '<p class="muted">No orders yet.</p>';
      };
      if (input) input.addEventListener('change', paint);
      paint();
    } catch (error) {
      openModal(`<h3>Daily history</h3><p>${esc(error.message)}</p><div class="modal-actions"><button class="btn light" type="button" data-dismiss>Close</button></div>`);
    }
  }

  function bindManageTabs(userId) {
    let groupId = '';
    let editing = '';
    let setNumber = 1;
    let mode = 'premium';
    let reward = 'cash';
    const account = document.getElementById('manage-account');
    const premium = document.getElementById('manage-premium');
    const form = document.getElementById('premium-form');
    const meta = document.getElementById('premium-meta');
    const list = document.getElementById('premium-list');
    const err = document.getElementById('prem-error');
    document.querySelectorAll('[data-manage-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        const on = button.dataset.manageTab === 'premium';
        account.hidden = on;
        premium.hidden = !on;
        document.querySelectorAll('[data-manage-tab]').forEach((item) => {
          const active = item === button;
          item.classList.toggle('active', active);
          item.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      });
    });
    document.querySelectorAll('[data-premium-set]').forEach((button) => {
      button.addEventListener('click', () => {
        setNumber = Number(button.dataset.premiumSet) || 1;
        document.querySelectorAll('[data-premium-set]').forEach((item) => {
          item.classList.toggle('active', item === button);
        });
      });
    });
    const paintSets = () => {
      document.querySelectorAll('[data-premium-set]').forEach((item) => {
        item.classList.toggle('active', Number(item.dataset.premiumSet) === setNumber);
      });
    };
    const paintKind = () => {
      const fortune = mode === 'fortune';
      const cash = fortune && reward === 'cash';
      document.querySelectorAll('[data-prem-kind]').forEach((item) => {
        item.classList.toggle('active', item.dataset.premKind === mode);
      });
      document.querySelectorAll('[data-prem-reward]').forEach((item) => {
        item.classList.toggle('active', item.dataset.premReward === reward);
      });
      const rewardWrap = document.getElementById('prem-reward-wrap');
      const nameWrap = document.getElementById('prem-name-wrap');
      const ratioWrap = document.getElementById('prem-ratio-wrap');
      if (rewardWrap) rewardWrap.hidden = !fortune;
      if (nameWrap) nameWrap.hidden = cash;
      if (ratioWrap) ratioWrap.hidden = cash;
      const priceLabel = document.querySelector('label[for="prem-price"]');
      if (priceLabel) priceLabel.textContent = cash ? 'Amount (AED)' : 'Price (AED)';
      const save = document.getElementById('prem-save');
      if (save) save.textContent = editing
        ? (fortune ? 'Save fortune box' : 'Save premium')
        : (fortune ? 'Add fortune box' : 'Add premium');
    };
    document.querySelectorAll('[data-prem-kind]').forEach((button) => {
      button.addEventListener('click', () => {
        mode = button.dataset.premKind === 'fortune' ? 'fortune' : 'premium';
        paintKind();
      });
    });
    document.querySelectorAll('[data-prem-reward]').forEach((button) => {
      button.addEventListener('click', () => {
        reward = button.dataset.premReward === 'project' ? 'project' : 'cash';
        paintKind();
      });
    });
    function premiumNote(row) {
      if (row.kind === 'fortune' && row.reward === 'cash') {
        return `Fortune box · Cash · Set ${row.setNumber} · Position ${row.position} · ${Store.money(row.price)}`;
      }
      if (row.kind === 'fortune') {
        return `Fortune box · Set ${row.setNumber} · Position ${row.position} · ${Store.money(row.price)} · ${esc(row.commissionRatio)}%`;
      }
      return `Set ${row.setNumber} · Position ${row.position} · ${Store.money(row.price)} · ${esc(row.commissionRatio)}%`;
    }
    async function load(nextGroup) {
      groupId = nextGroup;
      editing = '';
      mode = 'premium';
      reward = 'cash';
      paintKind();
      document.querySelectorAll('[data-premium-group]').forEach((button) => {
        button.classList.toggle('active', button.dataset.premiumGroup === groupId);
      });
      const group = groups.find((item) => item.id === groupId);
      meta.textContent = group ? `${group.projectCount} projects · 3 sets` : '';
      form.hidden = false;
      const data = await adminApi(`/api/users/${encodeURIComponent(userId)}/premiums?groupId=${encodeURIComponent(groupId)}`);
      const rows = data.premiums || [];
      list.innerHTML = rows.length ? rows.map((row) => `
        <article class="premium-row">
          <div>
            <b>${esc(row.kind === 'fortune' && row.reward === 'cash' ? 'Cash reward' : row.name)}</b>
            <small>${premiumNote(row)}</small>
          </div>
          <button class="btn light" type="button" data-premium-edit="${esc(row.id)}">Edit</button>
          <button class="btn light" type="button" data-premium-remove="${esc(row.id)}">Remove</button>
        </article>`).join('') : '<p class="muted">No premium or fortune box for this member in this group.</p>';
      list.querySelectorAll('[data-premium-edit]').forEach((button) => {
        button.addEventListener('click', () => {
          const row = rows.find((item) => item.id === button.dataset.premiumEdit);
          if (!row) return;
          editing = row.id;
          mode = row.kind === 'fortune' ? 'fortune' : 'premium';
          reward = row.reward === 'project' ? 'project' : 'cash';
          setNumber = Number(row.setNumber) || 1;
          document.getElementById('prem-position').value = row.position;
          document.getElementById('prem-name').value = row.reward === 'cash' ? '' : row.name;
          document.getElementById('prem-price').value = row.price;
          document.getElementById('prem-ratio').value = row.commissionRatio;
          paintSets();
          paintKind();
        });
      });
      list.querySelectorAll('[data-premium-remove]').forEach((button) => {
        button.addEventListener('click', () => {
          adminApi(`/api/users/${encodeURIComponent(userId)}/premiums/${encodeURIComponent(button.dataset.premiumRemove)}`, { method: 'DELETE' })
            .then(() => {
              toast('Premium removed');
              return load(groupId);
            })
            .catch((error) => toast(error.message));
        });
      });
    }
    document.querySelectorAll('[data-premium-group]').forEach((button) => {
      button.addEventListener('click', () => {
        load(button.dataset.premiumGroup).catch((error) => toast(error.message));
      });
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true;
      if (!groupId) {
        err.hidden = false;
        err.textContent = 'Choose a group.';
        return;
      }
      const cash = mode === 'fortune' && reward === 'cash';
      const payload = {
        groupId,
        setNumber,
        position: Number(document.getElementById('prem-position').value),
        name: cash ? 'Cash reward' : document.getElementById('prem-name').value.trim(),
        price: document.getElementById('prem-price').value,
        commissionRatio: cash ? 0 : document.getElementById('prem-ratio').value,
        kind: mode,
        reward: mode === 'fortune' ? reward : 'project',
      };
      const fortune = mode === 'fortune';
      try {
        if (editing) {
          await adminApi(`/api/users/${encodeURIComponent(userId)}/premiums/${encodeURIComponent(editing)}`, { method: 'PATCH', body: payload });
          toast(fortune ? 'Fortune box updated' : 'Premium updated');
        } else {
          await adminApi(`/api/users/${encodeURIComponent(userId)}/premiums`, { method: 'POST', body: payload });
          toast(fortune ? 'Fortune box added' : 'Premium added');
        }
        editing = '';
        mode = 'premium';
        reward = 'cash';
        document.getElementById('prem-name').value = '';
        document.getElementById('prem-price').value = '';
        document.getElementById('prem-ratio').value = '';
        document.getElementById('prem-position').value = '1';
        setNumber = 1;
        paintSets();
        paintKind();
        await load(groupId);
      } catch (error) {
        err.hidden = false;
        err.textContent = error.message;
      }
    });
  }

  function openUser(id) {
    const u = directory.find((x) => x.id === id);
    if (!u) return;
    openModal(`
      <div class="modal-title">
        <h3>${esc(u.fullName)}</h3>
        <button class="icon-btn" type="button" data-action="user-sessions" data-id="${esc(u.id)}" data-name="${esc(u.fullName)}" aria-label="View sessions"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg></button>
      </div>
      <p class="muted">${esc(u.mobile)}</p>
      <div class="set-tabs manage-tabs" role="tablist" aria-label="Manage">
        <button class="set-tab active" type="button" data-manage-tab="account" aria-selected="true">Account</button>
        <button class="set-tab" type="button" data-manage-tab="premium" aria-selected="false">Premium</button>
      </div>
      <div id="manage-account">
      <dl class="stack-stats">
        <div class="stack-row"><span>Balance</span><b>${Store.money(u.walletBalance)}</b></div>
        <div class="stack-row"><span>Hold balance</span><b>${Store.money(u.holdBalance)}</b></div>
        <div class="stack-row"><span>Trial balance</span><b>${Store.money(u.trialBalance)}</b></div>
        <div class="stack-row"><span>Pending cash out</span><b>${Store.money(u.pendingCashOut)}</b></div>
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
      <div class="field group-locks">
        <span class="field-label" id="group-lock-label">Locked groups</span>
        ${groups.length ? `
          <div class="group-picker">
            <button class="picker-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="group-lock-label">
              <span class="picker-label">${esc(groupLockLabel(u))}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="group-menu" role="group" aria-label="Locked groups" hidden>
              ${groups.map((group) => {
                const open = Array.isArray(u.unlockedGroupIds) && u.unlockedGroupIds.includes(group.id);
                return `<label class="group-option"><input type="checkbox" value="${esc(group.id)}"${open ? '' : ' checked'}><span>${esc(group.name)}</span></label>`;
              }).join('')}
            </div>
          </div>` : '<p class="muted">No groups yet.</p>'}
      </div>
      <div class="field group-locks">
        <span class="field-label" id="set-lock-label">Locked sets</span>
        ${groups.length ? `
          <div class="set-picker group-picker">
            <button class="picker-btn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="set-lock-label">
              <span class="picker-label">${esc(setLockLabel(u))}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <div class="group-menu" role="group" aria-label="Locked sets" hidden>
              ${groups.map((group) => [1, 2, 3].map((setNumber) => {
                const open = setIsOpen(u, group.id, setNumber);
                return `<label class="group-option"><input type="checkbox" value="${esc(group.id)}:${setNumber}"${open ? '' : ' checked'}><span>${esc(group.name)} · Set ${setNumber}</span></label>`;
              }).join('')).join('')}
            </div>
          </div>` : '<p class="muted">No groups yet.</p>'}
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
      </form>
      </div>
      <div id="manage-premium" hidden>
        <div class="premium-groups" id="premium-groups">
          ${groups.map((group) => `<button class="chip" type="button" data-premium-group="${esc(group.id)}">${esc(group.name)}</button>`).join('') || '<p class="muted">No groups yet.</p>'}
        </div>
        <p class="muted" id="premium-meta"></p>
        <form id="premium-form" class="fields" hidden>
          <div class="field">
            <span class="field-label">Add</span>
            <div class="type-picks" id="prem-kind">
              <button class="chip active" type="button" data-prem-kind="premium">Premium project</button>
              <button class="chip" type="button" data-prem-kind="fortune">Fortune box</button>
            </div>
          </div>
          <div class="field" id="prem-reward-wrap" hidden>
            <span class="field-label">Inside the box</span>
            <div class="type-picks">
              <button class="chip active" type="button" data-prem-reward="cash">Cash</button>
              <button class="chip" type="button" data-prem-reward="project">Premium project</button>
            </div>
          </div>
          <div class="field">
            <span class="field-label">Set</span>
            <div class="type-picks" id="premium-sets">
              <button class="chip active" type="button" data-premium-set="1">Set 1</button>
              <button class="chip" type="button" data-premium-set="2">Set 2</button>
              <button class="chip" type="button" data-premium-set="3">Set 3</button>
            </div>
          </div>
          <div class="form-2">
            <div class="field"><label for="prem-position">Position</label><input id="prem-position" type="number" min="1" step="1" value="1"></div>
            <div class="field" id="prem-name-wrap"><label for="prem-name">Name</label><input id="prem-name"></div>
          </div>
          <div class="form-2">
            <div class="field"><label for="prem-price">Price (AED)</label><input id="prem-price" type="number" min="0" step="0.01"></div>
            <div class="field" id="prem-ratio-wrap"><label for="prem-ratio">Commission ratio (%)</label><input id="prem-ratio" type="number" min="0" max="100" step="0.01"></div>
          </div>
          <p class="field-error" id="prem-error" role="alert" hidden></p>
          <div class="modal-actions">
            <button class="btn light" type="button" data-dismiss>Close</button>
            <button class="btn primary" type="submit" id="prem-save">Add premium</button>
          </div>
        </form>
        <div id="premium-list"></div>
      </div>`);
    bindGroupPicker(id);
    bindSetPicker(id);
    bindManageTabs(id);
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
    groups = (groupData.groups || []).sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
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
    const setNumber = currentSet();
    const list = catalog
      .filter((project) => project.groupId === groupId && setNumberOf(project) === setNumber)
      .sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0) || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
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
      <div class="set-tabs" role="tablist" aria-label="Sets">
        ${[1, 2, 3].map((number) => {
          const count = catalog.filter((project) => project.groupId === groupId && setNumberOf(project) === number).length;
          return `<a class="set-tab${number === setNumber ? ' active' : ''}" role="tab" aria-selected="${number === setNumber}" href="projects.html?group=${esc(groupId)}&set=${number}">Set ${number}<small>${count}</small></a>`;
        }).join('')}
      </div>
      ${list.length ? `<div class="admin-project-grid">
        ${list.map((p) => `
          <article class="card admin-project">
            <div class="admin-project-body">
              <h3>${esc(p.name)}</h3>
              <dl class="admin-project-stats">
                <div><dt>Price</dt><dd>${Store.money(p.price)}</dd></div>
                <div><dt>Ratio</dt><dd>${esc(p.commissionRatio)}%</dd></div>
              </dl>
              <div class="admin-project-actions">
                <button class="btn light" type="button" data-action="edit-project" data-id="${esc(p.id)}">Edit</button>
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

  function currentSet() {
    const value = Number(new URLSearchParams(location.search).get('set'));
    return value === 2 || value === 3 ? value : 1;
  }

  function setNumberOf(project) {
    const value = Number(project && project.setNumber);
    return value === 2 || value === 3 ? value : 1;
  }

  function editProject(id) {
    const groupId = currentGroupId();
    const found = id ? catalog.find((item) => item.id === id) : null;
    if (id && !found) return;
    const p = found || {
      id: '', groupId, name: '', price: '', commissionRatio: '', setNumber: currentSet(),
    };
    const startingSet = setNumberOf(p);
    openModal(`
      <h3>${id ? 'Edit project' : 'New project'}</h3>
      <form id="proj-form" class="fields">
        <div class="field"><label for="pj-name">Name</label><input id="pj-name" value="${esc(p.name)}" required></div>
        <div class="field">
          <span class="field-label" id="pj-set-label">Set</span>
          <div class="type-picks" role="radiogroup" aria-labelledby="pj-set-label">
            ${[1, 2, 3].map((number) => `<button class="chip${startingSet === number ? ' active' : ''}" type="button" data-set-number="${number}" aria-pressed="${startingSet === number ? 'true' : 'false'}">Set ${number}</button>`).join('')}
          </div>
        </div>
        <div class="field"><label for="pj-price">Price (AED)</label><input id="pj-price" type="number" min="0" step="0.01" value="${p.price === '' ? '' : p.price}"></div>
        <div class="field"><label for="pj-ratio">Commission ratio (%)</label><input id="pj-ratio" type="number" min="0" max="100" step="0.01" value="${p.commissionRatio === '' ? '' : p.commissionRatio}"></div>
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
      document.getElementById('pj-total').textContent = `Earn commission ${Store.money(amount)}`;
    };
    document.getElementById('pj-price').addEventListener('input', updateTotal);
    document.getElementById('pj-ratio').addEventListener('input', updateTotal);
    updateTotal();
    let setNumber = startingSet;
    document.querySelectorAll('[data-set-number]').forEach((button) => {
      button.addEventListener('click', () => {
        setNumber = Number(button.dataset.setNumber) || 1;
        document.querySelectorAll('[data-set-number]').forEach((item) => {
          const on = item === button;
          item.classList.toggle('active', on);
          item.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      });
    });
    const saveBtn = document.querySelector('#proj-form button[type="submit"]');
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
      const payload = {
        groupId: p.groupId || groupId,
        name: document.getElementById('pj-name').value.trim(),
        price,
        commissionRatio: ratio,
        setNumber,
        status: 'active',
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
      trialBonusAmount: 0,
      minCashOutAmount: 500,
      supportTelegramUsername: '',
      supportWhatsappNumber: '',
      demoCashInUSDTAddress: '',
      bankPayoutEnabled: true,
      cryptoPayoutEnabled: false,
      about: {},
      terms: {},
    };
    const about = s.about || {};
    const terms = s.terms || {};
    const termSections = Array.isArray(terms.sections) && terms.sections.length ? terms.sections : [{ title: '', paragraphs: [''] }];
    pageEl().innerHTML = `
      <div class="page-head"><h2 class="serif">Settings</h2></div>
      ${loadNote ? `<div class="empty-wrap">${emptyState('gear', 'Could not load settings', loadNote)}</div>` : `
      <form id="settings-form" class="card box fields settings-wide">
        <div class="field"><label for="set-name">Platform name</label><input id="set-name" value="${esc(s.platformName)}"></div>
        <div class="form-2">
          <div class="field"><label for="set-bonus">Welcome bonus (AED)</label><input id="set-bonus" type="number" min="0" step="0.01" value="${s.welcomeBonusAmount}"></div>
          <div class="field"><label for="set-trial">Trial bonus (AED)</label><input id="set-trial" type="number" min="0" step="0.01" value="${s.trialBonusAmount || 0}"></div>
          <div class="field"><label for="set-min">Minimum cash out (AED)</label><input id="set-min" type="number" value="${s.minCashOutAmount}"></div>
        </div>
        <div class="form-2">
          <div class="field"><label for="set-tg">Telegram username</label><input id="set-tg" value="${esc(s.supportTelegramUsername)}"></div>
          <div class="field"><label for="set-wa">WhatsApp number</label><input id="set-wa" value="${esc(s.supportWhatsappNumber || '')}" placeholder="9715XXXXXXXX" inputmode="tel"></div>
          <div class="field"><label for="set-addr">Cash-in address</label><input id="set-addr" value="${esc(s.demoCashInUSDTAddress)}"></div>
        </div>
        <fieldset class="payout-kinds">
          <legend>Active payout accounts</legend>
          <label class="check-line"><input id="set-bank" type="checkbox"${s.bankPayoutEnabled !== false ? ' checked' : ''}> Bank account</label>
          <label class="check-line"><input id="set-crypto" type="checkbox"${s.cryptoPayoutEnabled === true ? ' checked' : ''}> Crypto</label>
        </fieldset>

        <h3 class="settings-block">About page</h3>
        <div class="field"><label for="about-tagline">Tagline</label><input id="about-tagline" value="${esc(about.tagline || '')}"></div>
        <div class="field"><label for="about-lead">Lead</label><textarea id="about-lead" rows="3">${esc(about.lead || '')}</textarea></div>
        <div class="field"><label for="about-points">About points (blank line between points)</label><textarea id="about-points" rows="8">${esc((about.points || []).join('\n\n'))}</textarea></div>
        <div class="field"><label for="about-close">Closing line</label><input id="about-close" value="${esc(about.close || '')}"></div>
        <div class="field"><label for="deposit-points">About deposit (one point per line)</label><textarea id="deposit-points" rows="6">${esc((about.depositPoints || []).join('\n'))}</textarea></div>

        <h3 class="settings-block">Terms &amp; conditions</h3>
        <div class="form-2">
          <div class="field"><label for="terms-date">Effective date</label><input id="terms-date" value="${esc(terms.effectiveDate || '')}"></div>
          <div class="field"><label for="terms-company">Company</label><input id="terms-company" value="${esc(terms.company || '')}"></div>
          <div class="field"><label for="terms-site">Website</label><input id="terms-site" value="${esc(terms.website || '')}"></div>
          <div class="field"><label for="terms-law">Jurisdiction</label><input id="terms-law" value="${esc(terms.jurisdiction || '')}"></div>
        </div>
        <div id="terms-sections">${termSections.map((section, index) => `
          <div class="term-edit" data-term-index="${index}">
            <div class="field"><label>Section ${index + 1} title</label><input class="term-title" value="${esc(section.title || '')}"></div>
            <div class="field"><label>Section ${index + 1} body</label><textarea class="term-body" rows="5">${esc((section.paragraphs || []).join('\n\n'))}</textarea></div>
          </div>`).join('')}
        </div>
        <button class="btn light" type="button" id="add-term-section">Add section</button>

        <div class="settings-actions">
          <button class="btn primary" type="submit">Save settings</button>
        </div>
      </form>`}`;
    const form = document.getElementById('settings-form');
    if (!form) return;
    document.getElementById('add-term-section')?.addEventListener('click', () => {
      const wrap = document.getElementById('terms-sections');
      const index = wrap.querySelectorAll('.term-edit').length;
      const node = document.createElement('div');
      node.className = 'term-edit';
      node.dataset.termIndex = String(index);
      node.innerHTML = `
        <div class="field"><label>Section ${index + 1} title</label><input class="term-title" value=""></div>
        <div class="field"><label>Section ${index + 1} body</label><textarea class="term-body" rows="5"></textarea></div>`;
      wrap.appendChild(node);
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const termTitles = [...form.querySelectorAll('.term-title')].map((input) => input.value.trim());
      const termBodies = [...form.querySelectorAll('.term-body')].map((input) => input.value);
      try {
        const data = await adminApi('/api/settings', {
          method: 'PATCH',
          body: {
            platformName: document.getElementById('set-name').value.trim(),
            welcomeBonusAmount: document.getElementById('set-bonus').value,
            trialBonusAmount: document.getElementById('set-trial').value,
            minCashOutAmount: document.getElementById('set-min').value,
            supportTelegramUsername: document.getElementById('set-tg').value.trim(),
            supportWhatsappNumber: document.getElementById('set-wa').value.trim(),
            demoCashInUSDTAddress: document.getElementById('set-addr').value.trim(),
            bankPayoutEnabled: document.getElementById('set-bank').checked,
            cryptoPayoutEnabled: document.getElementById('set-crypto').checked,
            about: {
              tagline: document.getElementById('about-tagline').value.trim(),
              lead: document.getElementById('about-lead').value.trim(),
              close: document.getElementById('about-close').value.trim(),
              points: document.getElementById('about-points').value.split(/\n\s*\n/).map((line) => line.trim()).filter(Boolean),
              depositPoints: document.getElementById('deposit-points').value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
            },
            terms: {
              effectiveDate: document.getElementById('terms-date').value.trim(),
              company: document.getElementById('terms-company').value.trim(),
              website: document.getElementById('terms-site').value.trim(),
              jurisdiction: document.getElementById('terms-law').value.trim(),
              sections: termTitles.map((title, index) => ({
                title,
                paragraphs: termBodies[index].split(/\n\s*\n/).map((line) => line.trim()).filter(Boolean),
              })).filter((section) => section.title),
            },
          },
        });
        platform = data.settings;
        toast('Settings saved');
        renderSettings();
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
      if (page === 'users' || page === 'projects') {
        groups = ((await adminApi('/api/groups')).groups || [])
          .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
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
    if (action === 'user-history') openUserHistory(el.dataset.id, el.dataset.name);
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
