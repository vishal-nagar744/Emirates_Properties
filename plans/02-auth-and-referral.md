# Module 02: Auth, User Management & Referral System

## Objective
Implement simple user registration, login, forgot password, automatic unique referral code generation, referral tracking, and welcome bonus crediting.

---

## 1. Registration Flow (`/pages/signup.html`)
### Required Fields
- **Full Name**: Text input
- **Mobile Number**: UAE/India mobile input
- **Password**: Password input (with show/hide toggle)
- **Confirm Password**: Password verification
- **Invitation Code**: Optional referral code

### Validation Rules
- All required fields must be non-empty.
- Password and Confirm Password must match.
- If Invitation Code is provided, check if valid:
  - If valid, link new user to referrer (`referredBy = referrerUserId`).
  - If invalid, display clean inline warning.
- Check mobile number uniqueness.

### Post-Registration Execution
1. Generate **Unique Referral Code** (e.g. `VIKAS82K`).
2. Create user record with `accountStatus = "active"`.
3. Credit configured **Welcome Bonus** (e.g. ₹100 / AED 100 demo balance) to user's wallet.
4. Record `welcome_bonus` wallet transaction.
5. Create initial notification: `"Welcome bonus credited to your demo wallet!"`
6. Automatically log in or redirect user to Login page with success message.

---

## 2. Automatic Referral System Rules
- **No Referral Commission**: Referral system tracks referral relationship ONLY (`referrer`, `referred user`, `date`, `referral count`).
- Do **NOT** generate referral earnings, referral commission, or referral payout transactions.
- Format referral URL: `yourdomain.com/pages/signup.html?ref=VIKAS82K`.
- Pre-fill invitation code field automatically if `?ref=...` is present in URL.

---

## 3. Login Flow (`/pages/login.html`)
### Fields
- Mobile Number
- Password
- Remember session checkbox
- Show/hide password button

### Post-Login Action
- Validate credentials against mock user store.
- Store session token (`ps_token`) in `localStorage` or `sessionStorage`.
- Redirect to Dashboard (`/pages/dashboard.html`).

---

## 4. Forgot Password (`/pages/forgot.html`)
- Fields: Mobile Number.
- Action: Show success toast notification indicating reset instructions sent.

---

## 5. Verification Checklist
- [ ] Test registration with valid & invalid passwords.
- [ ] Test registration with valid & invalid invitation codes.
- [ ] Verify unique referral code generated for every user.
- [ ] Verify welcome bonus credited to wallet on registration.
- [ ] Verify NO referral commission is generated.
- [ ] Verify pre-filling invitation code when visiting via `?ref=CODE`.
