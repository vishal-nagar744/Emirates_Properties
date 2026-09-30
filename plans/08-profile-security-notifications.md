# Module 08: Member Profile, Security & In-App Notifications

## Objective
Build member profile settings (`/pages/profile.html`), security management (login & withdrawal password updates), referral code overview, account status badges, and the in-app notification center.

---

## 1. Profile Page (`pages/profile.html`)
- Display User Information:
  - Full Name
  - Mobile Number
  - Member ID / Account ID
  - Unique Referral Code (with `Copy` button)
  - Account Status Badge (`Active`, `Frozen`, `Suspended`)
  - Registration Date
- Actions:
  - `Edit Profile`: Toggle inputs to editable state and save updates.
  - `Change Password`: Modal to update account login password.
  - `Withdrawal Password`: Modal to set or update withdrawal password.
  - `Withdrawal Details`: Quick jump to bind/update saved crypto & bank details.
  - `Logout`: Clear session and redirect to landing page.

---

## 2. Referral Overview Page / Tab
- Unique Referral Code: `VIKAS82K` (Copy button)
- Unique Referral Link: `yourdomain.com/pages/signup.html?ref=VIKAS82K` (Copy link)
- Referral Statistics:
  - Total Referrals Count
  - Today's Referrals Count
  - This Month Count
- **Referral User History Table**:
  - Referred User Name/Mobile (masked for privacy)
  - Registration Date
  - Status (`Active`)
- *(Reminder: Do NOT display referral earnings or commission, as no referral commission exists).*

---

## 3. Account Status & Restrictions Handling
- **Active**: Normal access to all features.
- **Frozen**: Can log in and view dashboard, but activating new projects or requesting Cash Out is disabled with notice: `"Your account is currently frozen. Please contact support."`
- **Suspended**: Login attempt blocked with message: `"Account suspended. Contact support."`

---

## 4. In-App Notification System
- Notification Bell/Icon in dashbar with badge count.
- Notification Drawer / Modal listing recent events:
  - Welcome bonus credited
  - Project activated
  - Daily commission received
  - Project completed
  - Cash Out request submitted / approved / rejected
  - New user joined using your referral code
- Mark all as read / Clear notifications buttons.

---

## 5. Verification Checklist
- [ ] Test updating full name and mobile number.
- [ ] Test setting and updating withdrawal password.
- [ ] Verify copying referral link pre-fills invitation code on signup.
- [ ] Verify frozen user restrictions on project activation and cash out.
- [ ] Verify notifications rendered in notification drawer.
