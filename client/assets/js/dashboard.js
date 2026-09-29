/* ============================================================
   dashboard.js — Dashboard page logic
   Emirates Properties | PrimeSpace
   ============================================================ */

async function initDashboard() {
  // TODO: Load live data from DashboardAPI.getOverview()
  // const result = await DashboardAPI.getOverview();
  // if (result.ok) renderDashboard(result.data);

  // Greeting based on time of day
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.querySelectorAll('.js-greeting').forEach((el) => {
    el.textContent = greeting + ', Alex.';
  });
  document.querySelectorAll('.js-greeting-short').forEach((el) => {
    el.textContent = greeting + ', Alex';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboard);
} else {
  initDashboard();
}
