# Module 05: Projects Catalog & Activation Flow

## Objective
Implement the Projects catalog page (`/pages/projects.html`), Project Details page (`/pages/project-details.html`), and the Project Activation lifecycle.

---

## 1. Projects Catalog (`pages/projects.html`)
- Display full catalogue of available reward projects:
  1. **Premium Project** — Activation: ₹1,000 | Daily: ₹10 | Duration: 30 Days | Total: ₹300
  2. **Smart Gadget Project** — Activation: ₹2,000 | Daily: ₹25 | Duration: 60 Days | Total: ₹1,500
  3. **Lifestyle Project** — Activation: ₹1,500 | Daily: ₹18 | Duration: 45 Days | Total: ₹810
  4. **Premium Project Plus** — Activation: ₹3,000 | Daily: ₹40 | Duration: 90 Days | Total: ₹3,600
- **Live Search & Filtering**: Instant filter input by name or location.
- **Project Card Details**: Image, Tag badge, Heart wishlist button, Name, Activation Amount, Daily Commission, Duration, Total Commission, CTA (`View Project →`).

---

## 2. Project Details (`pages/project-details.html`)
- Complete information breakdown before activation:
  - Project Title & High-resolution Image
  - Detailed Description & Project Type
  - Activation Amount
  - Daily Commission & Commission Frequency (Daily)
  - Commission Duration (e.g. 30 Days)
  - Total Possible Commission
  - Status Indicator (`Available`)
- **Action Button**: `Continue with project →`

---

## 3. Project Activation Confirmation Flow
When clicking `Continue with project`:

1. **Check User Balance**:
   - Compare `user.walletBalance` against `project.activationAmount`.
   - If `walletBalance < activationAmount`, show error: `"Insufficient demo balance. Please add demo funds to your wallet."` with `Cash In` button.

2. **Display Activation Modal**:
   ```text
   Confirm Project Activation

   Project:                Premium Project
   Activation Amount:      ₹1,000
   Daily Commission:       ₹10
   Duration:               30 Days
   Total Possible Reward:  ₹300
   
   Available Demo Balance: ₹1,250
   Balance After:          ₹250

   [ Cancel ]  [ Confirm Activation ]
   ```

3. **Execute Activation**:
   - Deduct `activationAmount` from `user.walletBalance`.
   - Create new `Order` record:
     - `status`: `"active"`
     - `startDate`: `now()`
     - `endDate`: `now() + durationDays`
     - `daysCompleted`: `0`
     - `earnedCommission`: `0`
     - `remainingCommission`: `totalCommission`
   - Record `project_activation` debit in `wallet_transactions`.
   - Generate notification: `"Project activated successfully! Daily commission will begin tomorrow."`
   - Redirect user to Order Details (`/pages/orders.html`).

---

## 4. Verification Checklist
- [ ] Test project activation with sufficient balance.
- [ ] Test project activation with insufficient balance and verify error state.
- [ ] Verify wallet balance deduction upon activation.
- [ ] Verify order creation and project status transition to `active`.
