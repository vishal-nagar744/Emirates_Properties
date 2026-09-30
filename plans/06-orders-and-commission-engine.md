# Module 06: Order Lifecycle & Daily Commission Engine

## Objective
Implement dedicated Order management pages (`/pages/orders.html`), single Order Details view, and the background daily commission processing engine.

---

## 1. Orders Page (`pages/orders.html`)
- Display table of all user project activations:
  - Order ID
  - Project Name
  - Activation Amount
  - Daily Commission
  - Duration & Progress (e.g. Day 12 / 30)
  - Order Date
  - Earned Commission vs Remaining Commission
  - Status Badge (`Active`, `Completed`, `Cancelled`)
- Filter options: `All`, `Active`, `Completed`

---

## 2. Order Details & History Modal/View
- Complete single-order breakdown:
  - Order ID, Project Info, Activation Amount, Daily Commission, Duration
  - Start Date & End Date
  - Total Earned & Remaining Commission
  - Next Commission Schedule
  - Status Badge
- **Commission Log Table**:
  - Date
  - Day Number (e.g. Day 1, Day 2...)
  - Commission Amount (+ ₹10)
  - Status (`Completed`)

---

## 3. Daily Commission Engine Rules
1. **Automation / Trigger**:
   - Commission generation checks all orders with `status === "active"`.
2. **Business Constraints**:
   - **No Duplicate Commissions**: Commission must NEVER be generated twice for the same date/order.
   - **Active Orders Only**: Commissions are ONLY generated while `status === "active"`.
   - **Duration Expiration**: When `daysCompleted === durationDays`:
     - Order status transitions to `"completed"`.
     - Commission generation stops permanently for that order.
   - **Historical Integrity**: Changes made by admin to a project template do NOT affect existing active orders. Existing orders retain their locked-in activation terms.
3. **Ledger & Notification Updates**:
   - When commission is generated for an order:
     - Increase `user.walletBalance` by `dailyCommission`.
     - Record `daily_commission` credit in `wallet_transactions`.
     - Increment `order.daysCompleted` and `order.earnedCommission`.
     - Decrement `order.remainingCommission`.
     - Create notification: `"Daily commission of ₹10 received for Premium Project."`

---

## 4. Verification Checklist
- [ ] Test manual or simulated day tick for active orders.
- [ ] Verify commission added to user wallet balance correctly.
- [ ] Verify duplicate prevention (running trigger twice on same day yields 1 credit).
- [ ] Verify order automatically marks as `completed` on reaching duration end date.
