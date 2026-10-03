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
    bankPayoutEnabled: true,
    cryptoPayoutEnabled: false,
  };
  let loadError = '';
  let premiumAfterOrder = null;

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
    const slides = groupsCache.map((group, index) => {
      const locked = groupLocked(group);
      const media = group.image ? `<img src="${esc(group.image)}" alt="" loading="lazy">` : `<img src="../assets/images/dubai-hero.jpg" alt="" loading="lazy">`;
      const mark = locked ? `<span class="lock-mark">${lockIcon()}</span>` : '';
      const lockNote = locked ? ` · ${unlockNote(group)}` : (group.isTrial ? ' · Trial' : '');
      const copy = `<span class="dubai-slide-copy"><small>${group.projectCount} project${group.projectCount === 1 ? '' : 's'}${lockNote}</small><strong>${esc(group.name)}</strong></span>`;
      if (locked) return `<article class="dubai-slide is-locked" data-index="${index}">${media}${mark}${copy}</article>`;
      return `<a class="dubai-slide" href="projects.html?group=${esc(group.id)}" data-index="${index}">${media}${copy}</a>`;
    }).join('');
    pageEl().innerHTML = `
      ${accountNote()}
      <section class="welcome-banner desk-welcome">
        <h1 class="serif">${greeting()}.</h1>
        <div class="hero-ctas">
          <a class="btn primary" href="projects.html">Explore projects</a>
          <a class="btn light" href="profile.html">View account</a>
        </div>
      </section>
      <section class="dubai-hero" aria-label="Dubai projects">
        <img src="../assets/images/dubai-hero.jpg" alt="Dubai Marina waterfront in late afternoon light">
        <div class="dubai-hero-copy">
          <p class="smallcaps">Dubai</p>
          <h1 class="serif">${greeting()}.</h1>
          <p>Browse project groups along the marina, downtown, and the palm.</p>
          <form class="dubai-search" action="projects.html" method="get">
            <input type="search" name="q" placeholder="Search groups" aria-label="Search groups" autocomplete="off">
            <button type="submit" aria-label="Search groups">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16.5 20 20.5"/></svg>
            </button>
          </form>
        </div>
      </section>
      ${groupsCache.length ? `
      <section class="dubai-slider" aria-roledescription="carousel" aria-label="Project groups">
        <div class="boxhead">
          <h3>Project groups</h3>
          <div class="slider-nav">
            <button class="icon-btn" type="button" id="slide-prev" aria-label="Previous group"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg></button>
            <button class="icon-btn" type="button" id="slide-next" aria-label="Next group"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg></button>
          </div>
        </div>
        <div class="dubai-track" id="dubai-track" tabindex="0">${slides}</div>
        <div class="dubai-dots" id="dubai-dots" role="tablist" aria-label="Group slides"></div>
      </section>` : ''}
      <div class="kpis">
        ${kpi('Wallet balance', Store.money(wallet), 'Available', 'profile.html')}
        ${kpi('Hold balance', Store.money(Store.user().holdBalance), 'Group in progress', 'profile.html')}
        ${kpi("Today's commission", Store.money(todayCommission), 'Credited today')}
        ${kpi('Total commission', Store.money(totalCommission), 'All completed credits')}
        ${kpi('Orders', String(ordersCache.length), 'Submitted orders', 'orders.html')}
      </div>
      <section class="card box">
        <div class="boxhead"><h3>Your orders</h3><a class="auth-link" href="orders.html">All orders</a></div>
        ${ordersCache.length ? ordersCache.slice(0, 3).map(activeCard).join('') : emptyState('grid', 'No orders yet', 'Open a project group and submit an order.')}
      </section>`;
    initDubaiSlider();
  }

  function initDubaiSlider() {
    const track = document.getElementById('dubai-track');
    const dots = document.getElementById('dubai-dots');
    if (!track || !dots) return;
    const slides = [...track.querySelectorAll('.dubai-slide')];
    if (!slides.length) return;
    dots.innerHTML = slides.map((_, index) => (
      `<button type="button" aria-label="Show group ${index + 1}"${index === 0 ? ' aria-current="true"' : ''}></button>`
    )).join('');
    const buttons = [...dots.querySelectorAll('button')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function currentIndex() {
      const left = track.scrollLeft;
      let best = 0;
      let gap = Infinity;
      slides.forEach((slide, index) => {
        const delta = Math.abs(slide.offsetLeft - left);
        if (delta < gap) {
          gap = delta;
          best = index;
        }
      });
      return best;
    }

    function mark() {
      const index = currentIndex();
      buttons.forEach((button, i) => {
        if (i === index) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
    }

    function go(index) {
      const slide = slides[(index + slides.length) % slides.length];
      track.scrollTo({ left: slide.offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
    }

    dots.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      go(buttons.indexOf(button));
    });
    const prev = document.getElementById('slide-prev');
    const next = document.getElementById('slide-next');
    if (prev) prev.addEventListener('click', () => go(currentIndex() - 1));
    if (next) next.addEventListener('click', () => go(currentIndex() + 1));
    track.addEventListener('scroll', () => window.requestAnimationFrame(mark), { passive: true });
    track.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); go(currentIndex() + 1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(currentIndex() - 1); }
    });
    if (!reduced && slides.length > 1) {
      let timer = window.setInterval(() => go(currentIndex() + 1), 5000);
      const pause = () => { window.clearInterval(timer); timer = 0; };
      const resume = () => { if (!timer) timer = window.setInterval(() => go(currentIndex() + 1), 5000); };
      track.addEventListener('mouseenter', pause);
      track.addEventListener('mouseleave', resume);
      track.addEventListener('focusin', pause);
      track.addEventListener('focusout', resume);
      track.addEventListener('touchstart', pause, { passive: true });
      track.addEventListener('touchend', resume, { passive: true });
    }
  }

  function typeLabel(type) {
    const labels = {
      welcome_bonus: 'Welcome bonus',
      demo_cash_in: 'Cash in',
      project_activation: 'Activation',
      daily_commission: 'Commission',
      trial_bonus: 'Trial bonus',
      trial_reset: 'Trial reset',
      hold_release: 'Hold released',
      project_purchase: 'Property',
      project_commission: 'Commission',
      cash_out: 'Cash out',
      refund: 'Refund',
      adjustment: 'Adjustment',
    };
    return labels[type] || String(type || '').replaceAll('_', ' ');
  }

  function kpi(label, value, hint, href) {
    const inner = `<small>${label}</small><b>${value}</b><span>${hint}</span>`;
    if (!href) return `<div class="card kpi">${inner}</div>`;
    return `<a class="card kpi" href="${esc(href)}">${inner}</a>`;
  }

  function placeLabel(row) {
    const group = row && row.groupName ? String(row.groupName) : '';
    const project = row && row.projectName ? String(row.projectName) : '';
    if (group && project) return `${group} · ${project}`;
    return project || group;
  }

  function activeCard(order) {
    return `
      <a class="order-line" href="orders.html?id=${esc(order.id)}">
        ${order.image ? `<img src="${esc(order.image)}" alt="">` : '<span class="order-line-ph" aria-hidden="true"></span>'}
        <span class="order-line-copy">
          <strong>${esc(placeLabel(order))}</strong>
          <small>${esc(String(order.createdAt || '').slice(0, 10))}</small>
        </span>
        <span class="order-line-meta">
          <b>${Store.money(order.price)}</b>
          <span>${Store.money(order.commissionAmount)}</span>
        </span>
        ${badge(order.status)}
      </a>`;
  }

  function renderProjects() {
    const groupId = new URLSearchParams(location.search).get('group') || '';
    if (!groupId) {
      setBreadcrumb([
        { href: 'dashboard.html', label: 'Workspace' },
        { label: 'Projects' },
      ]);
      const query = new URLSearchParams(location.search).get('q') || '';
      pageEl().innerHTML = `
        <div class="page-head"><h2 class="serif">Projects</h2></div>
        ${groupsCache.length ? `
        <div class="catalog-bar">
          <label class="search-bar page-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16.5 20 20.5"/></svg>
            <input id="project-search" type="search" placeholder="Search groups" aria-label="Search groups" value="${esc(query)}">
          </label>
          <div class="catalog-tools">
            <div class="catalog-filters" id="project-filters" role="group" aria-label="Filter groups">
              <button class="chip active" type="button" data-filter="all" aria-pressed="true">All</button>
              <button class="chip" type="button" data-filter="trial" aria-pressed="false">Trial</button>
            </div>
            <select id="project-sort" class="project-sort" aria-label="Sort groups">
              <option value="oldest">Oldest first</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        <div class="grid-4" id="project-grid">
          ${groupsCache.map(groupCard).join('')}
        </div>
        <div class="empty-state" id="projects-empty" hidden>${navIcon('grid')}<b>No groups match</b><p>Try another search.</p></div>` : emptyState('grid', loadError || 'No project groups yet', loadError ? 'Refresh the page and try again.' : 'Groups added by the team will appear here.')}`;
      initCatalog('project-search', 'project-grid', 'project-filters');
      const sort = document.getElementById('project-sort');
      const grid = document.getElementById('project-grid');
      if (sort && grid) {
        sort.addEventListener('change', () => {
          const cards = [...grid.querySelectorAll('.property-card')];
          cards.sort((a, b) => (
            sort.value === 'name'
              ? String(a.dataset.name || '').localeCompare(String(b.dataset.name || ''))
              : Number(a.dataset.order) - Number(b.dataset.order)
          ));
          cards.forEach((card) => grid.appendChild(card));
        });
      }
      return;
    }
    const group = groupsCache.find((item) => item.id === groupId);
    setBreadcrumb([
      { href: 'dashboard.html', label: 'Workspace' },
      { href: 'projects.html', label: 'Projects' },
      { label: group ? group.name : 'Group' },
    ]);
    pageEl().innerHTML = `
      ${accountNote()}
      <div class="offer-wrap">
        <a class="icon-btn back-btn" href="projects.html" aria-label="Back to projects"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg></a>
        ${offerCard(group)}
      </div>`;
    if (group && !groupLocked(group)) maybePremiumNotice(nextOffer(catalog));
  }

  function offerSequence(projects) {
    const priceOrder = (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)
      || String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    const normal = projects.filter((project) => project.projectType !== 'premium').sort(priceOrder);
    const premium = projects.filter((project) => project.projectType === 'premium').sort(priceOrder);
    if (!premium.length) return normal;
    if (!normal.length) return premium;
    const stride = Math.floor(normal.length / premium.length);
    const every = stride > 1 && stride * premium.length >= normal.length ? stride - 1 : Math.max(stride, 1);
    const sequence = [];
    let normalIndex = 0;
    let premiumIndex = 0;
    while (normalIndex < normal.length || premiumIndex < premium.length) {
      const take = Math.min(every, normal.length - normalIndex);
      for (let i = 0; i < take; i += 1) sequence.push(normal[normalIndex++]);
      if (premiumIndex < premium.length) sequence.push(premium[premiumIndex++]);
    }
    return sequence;
  }

  function nextOffer(list) {
    const ordered = boughtIds();
    return offerSequence(list).find((project) => !ordered.has(project.id)) || null;
  }

  function seenPremiums() {
    try {
      const raw = JSON.parse(sessionStorage.getItem('ps_premium_seen') || '[]');
      return new Set(Array.isArray(raw) ? raw : []);
    } catch {
      return new Set();
    }
  }

  function showPremiumUnlock(project) {
    if (!project) return;
    const seen = seenPremiums();
    seen.add(project.id);
    sessionStorage.setItem('ps_premium_seen', JSON.stringify([...seen]));
    openModal(`
      <div class="celebrate celebrate-premium">
        <div class="celebrate-hero is-gold">
          <p class="celebrate-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 2.2 6.2L21 12l-6.8 2.8L12 21l-2.2-6.2L3 12l6.8-2.8z"/></svg></p>
          <p class="smallcaps">Congratulations</p>
          <h3 class="serif">Premium unlocked</h3>
        </div>
        <div class="celebrate-body">
          <p class="celebrate-kicker">Premium project</p>
          <p class="celebrate-name">${esc(project.name)}</p>
          <p class="muted">This project is ready to complete.</p>
          <button class="btn primary btn-full" type="button" data-dismiss>Continue</button>
        </div>
      </div>`, 'celebrate-modal');
  }

  function maybePremiumNotice(project) {
    if (!project || project.projectType !== 'premium' || premiumAfterOrder) return;
    if (seenPremiums().has(project.id)) return;
    showPremiumUnlock(project);
  }

  function groupLocked(group) {
    const id = group && group.id ? String(group.id) : String(group || '');
    if (!id) return false;
    const open = Store.user().unlockedGroupIds;
    if (Array.isArray(open)) return !open.includes(id);
    return !(group && group.isTrial);
  }

  function spendBalance(group) {
    const user = Store.user();
    if (group && group.isTrial) return { label: 'Trial balance', amount: Number(user.trialBalance) || 0, kind: 'trial' };
    const hold = Number(user.holdBalance) || 0;
    const wallet = Number(user.walletBalance) || 0;
    if (hold > 0 && user.holdGroupId && group && user.holdGroupId === group.id) {
      return { label: 'Hold balance', amount: hold, wallet, kind: 'hold' };
    }
    if (hold > 0 && user.holdGroupId && group && user.holdGroupId !== group.id) {
      return { label: 'Wallet balance', amount: Number(user.walletBalance) || 0, kind: 'blocked' };
    }
    return { label: 'Wallet balance', amount: Number(user.walletBalance) || 0, kind: 'wallet' };
  }

  function lockIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  }

  function unlockNote(group) {
    const amount = Number(group && group.unlockDeposit) || 0;
    if (amount <= 0) return 'Locked';
    return `Deposit ${Store.money(amount)} to unlock`;
  }

  function offerCard(group) {
    if (groupLocked(group)) {
      const media = group && group.image ? `<img src="${esc(group.image)}" alt="">` : '';
      return `
        <section class="card offer-card offer-locked">
          <div class="offer-media">${media}<span class="lock-mark">${lockIcon()}</span></div>
          <div class="offer-body">
            <h2 class="serif">${esc(group.name)}</h2>
            <p class="lock-note">${lockIcon()}${esc(unlockNote(group))}</p>
          </div>
        </section>`;
    }
    const list = offerSequence(catalog);
    if (!list.length) return emptyState('grid', 'No projects in this group', 'Projects added to this group will appear here.');
    const ordered = boughtIds();
    const done = list.filter((project) => ordered.has(project.id)).length;
    const next = list.find((project) => !ordered.has(project.id));
    const title = group ? group.name : 'Projects';
    const media = `<div class="offer-media">${group && group.image ? `<img src="${esc(group.image)}" alt="">` : ''}</div>`;
    if (!next) {
      return `
        <section class="card offer-card offer-done">
          ${media}
          <div class="offer-body">
            <h2 class="serif">${esc(title)}</h2>
            <p>Every project in this group is done.</p>
            <p class="offer-count">${done}/${list.length}</p>
          </div>
        </section>`;
    }
    const status = Store.user().accountStatus;
    const blocked = status === 'pending' || status === 'blocked' || status === 'suspended';
    const label = status === 'pending' ? 'Approval required' : 'Submit';
    const funds = spendBalance(group);
    return `
      <section class="card offer-card">
        ${media}
        <div class="offer-body">
          <h2 class="serif">${esc(title)}</h2>
          ${next.projectType === 'premium' ? '<p class="offer-premium"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m12 3 2.2 6.2L21 12l-6.8 2.8L12 21l-2.2-6.2L3 12l6.8-2.8z"/></svg>Premium project</p>' : ''}
          <p class="offer-project">${esc(next.name)}</p>
          <dl class="stack-stats offer-rows">
            ${row('Commission rate', `${esc(next.commissionRatio)}%`)}
            ${row('Earn commission', Store.money(next.commissionAmount))}
            ${row('Price', Store.money(next.price))}
            ${row('Ongoing projects', `${done}/${list.length}`)}
            ${row(funds.label, Store.money(funds.amount))}
            ${funds.kind === 'hold' ? row('Wallet balance', Store.money(funds.wallet)) : ''}
          </dl>
          <button class="btn primary btn-full" type="button" data-action="open-activate" data-id="${esc(next.id)}" ${blocked ? 'disabled' : ''}>${label}</button>
        </div>
      </section>`;
  }

  function groupCard(group, index) {
    const locked = groupLocked(group);
    const inner = `
      <div class="property-img">${group.image ? `<img src="${esc(group.image)}" alt="" loading="lazy">` : ''}${locked ? `<span class="lock-mark">${lockIcon()}</span>` : ''}</div>
      <div class="prop-body">
        <div class="prop-meta"><span>${group.projectCount} project${group.projectCount === 1 ? '' : 's'}</span></div>
        <h3>${esc(group.name)}</h3>
        ${locked ? `<p class="lock-note">${lockIcon()}${esc(unlockNote(group))}</p>` : (group.description ? `<p class="prop-line group-desc">${esc(group.description)}</p>` : '')}
      </div>`;
    if (locked) {
      return `<article class="card property-card is-locked" data-name="${esc(group.name)}" data-trial="${group.isTrial ? '1' : '0'}" data-order="${index}">${inner}</article>`;
    }
    return `<a class="card property-card" href="projects.html?group=${esc(group.id)}" data-name="${esc(group.name)}" data-trial="${group.isTrial ? '1' : '0'}" data-order="${index}">${inner}</a>`;
  }

  function dubaiToday() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  function boughtIds() {
    const today = dubaiToday();
    return new Set(ordersCache.filter((order) => (
      (order.status === 'active' || order.status === 'completed') && (order.workDate || String(order.createdAt || '').slice(0, 10)) === today
    )).map((order) => order.projectId));
  }

  function renderProject() {
    const id = new URLSearchParams(location.search).get('id') || '';
    const p = catalog.find((item) => item.id === id) || null;
    if (!p) {
      pageEl().innerHTML = emptyState('grid', 'Project not found', 'This project is not in the catalog.');
      return;
    }
    const funds = spendBalance(groupsCache.find((group) => group.id === p.groupId) || { id: p.groupId, isTrial: false });
    const bought = boughtIds().has(p.id);
    const status = Store.user().accountStatus;
    const locked = groupLocked(p.groupId);
    const blocked = locked || status === 'pending' || status === 'blocked' || status === 'suspended';
    const label = bought ? 'Order submitted' : locked ? 'Group locked' : blocked ? 'Approval required' : 'Submit';
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
      <div class="offer-wrap">
        <a class="icon-btn back-btn" href="${esc(backHref)}" aria-label="Back"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg></a>
        <section class="card offer-card">
          <h2 class="serif">${esc(p.name)}</h2>
          <dl class="stack-stats offer-rows">
            ${row('Commission rate', `${esc(p.commissionRatio)}%`)}
            ${row('Earn commission', Store.money(p.commissionAmount))}
            ${row('Price', Store.money(p.price))}
            ${row(funds.label, Store.money(funds.amount))}
            ${funds.kind === 'hold' ? row('Wallet balance', Store.money(funds.wallet)) : ''}
          </dl>
          <button class="btn primary btn-full" type="button" data-action="open-activate" data-id="${esc(p.id)}" ${bought || blocked ? 'disabled' : ''}>${label}</button>
        </section>
      </div>`;
  }

  function row(label, value) {
    return `<div class="stack-row"><span>${label}</span><b>${value}</b></div>`;
  }

  function openActivate(projectId) {
    const p = catalog.find((item) => item.id === projectId);
    if (!p || boughtIds().has(p.id)) return;
    const trial = groupsCache.find((group) => group.id === p.groupId && group.isTrial);
    const price = Number(p.price) || 0;
    const priceCents = Math.round(price * 100);
    if (trial) {
      const trialBalance = Number(Store.user().trialBalance) || 0;
      if (Math.round(trialBalance * 100) < priceCents) {
        openModal(`
          <h3>Insufficient trial balance</h3>
          <p>This project is ${Store.money(price)}. Your trial balance is ${Store.money(trialBalance)}.</p>
          <div class="modal-actions">
            <button class="btn light" type="button" data-dismiss>Close</button>
          </div>`);
        return;
      }
    } else {
      const funds = spendBalance(groupsCache.find((group) => group.id === p.groupId) || { id: p.groupId, isTrial: false });
      if (funds.kind === 'blocked') {
        openModal(`
          <h3>Hold balance in use</h3>
          <p>Finish the group that is on hold before starting another.</p>
          <div class="modal-actions">
            <button class="btn light" type="button" data-dismiss>Close</button>
          </div>`);
        return;
      }
      const available = funds.kind === 'hold' ? funds.amount + funds.wallet : funds.amount;
      if (Math.round(available * 100) < priceCents) {
        const detail = funds.kind === 'hold'
          ? `Hold is ${Store.money(funds.amount)} and your wallet is ${Store.money(funds.wallet)}.`
          : `Your wallet balance is ${Store.money(funds.amount)}.`;
        openModal(`
          <h3>Insufficient balance</h3>
          <p>This project is ${Store.money(price)}. ${detail}</p>
          <div class="modal-actions">
            <button class="btn light" type="button" data-dismiss>Close</button>
          </div>`);
        return;
      }
    }
    const funds = trial ? null : spendBalance(groupsCache.find((group) => group.id === p.groupId) || { id: p.groupId, isTrial: false });
    const fromHold = funds && funds.kind === 'hold' ? Math.min(funds.amount, price) : 0;
    const fromWallet = funds && funds.kind === 'hold' ? Math.max(price - fromHold, 0) : 0;
    openModal(`
      <h3>Submit order</h3>
      <p class="muted">${esc(p.name)}</p>
      <dl class="stack-stats">
        ${row('Price', Store.money(p.price))}
        ${row('Commission ratio', `${esc(p.commissionRatio)}%`)}
        ${row('Commission', Store.money(p.commissionAmount))}
        ${fromHold > 0 ? row('From hold', Store.money(fromHold)) : ''}
        ${fromWallet > 0 ? row('From wallet', Store.money(fromWallet)) : ''}
      </dl>
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
              <h2 class="serif">${esc(placeLabel(selected))}</h2>
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
              <thead><tr><th>Date</th><th>Group / project</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                ${commissions.length ? commissions.map((c) => `<tr class="order-row" tabindex="0" data-href="orders.html?status=${filter}&id=${esc(c.orderId)}"><td>${esc(c.date)}</td><td>${esc(placeLabel(c))}</td><td>Order</td><td>+${Store.money(c.amount)}</td><td>${badge(c.status)}</td></tr>`).join('') : `<tr><td colspan="5">${emptyState('chart', commissionsCache.length ? 'No commission in this view' : 'No commission yet', commissionsCache.length ? 'Try another order status.' : 'Commission appears here after you submit an order.')}</td></tr>`}
              </tbody>
            </table>` : `
            <table class="data-table">
              <thead><tr><th>Order</th><th>Group / project</th><th>Price</th><th>Commission</th><th>Status</th></tr></thead>
              <tbody>
                ${list.length ? list.map((o) => `<tr class="order-row" tabindex="0" data-href="orders.html?status=${filter}&id=${esc(o.id)}">
                  <td>${esc(o.id)}<div class="muted">${esc(String(o.createdAt || '').slice(0, 10))}</div></td>
                  <td>${esc(placeLabel(o))}</td>
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
          <div><dt>Group</dt><dd>${esc(o.groupName || '—')}</dd></div>
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

  function renderWallet() {
    renderAccount();
  }

  function txPanel(filter) {
    const selected = filter === 'project_commission' || filter === 'daily_commission' ? 'commission' : filter;
    const types = [
      ['all', 'All'],
      ['welcome_bonus', 'Welcome bonus'],
      ['trial_bonus', 'Trial bonus'],
      ['trial_reset', 'Trial reset'],
      ['demo_cash_in', 'Cash in'],
      ['project_activation', 'Activation'],
      ['project_purchase', 'Property'],
      ['commission', 'Commission'],
      ['cash_out', 'Cash out'],
      ['refund', 'Refund'],
      ['adjustment', 'Adjustment'],
    ];
    let txs = txCache;
    if (selected === 'commission') {
      txs = txs.filter((t) => t.type === 'project_commission' || t.type === 'daily_commission');
    } else if (selected !== 'all') {
      txs = txs.filter((t) => t.type === selected);
    }
    return `
      <section class="card box">
        <div class="chips record-filters">
          ${types.map(([id, label]) => `<a class="chip${id === selected ? ' active' : ''}" href="profile.html?section=records&type=${id}">${label}</a>`).join('')}
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

  function boundAccountLine(account) {
    if (!account) return '';
    if (account.kind === 'crypto') return account.address || '';
    return [account.holder, account.bankName, account.iban || account.accountNumber].filter(Boolean).join(' · ');
  }

  function payoutFlags() {
    return {
      bank: platform.bankPayoutEnabled !== false,
      crypto: platform.cryptoPayoutEnabled === true,
    };
  }

  function aedAmount(value) {
    const text = Store.money(value).replace(/^AED\s*/, '');
    return `<span class="aed-val"><svg class="aed-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 4.2h8.6a5.4 5.4 0 0 1 0 10.8H6.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 8.6h15.2M4 12h15.2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span>${text}</span></span>`;
  }

  function bindPanel() {
    const list = accountsCache;
    const flags = payoutFlags();
    let step = new URLSearchParams(location.search).get('bind') || '';
    if (step === 'crypto' && !flags.crypto) step = '';
    if (step === 'bank' && !flags.bank) step = '';
    if (step === 'choose' && !(flags.bank && flags.crypto)) step = '';
    const canBind = flags.bank || flags.crypto;
    return `
      <section class="card box">
        <div class="boxhead">
          <h3>Bound accounts</h3>
          ${canBind ? `<button class="btn primary" type="button" data-action="bind-address">${navIcon('plus')}<span>Bind account</span></button>` : ''}
        </div>
        ${list.length ? `<ul class="bind-list">
          ${list.map((account) => `<li>
            <div>
              <b>${esc(accountTitle(account))}</b>
              <span>${esc(boundAccountLine(account))}</span>
            </div>
            <button class="btn light" type="button" data-action="unbind" data-id="${esc(account.id)}">Remove</button>
          </li>`).join('')}
        </ul>` : (step ? '' : `<div class="empty-wrap">${emptyState('card', 'No account bound', canBind ? 'Add a bank account to receive cash outs.' : 'Account binding is turned off.')}</div>`)}
        ${step === 'choose' ? `
          <div class="bind-step">
            <div class="choice-grid">
              ${flags.crypto ? `<button class="choice" type="button" data-action="bind-kind" data-kind="crypto">${navIcon('wallet')}<span>Crypto</span><small>USDT TRC20 or BEP20</small></button>` : ''}
              ${flags.bank ? `<button class="choice" type="button" data-action="bind-kind" data-kind="bank">${navIcon('card')}<span>Bank account</span><small>IBAN and account details</small></button>` : ''}
            </div>
          </div>` : ''}
        ${step === 'crypto' && flags.crypto ? `
          <form class="fields bind-step" id="crypto-form">
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
        ${step === 'bank' && flags.bank ? `
          <form class="fields bind-step" id="bank-form">
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
          history.replaceState({}, '', 'profile.html?section=bind');
          renderAccount();
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
          history.replaceState({}, '', 'profile.html?section=bind');
          renderAccount();
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
        renderAccount();
      } catch (err) {
        toast(err.message);
      }
    });
  }

  function openCashOut() {
    const all = accountsCache;
    const flags = payoutFlags();
    const kinds = [flags.crypto ? 'crypto' : '', flags.bank ? 'bank' : ''].filter(Boolean);
    openModal(`
      <h3>Cash out</h3>
      <p class="muted">Minimum ${Store.money(platform.minCashOutAmount)}.</p>
      <form class="fields" id="cashout-form">
        ${kinds.length > 1 ? `<div class="field">
          <span class="field-label" id="cashout-kind-label">Send to</span>
          <div class="choice-grid" role="group" aria-labelledby="cashout-kind-label">
            ${flags.crypto ? `<button class="choice" type="button" data-kind="crypto">${navIcon('wallet')}<span>Crypto</span></button>` : ''}
            ${flags.bank ? `<button class="choice" type="button" data-kind="bank">${navIcon('card')}<span>Bank account</span></button>` : ''}
          </div>
        </div>` : ''}${kinds.length ? '' : '<p class="muted">Cash out is turned off.</p>'}
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
    const pickKind = (next) => {
      kind = next;
      kindButtons.forEach((item) => {
        const on = item.dataset.kind === next;
        item.classList.toggle('active', on);
        item.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      const matches = all.filter((account) => account.kind === kind);
      if (!matches.length) {
        field.hidden = true;
        select.innerHTML = '';
        alert.hidden = false;
        alert.innerHTML = kind === 'bank'
          ? 'No bank account is bound. <a href="profile.html?section=bind&bind=bank">Bind a bank account</a> first.'
          : 'No crypto account is bound. <a href="profile.html?section=bind&bind=crypto">Bind a crypto account</a> first.';
        return;
      }
      alert.hidden = true;
      alert.textContent = '';
      field.hidden = false;
      select.innerHTML = matches.map((account) => (
        `<option value="${esc(account.id)}">${esc(accountTitle(account))} · ${esc(boundAccountLine(account))}</option>`
      )).join('');
    };
    kindButtons.forEach((btn) => btn.addEventListener('click', () => pickKind(btn.dataset.kind)));
    if (kinds.length === 1) pickKind(kinds[0]);
    document.getElementById('cashout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('cashout-error');
      err.hidden = true;
      if (!kind || !select.value) {
        err.hidden = false;
        err.textContent = kind
          ? 'Bind an account of this type first.'
          : 'Choose an account type.';
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
        renderAccount();
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

  function accountSection() {
    const params = new URLSearchParams(location.search);
    let section = params.get('section') || '';
    if (!section && params.get('panel')) section = params.get('panel');
    if (!section && (params.get('tab') === 'bind' || params.get('bind'))) section = 'bind';
    if (!section && (params.get('type') || params.get('modal'))) section = 'records';
    const known = ['records', 'bind', 'password', 'passwords', 'referral', 'support', 'sessions', 'edit'];
    return known.includes(section) ? section : '';
  }

  function accountPane() {
    const section = accountSection();
    if (section) return section;
    return window.matchMedia('(min-width: 960px)').matches ? 'records' : '';
  }

  function accountMenu(active) {
    const rows = [
      ['records', 'list', 'Records', 'section'],
      ['cash-in', 'plus', 'Cash in', 'open-cash-in'],
      ['cash-out', 'card', 'Cash out', 'open-cash-out'],
      ['bind', 'wallet', 'Bind wallet', 'section'],
      ['referral', 'share', 'Invite friends', 'section'],
      ['password', 'lock', 'Change password', 'section'],
      ['passwords', 'lock', 'Cash out passwords', 'section'],
      ['support', 'support', 'Support', 'page'],
      ['sessions', 'devices', 'Sessions', 'section'],
      ['logout', 'logout', 'Log out', 'logout'],
    ];
    return rows.map(([id, icon, label, kind]) => {
      if (kind === 'page') {
        return `<a class="account-row mobile-support" href="support.html"><span class="account-row-ico">${navIcon(icon)}</span><span>${esc(label)}</span></a>`;
      }
      const on = kind === 'section' && id === active;
      const action = kind === 'section' ? 'account-section' : kind;
      const sectionAttr = kind === 'section' ? ` data-section="${id}"` : '';
      return `<button class="account-row${on ? ' active' : ''}" type="button" data-action="${action}"${sectionAttr}><span class="account-row-ico">${navIcon(icon)}</span><span>${esc(label)}</span></button>`;
    }).join('');
  }

  function accountDetail(pane, user) {
    const person = user || {};
    const titles = {
      records: 'Records',
      bind: 'Bind wallet',
      password: 'Change password',
      passwords: 'Cash out passwords',
      referral: 'Invite friends',
      support: 'Support',
      sessions: 'Sessions',
      edit: 'Edit profile',
    };
    const refs = referralsCache;
    const today = Store.dayKey(0);
    const month = Store.dayKey(29);
    const link = `${location.origin}${location.pathname.replace(/profile\.html$/, 'signup.html')}?ref=${person.referralCode || ''}`;
    const support = `https://t.me/${platform.supportTelegramUsername}`;
    const filter = new URLSearchParams(location.search).get('type') || 'all';
    let body = '';
    if (pane === 'records') body = txPanel(filter);
    else if (pane === 'bind') body = bindPanel();
    else if (pane === 'password') {
      body = `
        <form id="pw-form" class="fields">
          <div class="field"><label for="pw-current">Current password</label><input id="pw-current" type="password" autocomplete="current-password"></div>
          <div class="field"><label for="pw-next">New password</label><input id="pw-next" type="password" autocomplete="new-password" minlength="6"></div>
          <div class="field"><label for="pw-confirm">Confirm new password</label><input id="pw-confirm" type="password" autocomplete="new-password"></div>
          <p class="field-error" id="pw-error" role="alert" hidden></p>
          <button class="btn primary" type="submit">Update password</button>
        </form>`;
    } else if (pane === 'passwords') {
      const pass = new URLSearchParams(location.search).get('pass') === 'withdrawal' ? 'withdrawal' : 'security';
      body = `
        <div class="tabbar password-tabs" role="tablist" aria-label="Cash out passwords">
          <button class="seg-btn${pass === 'security' ? ' active' : ''}" type="button" role="tab" aria-selected="${pass === 'security'}" data-action="password-tab" data-pass="security">Security password</button>
          <button class="seg-btn${pass === 'withdrawal' ? ' active' : ''}" type="button" role="tab" aria-selected="${pass === 'withdrawal'}" data-action="password-tab" data-pass="withdrawal">Withdrawal password</button>
        </div>
        <form id="wp-form" class="fields" data-pass="${pass}">
          <div class="field"><label for="wp-current">Current password</label><input id="wp-current" type="password" autocomplete="current-password"></div>
          <div class="field"><label for="wp-next">New password</label><input id="wp-next" type="password" autocomplete="new-password" minlength="6"></div>
          <div class="field"><label for="wp-confirm">Confirm new password</label><input id="wp-confirm" type="password" autocomplete="new-password"></div>
          <p class="field-error" id="wp-error" role="alert" hidden></p>
          <button class="btn primary" type="submit" id="wp-save">Update password</button>
        </form>`;
    } else if (pane === 'edit') {
      body = `
        <form id="profile-form" class="fields">
          <div class="field"><label for="pf-name">Full name</label><input id="pf-name" value="${esc(person.fullName)}" autocomplete="name"></div>
          <div class="field"><label for="pf-mobile">Mobile</label><input id="pf-mobile" value="${esc(person.mobile)}" autocomplete="tel" inputmode="tel"></div>
          <button class="btn primary" type="submit">Save profile</button>
        </form>`;
    } else if (pane === 'support') {
      body = `
        <div>
          <p class="muted">Message the Emirates Properties team on Telegram.</p>
          <a class="btn primary" href="${support}" target="_blank" rel="noopener">Open Telegram</a>
        </div>`;
    } else if (pane === 'referral') {
      const invite = new URLSearchParams(location.search).get('invite') === 'today' || new URLSearchParams(location.search).get('invite') === 'month'
        ? new URLSearchParams(location.search).get('invite')
        : 'all';
      const shownRefs = invite === 'today'
        ? refs.filter((item) => item.date === today)
        : invite === 'month'
          ? refs.filter((item) => item.date >= month)
          : refs;
      const stat = (id, label, count) => `
        <button class="invite-stat${invite === id ? ' active' : ''}" type="button" data-action="invite-filter" data-filter="${id}" aria-pressed="${invite === id ? 'true' : 'false'}">
          <b>${count}</b><span>${label}</span>
        </button>`;
      body = `
        <div class="invite">
          <div class="invite-share">
            <div class="invite-code-wrap">
              <span>Your code</span>
              <button class="invite-code" type="button" data-action="copy" data-value="${esc(person.referralCode || '')}">${esc(person.referralCode || '—')}</button>
            </div>
            <div class="invite-actions">
              <button class="btn invite-copy" type="button" data-action="copy" data-value="${esc(person.referralCode || '')}">Copy code</button>
              <button class="btn invite-link" type="button" data-action="copy" data-value="${esc(link)}">Copy link</button>
            </div>
          </div>
          <div class="invite-stats">
            ${stat('all', 'Total', refs.length)}
            ${stat('today', 'Today', refs.filter((item) => item.date === today).length)}
            ${stat('month', 'This month', refs.filter((item) => item.date >= month).length)}
          </div>
          ${shownRefs.length ? `<div class="invite-people">${shownRefs.map((item) => {
            const initial = String(item.name || 'U').trim().charAt(0).toUpperCase() || 'U';
            return `<article class="invite-person">
              <span class="invite-avatar" aria-hidden="true">${esc(initial)}</span>
              <div class="invite-who"><b>${esc(item.name)}</b><small>${esc(item.mobile)}</small></div>
              <div class="invite-side"><time>${esc(item.date)}</time>${badge(item.status)}</div>
            </article>`;
          }).join('')}</div>` : `<div class="invite-empty">${emptyState('share', 'No referrals yet', 'Share your code. Users who join with it show up here.')}</div>`}
        </div>`;
    } else if (pane === 'sessions') body = sessionPanel(sessionsCache);
    return `
      <div class="account-head">
        <button class="account-back icon-btn" type="button" data-action="account-home" aria-label="Back"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg></button>
        <h2 class="serif account-detail-title">${esc(titles[pane] || 'Account')}</h2>
      </div>
      ${body}`;
  }

  function renderAccount() {
    if (accountSection() === 'support') {
      location.replace('support.html');
      return;
    }
    if (!renderAccount.watching) {
      renderAccount.watching = true;
      window.matchMedia('(min-width: 960px)').addEventListener('change', () => {
        if (document.body.dataset.page === 'profile') renderAccount();
      });
    }
    const user = Store.user();
    const pane = accountPane();
    const today = Store.dayKey(0);
    const todayRevenue = commissionsCache.filter((row) => row.date === today).reduce((sum, row) => sum + row.amount, 0);
    const initial = String(user.fullName || 'U').trim().charAt(0).toUpperCase() || 'U';
    pageEl().innerHTML = `
      ${accountNote()}
      <div class="account${pane ? ' is-detail' : ''}">
        <section class="card account-hero">
          <div class="account-id">
            <div class="account-avatar" aria-hidden="true">${esc(initial)}</div>
            <div class="account-identity">
              <div class="account-name-row">
                <div class="account-name">${esc(user.fullName)} ${badge(user.accountStatus)}</div>
                <button class="icon-btn profile-edit" type="button" data-action="account-section" data-section="edit" aria-label="Edit profile"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="m13.5 6.5 3 3"/></svg></button>
              </div>
              <p class="account-userid">User ID · ${esc(String(user.id || ''))}</p>
              <p>Mobile · ${esc(user.mobile)}</p>
              <p>Referral code · <b>${esc(user.referralCode || '')}</b> <button class="account-copy" type="button" data-action="copy" data-value="${esc(user.referralCode || '')}">Copy</button></p>
            </div>
          </div>
          <div class="account-stats">
            <div><b>${ordersCache.length}</b><span>Projects</span></div>
            <div><b>${aedAmount(user.trialBalance)}</b><span>Trial bonus</span></div>
            <div><b>${aedAmount(todayRevenue)}</b><span>Today's revenue</span></div>
            <div><b>${aedAmount(user.pendingCashOut)}</b><span>On hold</span></div>
          </div>
          <div class="account-balances">
            <div class="account-balance">
              <span>Wallet balance</span>
              <b>${aedAmount(user.walletBalance)}</b>
            </div>
            <div class="account-balance is-hold">
              <span>Hold balance</span>
              <b>${aedAmount(user.holdBalance)}</b>
            </div>
          </div>
        </section>
        <div class="account-body">
          <nav class="account-menu" aria-label="Account">${accountMenu(pane)}</nav>
          <section class="card account-detail">${pane ? accountDetail(pane, user) : ''}</section>
        </div>
      </div>`;
    if (pane === 'bind') bindBindForm();
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
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
          const letter = (saved.fullName || 'A').trim().charAt(0).toUpperCase();
          document.querySelectorAll('.dashbar-right .avatar').forEach((el) => { el.textContent = letter; });
          const name = document.querySelector('.who-card .who b');
          if (name) name.textContent = saved.fullName;
          toast('Profile saved');
          renderAccount();
        } catch (err) {
          toast(err.message);
        }
      });
    }
    bindWithdrawForm();
    const passwordForm = document.getElementById('pw-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', async (e) => {
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
    const params = new URLSearchParams(location.search);
    const modal = params.get('modal');
    if (modal === 'cash-in') openCashIn();
    if (modal === 'cash-out') openCashOut();
    if (modal) {
      const next = new URLSearchParams(location.search);
      next.delete('modal');
      if (!next.get('section')) next.set('section', pane || 'records');
      history.replaceState({}, '', `profile.html?${next.toString()}`);
    }
  }

  function renderProfile() {
    renderAccount();
  }

  function bindWithdrawForm() {
    const form = document.getElementById('wp-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = document.getElementById('wp-error');
      const save = document.getElementById('wp-save');
      err.hidden = true;
      const next = document.getElementById('wp-next').value;
      const confirm = document.getElementById('wp-confirm').value;
      if (next !== confirm) {
        err.hidden = false;
        err.textContent = 'Passwords do not match.';
        return;
      }
      const pass = form.dataset.pass === 'withdrawal' ? 'withdrawal' : 'security';
      const current = document.getElementById('wp-current')?.value || '';
      save.disabled = true;
      save.textContent = 'Saving…';
      try {
        const data = await memberApi('/api/auth/withdrawal-password', {
          method: 'POST',
          body: pass === 'security'
            ? { currentSecurityPassword: current, securityPassword: next }
            : { currentWithdrawalPassword: current, withdrawalPassword: next },
        });
        if (data.user) Store.applySession(data.user);
        toast(pass === 'security' ? 'Security password updated' : 'Withdrawal password updated');
        renderAccount();
      } catch (error) {
        err.hidden = false;
        err.textContent = error.message;
        save.disabled = false;
        save.textContent = 'Update password';
      }
    });
  }

  function renderSupport() {
    setBreadcrumb([
      { href: 'dashboard.html', label: 'Workspace' },
      { label: 'Support' },
    ]);
    const handle = String(platform.supportTelegramUsername || '').replace(/^@/, '');
    const link = handle ? `https://t.me/${encodeURIComponent(handle)}` : '';
    pageEl().innerHTML = `
      <section class="support-sheet">
        <div class="support-head">
          <a class="icon-btn back-btn support-back" href="profile.html" aria-label="Back"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M15 6 9 12l6 6"/></svg></a>
          <h2 class="serif">Support</h2>
        </div>
        ${link ? `
          <a class="support-link" href="${esc(link)}" target="_blank" rel="noopener">
            <span class="support-link-ico">${navIcon('support')}</span>
            <span class="support-link-copy"><b>Telegram</b><small>@${esc(handle)}</small></span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
          </a>` : '<p class="muted">Telegram is not set yet.</p>'}
      </section>`;
  }

  function paintPage() {
    const page = document.body.dataset.page;
    const map = {
      dashboard: renderDashboard,
      projects: renderProjects,
      project: renderProject,
      orders: renderOrders,
      wallet: renderWallet,
      profile: renderProfile,
      support: renderSupport,
    };
    (map[page] || renderDashboard)();
    if (typeof initPickers === 'function') initPickers();
    if (!(sessionStorage.getItem('ps_trial_bonus') === '1' && page === 'dashboard')) maybePendingNotice();
  }

  function maybeTrialBonus() {
    if (sessionStorage.getItem('ps_trial_bonus') !== '1') return;
    if (document.body.dataset.page !== 'dashboard') return;
    sessionStorage.removeItem('ps_trial_bonus');
    const amount = Store.money(Number(Store.user().trialBalance) || 0);
    openModal(`
      <div class="celebrate">
        <img class="celebrate-art" src="../assets/images/trial-bonus.jpg" alt="">
        <p class="smallcaps">Trial bonus</p>
        <p class="celebrate-amount">${amount}</p>
        <p class="muted">This amount is now in your trial balance.</p>
        <button class="btn primary btn-full" type="button" data-dismiss>Claim</button>
      </div>`, 'celebrate-modal');
    const root = document.getElementById('modal-root');
    if (!root) return;
    const watch = (event) => {
      const claimed = event.target.closest('[data-dismiss]');
      const backdrop = event.target.classList && event.target.classList.contains('modal-back');
      if (!claimed && !backdrop) return;
      root.removeEventListener('click', watch);
      maybePendingNotice();
    };
    root.addEventListener('click', watch);
  }

  function orderSubmitted(order) {
    const name = order && order.projectName ? order.projectName : 'Your project';
    const pendingPremium = premiumAfterOrder;
    openModal(`
      <div class="celebrate celebrate-order">
        <div class="celebrate-hero">
          <p class="celebrate-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="m8.5 12.2 2.3 2.3 4.7-5"/></svg></p>
          <p class="smallcaps">Congratulations</p>
          <h3 class="serif">Order submitted</h3>
        </div>
        <div class="celebrate-body">
          <p class="celebrate-name">${esc(name)}</p>
          <p class="muted">Your order is confirmed.</p>
          <div class="celebrate-actions">
            <button class="btn light" type="button" data-dismiss>Cancel</button>
            <button class="btn primary" type="button" data-action="view-submitted-order" data-id="${esc(order.id)}">View order</button>
          </div>
        </div>
      </div>`, 'celebrate-modal');
    if (!pendingPremium) return;
    const root = document.getElementById('modal-root');
    if (!root) return;
    const reveal = () => {
      premiumAfterOrder = null;
      showPremiumUnlock(pendingPremium);
    };
    root.querySelectorAll('[data-dismiss]').forEach((button) => button.addEventListener('click', reveal));
    const back = root.querySelector('.modal-back');
    if (back) back.addEventListener('click', (event) => { if (event.target === back) reveal(); });
  }

  async function refreshMember() {
    try {
      const data = await memberApi('/api/auth/me');
      if (data.user) Store.applySession(data.user);
      return data.user || null;
    } catch {
      return null;
    }
  }

  function startStatusWatch() {
    if (startStatusWatch.started) return;
    startStatusWatch.started = true;
    const pull = async () => {
      if (document.hidden) return;
      const before = String((Store.user() && Store.user().accountStatus) || '');
      const user = await refreshMember();
      if (!user) return;
      if (String(user.accountStatus || '') !== before) paintPage();
    };
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) pull();
    });
    window.addEventListener('focus', pull);
    window.setInterval(pull, 8000);
  }

  async function render() {
    const page = document.body.dataset.page;
    loadError = '';
    await refreshMember();
    if (page === 'projects' || page === 'dashboard') {
      const groupId = page === 'projects' ? (new URLSearchParams(location.search).get('group') || '') : '';
      try {
        groupsCache = ((await memberApi('/api/groups')).groups || [])
          .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
        catalog = groupId
          ? ((await memberApi(`/api/projects?groupId=${encodeURIComponent(groupId)}`)).projects || [])
          : [];
      } catch (err) {
        groupsCache = [];
        catalog = [];
        if (page === 'projects') loadError = err.message;
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
    if (page === 'dashboard' || page === 'orders' || page === 'wallet' || page === 'profile' || page === 'support') {
      try {
        platform = (await memberApi('/api/settings')).settings || platform;
      } catch {
        /* keep the last known platform settings */
      }
    }
    if (page === 'dashboard' || page === 'orders' || page === 'wallet' || page === 'profile') {
      try {
        const jobs = [
          memberApi('/api/orders'),
          memberApi('/api/commissions'),
          memberApi('/api/wallet/transactions'),
        ];
        if (page === 'wallet' || page === 'profile') {
          jobs.push(
            memberApi('/api/wallet/accounts'),
            memberApi('/api/referrals'),
            memberApi('/api/auth/sessions'),
          );
        }
        const [ordersRes, commissionsRes, txRes, accountsRes, referralRes, sessionRes] = await Promise.all(jobs);
        ordersCache = ordersRes.orders || [];
        commissionsCache = commissionsRes.commissions || [];
        txCache = txRes.transactions || [];
        if (accountsRes) accountsCache = accountsRes.accounts || [];
        if (referralRes) referralsCache = referralRes.referrals || [];
        if (sessionRes) sessionsCache = sessionRes.sessions || [];
      } catch (err) {
        ordersCache = [];
        commissionsCache = [];
        txCache = [];
        loadError = err.message;
      }
    }
    paintPage();
    maybeTrialBonus();
    startStatusWatch();
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
          if (data.order) {
            ordersCache = [data.order, ...ordersCache.filter((order) => order.id !== data.order.id)];
          }
          const upcoming = nextOffer(catalog);
          premiumAfterOrder = upcoming && upcoming.projectType === 'premium' ? upcoming : null;
          closeModal();
          if (document.body.dataset.page === 'projects') renderProjects();
          orderSubmitted(data.order || {});
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
          renderAccount();
        })
        .catch((err) => toast(err.message));
    }
    if (action === 'account-section') {
      history.pushState({}, '', `profile.html?section=${encodeURIComponent(el.dataset.section || '')}`);
      renderAccount();
    }
    if (action === 'account-home') {
      history.pushState({}, '', 'profile.html');
      renderAccount();
    }
    if (action === 'view-submitted-order') {
      window.location.href = `orders.html?id=${encodeURIComponent(el.dataset.id || '')}`;
    }
    if (action === 'invite-filter') {
      const filter = el.dataset.filter === 'today' || el.dataset.filter === 'month' ? el.dataset.filter : 'all';
      const query = filter === 'all' ? 'section=referral' : `section=referral&invite=${filter}`;
      history.pushState({}, '', `profile.html?${query}`);
      renderAccount();
    }
    if (action === 'password-tab') {
      const pass = el.dataset.pass === 'withdrawal' ? 'withdrawal' : 'security';
      history.pushState({}, '', `profile.html?section=passwords&pass=${pass}`);
      renderAccount();
    }
    if (action === 'bind-address') {
      const flags = payoutFlags();
      const enabled = [flags.bank ? 'bank' : '', flags.crypto ? 'crypto' : ''].filter(Boolean);
      if (!enabled.length) {
        toast('Account binding is turned off.');
        return;
      }
      const next = enabled.length === 1 ? enabled[0] : 'choose';
      history.pushState({}, '', `profile.html?section=bind&bind=${next}`);
      renderAccount();
    }
    if (action === 'bind-kind') {
      const kind = el.dataset.kind === 'bank' ? 'bank' : 'crypto';
      history.pushState({}, '', `profile.html?section=bind&bind=${kind}`);
      renderAccount();
    }
    if (action === 'bind-cancel') {
      history.pushState({}, '', 'profile.html?section=bind');
      renderAccount();
    }
    if (action === 'unbind') {
      memberApi(`/api/wallet/accounts/${encodeURIComponent(el.dataset.id)}`, { method: 'DELETE' })
        .then(() => {
          accountsCache = accountsCache.filter((account) => account.id !== el.dataset.id);
          toast('Address removed');
          renderAccount();
        })
        .catch((err) => toast(err.message));
    }
  });

  return { render };
})();

if (document.body.dataset.app === 'member') Member.render();
