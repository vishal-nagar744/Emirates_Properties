/* ============================================================
   wallet.js — Wallet page logic
   Emirates Properties | PrimeSpace
   ============================================================ */

async function initWallet() {
  // TODO: Load wallet balance from WalletAPI.getBalance()
  // const result = await WalletAPI.getBalance();
  // if (result.ok) renderWallet(result.data);

  // Request action button
  const actionBtn = document.getElementById('wallet-action-btn');
  if (actionBtn) {
    actionBtn.addEventListener('click', async () => {
      // TODO: const result = await WalletAPI.requestAction({ type: 'withdraw' });
      // if (result.ok) toast(result.data.message);
      toast('Wallet action request received — connect WalletAPI.requestAction() when backend is ready.');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWallet);
} else {
  initWallet();
}
