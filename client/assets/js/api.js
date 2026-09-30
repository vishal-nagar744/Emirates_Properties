/* ============================================================
   PRIMESPACE — API SERVICE LAYER
   Emirates Properties | Dubai, UAE

   Centralised HTTP layer — swap BASE_URL and uncomment the
   real fetch() calls when the backend is connected.
   The UI pages never need to change.
   ============================================================ */

/* ── Configuration ─────────────────────────────────────────── */
const API_CONFIG = {
  BASE_URL: (window.apiBase ? window.apiBase() : 'http://127.0.0.1:4000') + '/api',
  TIMEOUT:  10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
};

/* ── HTTP helper ────────────────────────────────────────────── */
async function _request(method, endpoint, body = null, authToken = null) {
  const url     = `${API_CONFIG.BASE_URL}${endpoint}`;
  const headers = { ...API_CONFIG.HEADERS };

  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  options.signal = controller.signal;

  try {
    const res  = await fetch(url, options);
    clearTimeout(tid);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return { ok: true, data };
  } catch (err) {
    clearTimeout(tid);
    return { ok: false, error: err.message };
  }
}

/* ── Auth Token Helpers ─────────────────────────────────────── */
const Auth = {
  getToken:   () => localStorage.getItem('ps_token'),
  setToken:   (t) => localStorage.setItem('ps_token', t),
  clearToken: () => localStorage.removeItem('ps_token'),
  isLoggedIn: () => !!localStorage.getItem('ps_token'),
};

/* ── Auth API ───────────────────────────────────────────────── */
const AuthAPI = {
  async login(mobile, password) {
    return _request('POST', '/auth/login', { mobile, password });
  },

  async signup(fullName, mobile, password, invitationCode = null) {
    return _request('POST', '/auth/signup', { fullName, mobile, password, invitationCode });
  },

  async forgotPassword(mobile) {
    return _request('POST', '/auth/forgot-password', { mobile });
  },

  async logout() {
    const token = Auth.getToken();
    Auth.clearToken();
    return _request('POST', '/auth/logout', {}, token);
  },
};

/* ── Dashboard API ──────────────────────────────────────────── */
const DashboardAPI = {
  async getOverview() {
    // TODO: return _request('GET', '/dashboard', null, Auth.getToken());
    return { ok: true, data: {} };
  },
};

/* ── Projects API ───────────────────────────────────────────── */
const ProjectsAPI = {
  async getAll(filters = {}) {
    // TODO: return _request('GET', '/projects?' + new URLSearchParams(filters), null, Auth.getToken());
    return { ok: true, data: [] };
  },

  async getById(projectId) {
    // TODO: return _request('GET', `/projects/${projectId}`, null, Auth.getToken());
    return { ok: true, data: null };
  },

  async submit(projectId) {
    // TODO: return _request('POST', `/projects/${projectId}/submit`, {}, Auth.getToken());
    return { ok: true, data: { message: 'Project submission received.' } };
  },
};

/* ── Orders API ─────────────────────────────────────────────── */
const OrdersAPI = {
  async getAll() {
    // TODO: return _request('GET', '/orders', null, Auth.getToken());
    return { ok: true, data: [] };
  },
};

/* ── Earnings API ───────────────────────────────────────────── */
const EarningsAPI = {
  async getSummary() {
    // TODO: return _request('GET', '/earnings/summary', null, Auth.getToken());
    return { ok: true, data: {} };
  },

  async export() {
    // TODO: return _request('GET', '/earnings/export', null, Auth.getToken());
    return { ok: true, data: { url: '#' } };
  },
};

/* ── Wallet API ─────────────────────────────────────────────── */
const WalletAPI = {
  async getBalance() {
    // TODO: return _request('GET', '/wallet', null, Auth.getToken());
    return { ok: true, data: {} };
  },

  async requestAction(payload) {
    // TODO: return _request('POST', '/wallet/action', payload, Auth.getToken());
    return { ok: true, data: { message: 'Wallet action request received.' } };
  },
};

/* ── Profile API ────────────────────────────────────────────── */
const ProfileAPI = {
  async get() {
    // TODO: return _request('GET', '/profile', null, Auth.getToken());
    return { ok: true, data: {} };
  },

  async update(payload) {
    // TODO: return _request('PUT', '/profile', payload, Auth.getToken());
    return { ok: true, data: { message: 'Profile updated successfully.' } };
  },
};
