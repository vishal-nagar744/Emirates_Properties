window.EP_ENV = { API_BASE: "https://ioplolyuyu.onrender.com" };
window.apiBase = function apiBase() {
  return String((window.EP_ENV && window.EP_ENV.API_BASE) || "https://ioplolyuyu.onrender.com").replace(/\/$/, '');
};

// Proactively wake up Render free-tier instance on page load so it's ready when user interacts
(function warmRender() {
  try {
    const base = window.apiBase();
    if (base && !window.__ep_warm_triggered) {
      window.__ep_warm_triggered = true;
      fetch(`${base}/api/health`, { method: 'GET', mode: 'cors' }).catch(() => {});
    }
  } catch (_) {}
})();
