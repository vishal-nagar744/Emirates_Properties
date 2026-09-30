window.EP_ENV = { API_BASE: "http://127.0.0.1:4000" };
window.apiBase = function apiBase() {
  return String((window.EP_ENV && window.EP_ENV.API_BASE) || "http://127.0.0.1:4000").replace(/\/$/, '');
};
