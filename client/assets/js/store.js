/* ============================================================
   PrimeSpace demo store — localStorage only (UI simulation)
   ============================================================ */

const Store = (() => {
  const KEY = 'ps_db_v2';

  function dayKey(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function isoDaysAgo(n, hour = 10) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }

  function seed() {
    const userId = 'usr_1001';
    const commissions = [];
    for (let i = 12; i >= 1; i -= 1) {
      commissions.push({
        id: `comm_p_${i}`,
        userId,
        orderId: 'ord_5001',
        projectId: 'premium',
        projectName: 'Premium Project',
        amount: 10,
        dayIndex: 13 - i,
        date: dayKey(i),
        status: 'completed',
      });
    }

    return {
      settings: {
        platformName: 'Emirates Properties',
        currencySymbol: 'AED',
        welcomeBonusAmount: 100,
        minCashOutAmount: 500,
        supportTelegramUsername: 'EmiratesPropertiesSupport',
        demoCashInUSDTAddress: 'TEmiratesPropertiesUSDTTRC20XXXX',
        supportedWithdrawalMethods: ['USDT TRC20', 'USDT BEP20', 'Bank'],
      },
      user: {
        id: userId,
        fullName: 'Alex Member',
        mobile: '+91 98765 43210',
        password: 'demo1234',
        withdrawalPassword: '123456',
        referralCode: 'ALEX82K',
        referredBy: null,
        accountStatus: 'active',
        createdAt: isoDaysAgo(40),
        walletBalance: 1860,
        pendingCashOut: 500,
      },
      users: [
        {
          id: userId,
          fullName: 'Alex Member',
          mobile: '+91 98765 43210',
          referralCode: 'ALEX82K',
          referredBy: null,
          accountStatus: 'active',
          walletBalance: 1860,
          pendingCashOut: 500,
          createdAt: isoDaysAgo(40),
        },
        {
          id: 'usr_1002',
          fullName: 'Riya Shah',
          mobile: '+91 98111 22001',
          referralCode: 'RIYA44M',
          referredBy: userId,
          accountStatus: 'active',
          walletBalance: 740,
          pendingCashOut: 0,
          createdAt: isoDaysAgo(2),
        },
        {
          id: 'usr_1003',
          fullName: 'Omar Khalid',
          mobile: '+971 50 111 2233',
          referralCode: 'OMAR19K',
          referredBy: userId,
          accountStatus: 'blocked',
          walletBalance: 2100,
          pendingCashOut: 0,
          createdAt: isoDaysAgo(18),
        },
        {
          id: 'usr_1004',
          fullName: 'Neha Iyer',
          mobile: '+91 99000 11223',
          referralCode: 'NEHA07P',
          referredBy: 'usr_1003',
          accountStatus: 'active',
          walletBalance: 100,
          pendingCashOut: 0,
          createdAt: dayKey(0) + 'T08:00:00.000Z',
        },
      ],
      projects: [
        {
          id: 'premium',
          name: 'Premium Project',
          image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
          description: 'A short 30-day cycle with a modest daily commission. Good first activation.',
          activationAmount: 1000,
          dailyCommission: 10,
          commissionFrequency: 'daily',
          durationDays: 30,
          totalCommission: 300,
          status: 'active',
          tag: 'Featured',
          address: 'Dubai Marina, Dubai',
          developer: 'Emaar Properties',
        },
        {
          id: 'smart-gadget',
          name: 'Smart Gadget Project',
          image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80',
          description: 'Higher daily commission across a 60-day cycle.',
          activationAmount: 2000,
          dailyCommission: 25,
          commissionFrequency: 'daily',
          durationDays: 60,
          totalCommission: 1500,
          status: 'active',
          tag: 'Popular',
          address: 'Business Bay, Dubai',
          developer: 'DAMAC Properties',
        },
        {
          id: 'lifestyle',
          name: 'Lifestyle Project',
          image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
          description: 'Balanced activation and daily return over 45 days.',
          activationAmount: 1500,
          dailyCommission: 18,
          commissionFrequency: 'daily',
          durationDays: 45,
          totalCommission: 810,
          status: 'active',
          tag: 'Balanced',
          address: 'Palm Jumeirah, Dubai',
          developer: 'Nakheel',
        },
        {
          id: 'premium-plus',
          name: 'Premium Project Plus',
          image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80',
          description: 'Longest cycle and the highest total commission in the catalog.',
          activationAmount: 3000,
          dailyCommission: 40,
          commissionFrequency: 'daily',
          durationDays: 90,
          totalCommission: 3600,
          status: 'active',
          tag: 'Premium',
          address: 'Downtown Dubai',
          developer: 'Emaar Properties',
        },
      ],
      orders: [
        {
          id: 'ord_5001',
          userId,
          projectId: 'premium',
          projectName: 'Premium Project',
          image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
          activationAmount: 1000,
          dailyCommission: 10,
          durationDays: 30,
          startDate: isoDaysAgo(13),
          endDate: isoDaysAgo(-17),
          daysCompleted: 12,
          earnedCommission: 120,
          remainingCommission: 180,
          status: 'active',
          createdAt: isoDaysAgo(12),
        },
        {
          id: 'ord_5000',
          userId,
          projectId: 'lifestyle',
          projectName: 'Lifestyle Project',
          image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
          activationAmount: 1500,
          dailyCommission: 18,
          durationDays: 45,
          startDate: isoDaysAgo(50),
          endDate: isoDaysAgo(5),
          daysCompleted: 45,
          earnedCommission: 810,
          remainingCommission: 0,
          status: 'completed',
          createdAt: isoDaysAgo(50),
        },
      ],
      commissions,
      transactions: [
        {
          id: 'tx_welcome',
          userId,
          type: 'welcome_bonus',
          amount: 100,
          direction: 'credit',
          description: 'Welcome bonus',
          status: 'completed',
          referenceId: 'welcome',
          createdAt: isoDaysAgo(40, 9),
        },
        {
          id: 'tx_cashin',
          userId,
          type: 'demo_cash_in',
          amount: 3000,
          direction: 'credit',
          description: 'USDT TRC20 cash in',
          status: 'completed',
          referenceId: 'cin_1',
          createdAt: isoDaysAgo(20),
        },
        {
          id: 'tx_act_life',
          userId,
          type: 'project_activation',
          amount: 1500,
          direction: 'debit',
          description: 'Activated Lifestyle Project',
          status: 'completed',
          referenceId: 'ord_5000',
          createdAt: isoDaysAgo(50),
        },
        {
          id: 'tx_act_prem',
          userId,
          type: 'project_activation',
          amount: 1000,
          direction: 'debit',
          description: 'Activated Premium Project',
          status: 'completed',
          referenceId: 'ord_5001',
          createdAt: isoDaysAgo(12),
        },
        {
          id: 'tx_comm_latest',
          userId,
          type: 'daily_commission',
          amount: 10,
          direction: 'credit',
          description: 'Daily commission · Premium Project',
          status: 'completed',
          referenceId: 'ord_5001',
          createdAt: isoDaysAgo(1),
        },
        {
          id: 'tx_cashout',
          userId,
          type: 'cash_out',
          amount: 500,
          direction: 'debit',
          description: 'Cash out · USDT TRC20',
          status: 'pending',
          referenceId: 'co_8001',
          createdAt: isoDaysAgo(1, 16),
        },
      ],
      cashouts: [
        {
          id: 'co_8001',
          userId,
          userName: 'Alex Member',
          mobile: '+91 98765 43210',
          amount: 500,
          method: 'USDT TRC20',
          destination: 'TAlexWalletTRC20XXXXXXX',
          status: 'pending',
          rejectionReason: '',
          requestedAt: isoDaysAgo(1, 16),
          processedAt: null,
        },
      ],
      withdrawal: {
        accounts: [
          {
            id: 'wd_trc20',
            kind: 'crypto',
            network: 'USDT TRC20',
            address: 'TAlexWalletTRC20XXXXXXX',
          },
          {
            id: 'wd_bank',
            kind: 'bank',
            holder: 'Alex Member',
            bankName: 'Emirates NBD',
            iban: 'AE070331234567890123456',
            accountNumber: '1234567890',
          },
        ],
      },
      referrals: [
        { id: 'ref_1', name: 'Riya S.', mobile: '••••22001', date: dayKey(2), status: 'active', referrerId: userId },
        { id: 'ref_2', name: 'Omar K.', mobile: '••••2233', date: dayKey(18), status: 'blocked', referrerId: userId },
        { id: 'ref_3', name: 'Neha I.', mobile: '••••11223', date: dayKey(0), status: 'active', referrerId: userId },
      ],
      seq: 9000,
    };
  }

  let db = null;

  function load() {
    if (db) return db;
    try {
      const raw = localStorage.getItem(KEY);
      db = raw ? JSON.parse(raw) : seed();
    } catch {
      db = seed();
    }
    applyPendingSignup();
    let dirty = false;
    const normalized = normalizeWithdrawal(db.withdrawal);
    if (JSON.stringify(normalized) !== JSON.stringify(db.withdrawal)) {
      db.withdrawal = normalized;
      dirty = true;
    }
    if (hydrateProjects()) dirty = true;
    if (stripStoredImages(db)) dirty = true;
    if (db.notifications) {
      delete db.notifications;
      dirty = true;
    }
    if (dirty) save();
    return db;
  }

  function hydrateProjects() {
    const facts = {
      premium: { address: 'Dubai Marina, Dubai', developer: 'Emaar Properties' },
      'smart-gadget': { address: 'Business Bay, Dubai', developer: 'DAMAC Properties' },
      lifestyle: { address: 'Palm Jumeirah, Dubai', developer: 'Nakheel' },
      'premium-plus': { address: 'Downtown Dubai', developer: 'Emaar Properties' },
    };
    let changed = false;
    (db.projects || []).forEach((project) => {
      const extra = facts[project.id];
      if (!extra) return;
      if (!project.address) { project.address = extra.address; changed = true; }
      if (!project.developer) { project.developer = extra.developer; changed = true; }
    });
    return changed;
  }

  function normalizeWithdrawal(raw) {
    const current = raw && typeof raw === 'object' ? raw : {};
    if (Array.isArray(current.accounts)) {
      return {
        accounts: current.accounts.filter((a) => a && (a.kind === 'crypto' || a.kind === 'bank') && a.id),
      };
    }
    const accounts = [];
    if (current.trc20) {
      accounts.push({ id: 'wd_trc20', kind: 'crypto', network: 'USDT TRC20', address: String(current.trc20) });
    }
    if (current.bep20) {
      accounts.push({ id: 'wd_bep20', kind: 'crypto', network: 'USDT BEP20', address: String(current.bep20) });
    }
    const bank = current.bank || {};
    if (bank.accountNumber || bank.iban) {
      accounts.push({
        id: 'wd_bank',
        kind: 'bank',
        holder: bank.name || bank.holder || '',
        bankName: bank.bankName || 'Bank account',
        iban: bank.iban || '',
        accountNumber: bank.accountNumber || '',
      });
    }
    return { accounts };
  }

  function stripStoredImages(data) {
    let changed = false;
    ['projects', 'orders'].forEach((key) => {
      (data[key] || []).forEach((row) => {
        if (row && Object.prototype.hasOwnProperty.call(row, 'image')) {
          delete row.image;
          changed = true;
        }
      });
    });
    return changed;
  }

  function save() {
    const copy = JSON.parse(JSON.stringify(db));
    stripStoredImages(copy);
    localStorage.setItem(KEY, JSON.stringify(copy));
    syncUserRow();
  }

  function syncUserRow() {
    const u = db.user;
    const row = db.users.find((x) => x.id === u.id);
    if (!row) return;
    row.fullName = u.fullName;
    row.mobile = u.mobile;
    row.accountStatus = u.accountStatus;
    row.walletBalance = u.walletBalance;
    row.pendingCashOut = u.pendingCashOut;
    row.referralCode = u.referralCode;
  }

  function applyPendingSignup() {
    const raw = localStorage.getItem('ps_pending_signup');
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (data.fullName) db.user.fullName = data.fullName;
      if (data.mobile) db.user.mobile = data.mobile;
      syncUserRow();
    } catch { /* ignore */ }
    localStorage.removeItem('ps_pending_signup');
    save();
  }

  function reset() {
    db = seed();
    save();
    return db;
  }

  function nextId(prefix) {
    db.seq += 1;
    return `${prefix}_${db.seq}`;
  }

  function money(n) {
    const value = Number(n) || 0;
    const abs = Math.abs(value).toLocaleString('en-AE');
    return `${value < 0 ? '-' : ''}AED ${abs}`;
  }

  function sessionMember() {
    try {
      const raw = sessionStorage.getItem('ps_member') || localStorage.getItem('ps_member');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function applySession(user) {
    if (!user || typeof user !== 'object') return;
    const next = { ...(sessionMember() || {}), ...user };
    const raw = JSON.stringify(next);
    sessionStorage.setItem('ps_member', raw);
    localStorage.setItem('ps_member', raw);
    if (typeof syncMemberHeader === 'function') syncMemberHeader(next);
  }

  function writeSessionMember(patch) {
    const current = sessionMember();
    if (!current) return;
    const next = { ...current, ...patch };
    const raw = JSON.stringify(next);
    sessionStorage.setItem('ps_member', raw);
    localStorage.setItem('ps_member', raw);
    if (typeof syncMemberHeader === 'function') syncMemberHeader(next);
  }

  function user() {
    const local = load().user;
    const session = sessionMember();
    if (!session) return local;
    return {
      ...local,
      id: session.id,
      fullName: session.fullName || local.fullName,
      mobile: session.mobile || local.mobile,
      accountStatus: session.accountStatus || 'active',
      referralCode: session.referralCode || '',
      createdAt: session.createdAt || local.createdAt || '',
      walletBalance: session.walletBalance == null ? Number(local.walletBalance) || 0 : Number(session.walletBalance),
      trialBalance: session.trialBalance == null ? Number(local.trialBalance) || 0 : Number(session.trialBalance),
      holdBalance: session.holdBalance == null ? Number(local.holdBalance) || 0 : Number(session.holdBalance),
      holdGroupId: session.holdGroupId || '',
      pendingCashOut: session.pendingCashOut == null ? Number(local.pendingCashOut) || 0 : Number(session.pendingCashOut),
      hasSecurityPassword: session.hasSecurityPassword === true,
      hasWithdrawalPassword: session.hasWithdrawalPassword === true,
      unlockedGroupIds: Array.isArray(session.unlockedGroupIds) ? session.unlockedGroupIds : null,
      role: session.role || 'user',
    };
  }

  function settings() {
    return load().settings;
  }

  function projects() {
    return load().projects;
  }

  function projectById(id) {
    return load().projects.find((p) => p.id === id) || null;
  }

  function orders() {
    return load().orders.filter((o) => o.userId === user().id);
  }

  function orderById(id) {
    return load().orders.find((o) => o.id === id) || null;
  }

  function commissionsFor(orderId) {
    return load().commissions
      .filter((c) => c.orderId === orderId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function allCommissions() {
    return load().commissions
      .filter((c) => c.userId === user().id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  function transactions() {
    const account = user();
    const rows = load().transactions
      .filter((t) => t.userId === account.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (rows.length || !sessionMember()) return rows;
    if (account.walletBalance > 0) {
      return [{
        id: 'welcome',
        userId: account.id,
        type: 'welcome_bonus',
        description: 'Welcome bonus',
        amount: account.walletBalance,
        direction: 'credit',
        status: 'completed',
        createdAt: account.createdAt || new Date().toISOString(),
      }];
    }
    return rows;
  }

  function stats() {
    const u = user();
    const list = orders();
    const comm = allCommissions();
    const today = dayKey(0);
    const todayCommission = comm.filter((c) => c.date === today).reduce((s, c) => s + c.amount, 0);
    const totalCommission = comm.reduce((s, c) => s + c.amount, 0);
    const active = list.filter((o) => o.status === 'active');
    const txs = transactions();
    const sumType = (type, status) => txs
      .filter((t) => t.type === type && (!status || t.status === status))
      .reduce((s, t) => s + t.amount, 0);
    return {
      walletBalance: u.walletBalance,
      pendingCashOut: u.pendingCashOut,
      todayCommission,
      totalCommission,
      activeProjects: active.length,
      completedProjects: list.filter((o) => o.status === 'completed').length,
      totalActivated: list.reduce((s, o) => s + o.activationAmount, 0),
      totalCashIn: sumType('demo_cash_in', 'completed') + sumType('welcome_bonus', 'completed'),
      totalCashOut: load().cashouts.filter((c) => c.userId === u.id && c.status === 'completed').reduce((s, c) => s + c.amount, 0),
      referrals: load().referrals.filter((r) => r.referrerId === u.id).length,
    };
  }

  function addTx(partial) {
    db.transactions.unshift({
      id: nextId('tx'),
      userId: db.user.id,
      status: 'completed',
      createdAt: new Date().toISOString(),
      referenceId: '',
      ...partial,
    });
  }

  function activate(projectId) {
    load();
    const u = db.user;
    if (u.accountStatus === 'pending') {
      return { ok: false, error: 'Your account is pending admin approval.' };
    }
    if (u.accountStatus === 'blocked') {
      return { ok: false, error: 'This account is blocked.' };
    }
    if (u.accountStatus === 'suspended') {
      return { ok: false, error: 'Account suspended. Contact support.' };
    }
    const project = db.projects.find((p) => p.id === projectId && p.status === 'active');
    if (!project) return { ok: false, error: 'This project is not available.' };
    const already = db.orders.some((o) => o.userId === u.id && o.projectId === projectId && o.status === 'active');
    if (already) return { ok: false, error: 'You already have an active order for this project.' };
    if (u.walletBalance < project.activationAmount) {
      return { ok: false, error: 'Insufficient balance. Add funds to your wallet.', code: 'balance' };
    }

    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + project.durationDays);
    const order = {
      id: nextId('ord'),
      userId: u.id,
      projectId: project.id,
      projectName: project.name,
      image: project.image,
      activationAmount: project.activationAmount,
      dailyCommission: project.dailyCommission,
      durationDays: project.durationDays,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      daysCompleted: 0,
      earnedCommission: 0,
      remainingCommission: project.totalCommission,
      status: 'active',
      createdAt: start.toISOString(),
    };
    u.walletBalance -= project.activationAmount;
    db.orders.unshift(order);
    addTx({
      type: 'project_activation',
      amount: project.activationAmount,
      direction: 'debit',
      description: `Activated ${project.name}`,
      referenceId: order.id,
    });
    save();
    return { ok: true, orderId: order.id };
  }

  function creditDue() {
    load();
    const today = dayKey(0);
    let credited = 0;
    db.orders.filter((o) => o.userId === db.user.id && o.status === 'active').forEach((order) => {
      let guard = 0;
      while (order.daysCompleted < order.durationDays && guard < 400) {
        guard += 1;
        const next = addDays(order.startDate, order.daysCompleted + 1);
        if (next > today) break;
        const dup = db.commissions.some((c) => c.orderId === order.id && c.date === next);
        if (dup) {
          order.daysCompleted += 1;
          continue;
        }
        order.daysCompleted += 1;
        order.earnedCommission += order.dailyCommission;
        order.remainingCommission = Math.max(0, order.remainingCommission - order.dailyCommission);
        db.user.walletBalance += order.dailyCommission;
        db.commissions.unshift({
          id: nextId('comm'),
          userId: db.user.id,
          orderId: order.id,
          projectId: order.projectId,
          projectName: order.projectName,
          amount: order.dailyCommission,
          dayIndex: order.daysCompleted,
          date: next,
          status: 'completed',
        });
        addTx({
          type: 'daily_commission',
          amount: order.dailyCommission,
          direction: 'credit',
          description: `Daily commission · ${order.projectName}`,
          referenceId: order.id,
          createdAt: `${next}T10:00:00.000Z`,
        });
        credited += 1;
        if (order.daysCompleted >= order.durationDays) {
          order.status = 'completed';
          order.remainingCommission = 0;
          break;
        }
      }
    });
    save();
    return { ok: true, credited, today };
  }

  function addDays(iso, days) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function nextCommissionLabel(order) {
    if (order.status !== 'active') return '—';
    const next = addDays(order.startDate, order.daysCompleted + 1);
    if (next === dayKey(0)) return 'Today';
    if (next === dayKey(-1)) return 'Tomorrow';
    return next;
  }

  function cashIn(amount) {
    load();
    const value = Number(amount);
    if (!value || value <= 0) return { ok: false, error: 'Enter an amount greater than 0.' };
    db.user.walletBalance += value;
    addTx({
      type: 'demo_cash_in',
      amount: value,
      direction: 'credit',
      description: 'USDT TRC20 cash in',
      referenceId: nextId('cin'),
    });
    save();
    return { ok: true };
  }

  function saveWithdrawal(payload) {
    load();
    db.withdrawal = { ...db.withdrawal, ...payload };
    if (payload.bank) db.withdrawal.bank = { ...db.withdrawal.bank, ...payload.bank };
    save();
    return { ok: true };
  }

  function cashOut({ amount, accountId, password }) {
    load();
    const u = db.user;
    if (u.accountStatus === 'pending') {
      return { ok: false, error: 'Your account is pending admin approval.' };
    }
    if (u.accountStatus === 'blocked') {
      return { ok: false, error: 'This account is blocked.' };
    }
    const value = Number(amount);
    if (!value || value <= 0) return { ok: false, error: 'Enter a cash out amount.' };
    if (value < db.settings.minCashOutAmount) {
      return { ok: false, error: `Minimum cash out is ${money(db.settings.minCashOutAmount)}.` };
    }
    if (value > u.walletBalance) return { ok: false, error: 'Amount is higher than your available balance.' };
    if (!u.withdrawalPassword) return { ok: false, error: 'Set a withdrawal password first.' };
    if (String(password) !== String(u.withdrawalPassword)) {
      return { ok: false, error: 'Invalid withdrawal password.' };
    }
    const account = (db.withdrawal.accounts || []).find((a) => a.id === accountId);
    if (!account) return { ok: false, error: 'Select a bound account.' };
    const method = account.kind === 'bank' ? 'Bank account' : (account.network || 'Crypto');
    const dest = accountDestination(account);
    if (!dest) return { ok: false, error: 'That account is missing details.' };

    u.walletBalance -= value;
    u.pendingCashOut += value;
    const id = nextId('co');
    db.cashouts.unshift({
      id,
      userId: u.id,
      userName: u.fullName,
      mobile: u.mobile,
      amount: value,
      method,
      destination: dest,
      status: 'pending',
      rejectionReason: '',
      requestedAt: new Date().toISOString(),
      processedAt: null,
    });
    addTx({
      type: 'cash_out',
      amount: value,
      direction: 'debit',
      description: `Cash out · ${method}`,
      status: 'pending',
      referenceId: id,
    });
    save();
    return { ok: true, id };
  }

  function accounts() {
    load();
    return db.withdrawal.accounts.slice();
  }

  function addAccount(payload) {
    load();
    const kind = payload.kind === 'bank' ? 'bank' : 'crypto';
    let account;
    if (kind === 'crypto') {
      const network = payload.network === 'USDT BEP20' ? 'USDT BEP20' : 'USDT TRC20';
      const address = String(payload.address || '').trim();
      if (address.length < 8) return { ok: false, error: 'Enter a wallet address.' };
      account = { id: nextId('wd'), kind: 'crypto', network, address };
    } else {
      const holder = String(payload.holder || '').trim();
      const bankName = String(payload.bankName || '').trim();
      const iban = String(payload.iban || '').trim().replace(/\s+/g, '');
      const accountNumber = String(payload.accountNumber || '').trim();
      if (!holder || !bankName) return { ok: false, error: 'Account holder and bank name are required.' };
      if (!iban && !accountNumber) return { ok: false, error: 'Enter an IBAN or account number.' };
      account = { id: nextId('wd'), kind: 'bank', holder, bankName, iban, accountNumber };
    }
    db.withdrawal.accounts.push(account);
    save();
    return { ok: true, account };
  }

  function removeAccount(id) {
    load();
    const before = db.withdrawal.accounts.length;
    db.withdrawal.accounts = db.withdrawal.accounts.filter((a) => a.id !== id);
    if (db.withdrawal.accounts.length === before) return { ok: false, error: 'Account not found.' };
    save();
    return { ok: true };
  }

  function accountDestination(account) {
    if (!account) return '';
    if (account.kind === 'crypto') return account.address || '';
    return [account.bankName, account.iban || account.accountNumber].filter(Boolean).join(' · ');
  }

  function destinationFor(method) {
    const list = load().withdrawal.accounts || [];
    if (method === 'Bank' || method === 'Bank account') {
      return accountDestination(list.find((a) => a.kind === 'bank'));
    }
    return accountDestination(list.find((a) => a.kind === 'crypto' && a.network === method));
  }

  function updateProfile({ fullName, mobile }) {
    load();
    if (!fullName || !mobile) return { ok: false, error: 'Name and mobile are required.' };
    db.user.fullName = fullName;
    db.user.mobile = mobile;
    writeSessionMember({ fullName, mobile });
    save();
    return { ok: true };
  }

  function changePassword(current, next) {
    load();
    if (current !== db.user.password) return { ok: false, error: 'Current password is incorrect.' };
    if (!next || next.length < 6) return { ok: false, error: 'New password must be at least 6 characters.' };
    db.user.password = next;
    save();
    return { ok: true };
  }

  function setWithdrawalPassword(current, next) {
    load();
    if (db.user.withdrawalPassword && current !== db.user.withdrawalPassword) {
      return { ok: false, error: 'Current withdrawal password is incorrect.' };
    }
    if (!next || String(next).length < 6) return { ok: false, error: 'Use at least 6 characters.' };
    db.user.withdrawalPassword = String(next);
    save();
    return { ok: true };
  }

  function maskAccount(num) {
    const s = String(num || '');
    if (s.length <= 4) return s;
    return `${'X'.repeat(Math.max(4, s.length - 4))}${s.slice(-4)}`;
  }

  /* admin */
  function requireAdmin() {
    return sessionStorage.getItem('ps_admin') === '1';
  }

  function adminLogin() {
    return { ok: false, error: 'Incorrect admin ID or password.' };
  }

  function adminLogout() {
    sessionStorage.removeItem('ps_admin');
  }

  function setUserStatus(userId, status) {
    load();
    const row = db.users.find((u) => u.id === userId);
    if (!row) return { ok: false, error: 'User not found.' };
    row.accountStatus = status;
    if (db.user.id === userId) db.user.accountStatus = status;
    save();
    return { ok: true };
  }

  function adjustWallet(userId, amount, reason) {
    load();
    const value = Number(amount);
    if (!value || !reason) return { ok: false, error: 'Amount and reason are required.' };
    const row = db.users.find((u) => u.id === userId);
    if (!row) return { ok: false, error: 'User not found.' };
    row.walletBalance += value;
    if (db.user.id === userId) {
      db.user.walletBalance += value;
      addTx({
        type: 'adjustment',
        amount: Math.abs(value),
        direction: value >= 0 ? 'credit' : 'debit',
        description: `Admin adjustment · ${reason}`,
        referenceId: 'admin',
      });
    }
    save();
    return { ok: true };
  }

  function upsertProject(project) {
    load();
    const daily = Number(project.dailyCommission);
    const days = Number(project.durationDays);
    const record = {
      id: project.id || nextId('proj'),
      name: project.name,
      image: project.image || db.projects[0].image,
      description: project.description || '',
      activationAmount: Number(project.activationAmount),
      dailyCommission: daily,
      commissionFrequency: 'daily',
      durationDays: days,
      totalCommission: daily * days,
      status: project.status || 'active',
      tag: project.tag || 'Custom',
    };
    if (project.address != null) record.address = project.address;
    if (project.developer != null) record.developer = project.developer;
    const idx = db.projects.findIndex((p) => p.id === record.id);
    if (idx >= 0) db.projects[idx] = { ...db.projects[idx], ...record, id: db.projects[idx].id };
    else db.projects.push(record);
    save();
    return { ok: true };
  }

  function setProjectStatus(id, status) {
    load();
    const p = db.projects.find((x) => x.id === id);
    if (!p) return { ok: false };
    p.status = status;
    save();
    return { ok: true };
  }

  function setCashoutStatus(id, status, reason) {
    load();
    const req = db.cashouts.find((c) => c.id === id);
    if (!req) return { ok: false, error: 'Request not found.' };
    if (req.status !== 'pending' && req.status !== 'processing') {
      return { ok: false, error: 'This request is already closed.' };
    }
    req.processedAt = new Date().toISOString();
    const tx = db.transactions.find((t) => t.referenceId === id);
    if (status === 'completed') {
      req.status = 'completed';
      const owner = db.users.find((u) => u.id === req.userId);
      if (owner) owner.pendingCashOut = Math.max(0, owner.pendingCashOut - req.amount);
      if (db.user.id === req.userId) {
        db.user.pendingCashOut = Math.max(0, db.user.pendingCashOut - req.amount);
        if (tx) tx.status = 'completed';
      }
    } else if (status === 'rejected') {
      if (!reason) return { ok: false, error: 'A rejection reason is required.' };
      req.status = 'rejected';
      req.rejectionReason = reason;
      const owner = db.users.find((u) => u.id === req.userId);
      if (owner) {
        owner.pendingCashOut = Math.max(0, owner.pendingCashOut - req.amount);
        owner.walletBalance += req.amount;
      }
      if (db.user.id === req.userId) {
        db.user.pendingCashOut = Math.max(0, db.user.pendingCashOut - req.amount);
        db.user.walletBalance += req.amount;
        if (tx) tx.status = 'failed';
        addTx({
          type: 'refund',
          amount: req.amount,
          direction: 'credit',
          description: `Cash out rejected · ${reason}`,
          referenceId: id,
        });
      }
    } else {
      req.status = status;
    }
    save();
    return { ok: true };
  }

  function updateSettings(patch) {
    load();
    db.settings = { ...db.settings, ...patch };
    if (patch.welcomeBonusAmount) db.settings.welcomeBonusAmount = Number(patch.welcomeBonusAmount);
    if (patch.minCashOutAmount) db.settings.minCashOutAmount = Number(patch.minCashOutAmount);
    save();
    return { ok: true };
  }

  return {
    load, save, reset, money, user, settings, projects, projectById, orders, orderById,
    commissionsFor, allCommissions, transactions, stats,
    activate, creditDue, nextCommissionLabel, cashIn, saveWithdrawal, cashOut,
    updateProfile, changePassword, setWithdrawalPassword, maskAccount, destinationFor,
    accounts, addAccount, removeAccount,
    withdrawal: () => load().withdrawal,
    applySession,
    referrals: () => load().referrals.filter((r) => r.referrerId === user().id),
    cashouts: () => load().cashouts,
    users: () => load().users,
    allOrders: () => load().orders,
    requireAdmin, adminLogin, adminLogout, setUserStatus, adjustWallet, upsertProject,
    setProjectStatus, setCashoutStatus, updateSettings, dayKey,
  };
})();
