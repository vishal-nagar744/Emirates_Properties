window.EP_ENV = { API_BASE: "https://ioplolyuyu.onrender.com" };
window.apiBase = function apiBase() {
  return String((window.EP_ENV && window.EP_ENV.API_BASE) || "https://ioplolyuyu.onrender.com").replace(/\/$/, '');
};
