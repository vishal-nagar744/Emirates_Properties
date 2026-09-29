/* ============================================================
   earnings.js — Earnings summary page logic
   Emirates Properties | PrimeSpace
   ============================================================ */

async function initEarnings() {
  // TODO: Load earnings data from EarningsAPI.getSummary()
  // const result = await EarningsAPI.getSummary();
  // if (result.ok) renderEarnings(result.data);

  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      // TODO: const result = await EarningsAPI.export();
      // if (result.ok) window.open(result.data.url);
      toast('Export prepared — connect EarningsAPI.export() when backend is ready.');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEarnings);
} else {
  initEarnings();
}
