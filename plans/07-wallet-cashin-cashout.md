# Module 07: Wallet, Cash In & Cash Out System

## Objective
Implement central Wallet management (`/pages/wallet.html`), simulated USDT TRC20 Cash In with support contact, Cash Out request processing, and withdrawal details binding.

---

## 1. Central Wallet Overview (`pages/wallet.html`)
- **Main Balance Display**:
  - Available Demo Balance (₹ / AED)
  - Total Demo Cash In
  - Total Commission Earned
  - Total Cash Out
  - Pending Cash Out
- **Primary Actions**:
  - `[ Cash In ]`
  - `[ Cash Out ]`

---

## 2. Wallet Transactions History
- Full audit log of user wallet transactions.
- Filter by transaction type: `All`, `Welcome Bonus`, `Demo Cash In`, `Project Activation`, `Daily Commission`, `Cash Out`, `Refund`, `Adjustment`.
- Display: Transaction Type, Description, Amount, Direction (Credit/Debit), Status, Date/Time, Reference.

---

## 3. Cash In Flow (`Simulated USDT TRC20`)
- **Display Demo Deposit Info**:
  - Network: `USDT TRC20`
  - Demo Deposit Address: `TXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (with `Copy Address` button).
  - Clearly marked banner: *"Simulation / Demo Mode — Do not send real funds."*
  - **Support Contact Button**: `Contact Telegram Team` (opens configured demo Telegram support link).
- **Simulated Cash In Action**:
  - User can submit a simulated deposit amount for demo testing.
  - Generates `demo_cash_in` transaction in `pending` or `completed` state according to platform rules.

---

## 4. Cash Out & Withdrawal Details Binding
Before requesting Cash Out, the user must bind their withdrawal details:

### Supported Withdrawal Methods
1. **USDT TRC20**: Wallet Address
2. **USDT BEP20**: Wallet Address
3. **Bank**: Full Name, Mobile Number, Account Number, IFSC Code, Branch

### Withdrawal Password Requirement
- User must set a 6-digit or secure **Withdrawal Password** in security settings before requesting Cash Out.

---

## 5. Cash Out Request Execution
When requesting Cash Out:
1. Select saved method (`USDT TRC20` / `USDT BEP20` / `Bank`).
2. Input Cash Out Amount (must be `≥ minCashOut` and `≤ availableBalance`).
3. Enter **Withdrawal Password**.
4. Validate withdrawal password:
   - If incorrect: show error `"Invalid withdrawal password."`
5. On successful submission:
   - Move amount from `availableBalance` to `pendingCashOut`.
   - Create `cash_out_requests` record (`status: "pending"`).
   - Record `cash_out` transaction (`status: "pending"`).
   - Generate notification: `"Cash Out request for ₹500 submitted successfully."`

---

## 6. Verification Checklist
- [ ] Test copying demo USDT TRC20 deposit address.
- [ ] Test binding USDT TRC20, USDT BEP20, and Bank details.
- [ ] Test withdrawal password verification on Cash Out.
- [ ] Verify Cash Out fails if amount exceeds available balance.
- [ ] Verify Cash Out request transitions to pending status.
