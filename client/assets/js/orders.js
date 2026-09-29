/* ============================================================
   orders.js — Order activity page logic
   Emirates Properties | PrimeSpace
   ============================================================ */

async function initOrders() {
  // TODO: Load orders from OrdersAPI.getAll()
  // const result = await OrdersAPI.getAll();
  // if (result.ok) renderOrdersTable(result.data);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOrders);
} else {
  initOrders();
}
