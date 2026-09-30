# Module 09: Admin Panel & Platform Administration

## Objective
Build the comprehensive Admin Panel for complete platform oversight, project CRUD management, user wallet management, Cash Out request approval/rejection, and system settings.

---

## 1. Admin Authentication & Dashboard
- Dedicated Admin Login route (`/pages/admin/login.html`).
- Admin Dashboard Overview (`/pages/admin/dashboard.html`):
  - **Platform KPIs**: Total Users, Active Users, Total Projects, Active Projects, Total Orders, Active Orders, Total Demo Wallet Balance, Total Demo Commission Generated, Pending Cash Outs, Completed Cash Outs, Total Referrals.
  - Quick summary charts & tables.

---

## 2. Admin User & Wallet Management
- **User Directory**: Search by Name or Mobile; Filter by Status (`Active`, `Frozen`, `Suspended`).
- **User Detail Inspection**:
  - View user profile & referral tree (who referred them, users referred by them).
  - View user's wallet balance, activated orders, commission log, cash in history, cash out history.
  - Actions: `Freeze User`, `Unfreeze User`, `Suspend User`.
- **Manual Wallet Balance Adjustment**:
  - Input: Amount (+ / -), Reason, Admin Note.
  - Creates `adjustment` transaction in `wallet_transactions`.

---

## 3. Admin Project CRUD Management
- **Create / Edit Project**:
  - Project Name, Image URL, Description
  - Activation Amount (e.g. ₹1,000)
  - Daily Commission (e.g. ₹10)
  - Duration (e.g. 30 Days)
  - Total Commission (auto-calculated: `dailyCommission * durationDays`)
  - Status (`Active` / `Inactive`)
- **Project List**: Toggle active/inactive state, edit parameters, view active order count per project.
- **Rule Enforcer**: Existing active user orders retain original project terms. Changes apply only to new project activations.

---

## 4. Admin Cash Out Request Management
- View all user withdrawal requests categorized by status tabs: `Pending`, `Processing`, `Completed`, `Rejected`.
- Each request shows: User Name & Mobile, Amount, Method (USDT TRC20 / BEP20 / Bank), Saved Details, Request Time.
- Actions:
  - **Approve**: Mark status as `Completed`, deduct from `pendingCashOut`.
  - **Reject**: Require Rejection Reason input. Return amount from `pendingCashOut` back to `availableBalance`, update request status to `Rejected`, record refund, and send notification to user.

---

## 5. Admin Referral Tracking
- Search referral codes across platform.
- View referrer-referee mapping and total count per user.
- *(Confirmation: No referral commission settings or referral payout settings).*

---

## 6. Admin System Settings
- Platform Name
- Welcome Bonus Amount (e.g. ₹100 / AED 100)
- Minimum Cash Out Amount (e.g. ₹500)
- Demo Cash In USDT TRC20 Address
- Support Telegram Username
- Currency Symbol (₹ / AED)

---

## 7. Verification Checklist
- [ ] Test admin authentication.
- [ ] Test creating, editing, activating, and deactivating projects.
- [ ] Test approving a Cash Out request and verifying user wallet balance state.
- [ ] Test rejecting a Cash Out request with reason and verifying refund to user wallet.
- [ ] Test freezing a user account and checking restriction enforcement.
- [ ] Test updating system settings (Welcome bonus amount, Min cash out, Telegram support link).
