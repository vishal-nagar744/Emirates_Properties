# PROJECT REWARDS PLATFORM

## Product Requirements & UI/UX Specification

## 1. PROJECT OVERVIEW

Build a modern web platform for a **practice/demo project** where users can browse projects, activate a project using simulated wallet balance, and receive a configured daily commission for a defined duration.

The platform should include:

* Public landing page
* Registration/Login
* Welcome bonus
* User dashboard
* Projects
* Project details
* Orders
* Wallet
* Cash In
* Cash Out
* Withdrawal details
* Earnings/commission history
* Profile/settings
* Referral code and referral tracking
* Admin panel

This is a **simulation/practice project**.

No real-money deposits, real cryptocurrency transfers, banking transactions, or real withdrawals should be implemented.

Any USDT addresses, bank information, payment information, or Telegram contact shown in the demo should use clearly marked test/demo data.

---

# 2. BASIC USER FLOW

The complete user journey should be:

```text
Landing Page
      ↓
Signup / Login
      ↓
Welcome Bonus
      ↓
Dashboard
      ↓
Projects
      ↓
Project Details
      ↓
Activate Project
      ↓
Order Created
      ↓
Project Becomes Active
      ↓
Daily Commission
      ↓
Wallet Balance
      ↓
Cash Out
```

The user should always be able to understand:

* What project they activated
* How much they activated it for
* How much commission they receive
* When the next commission is generated
* How long the project remains active
* How much commission they have already received
* How much is remaining
* Their wallet balance
* Their withdrawal details
* Their referral code
* How many users joined through their referral

---

# 3. PROJECT POSITIONING

This is a **practice/demo rewards platform**.

Use terminology such as:

* Projects
* Active Projects
* Orders
* Commission
* Wallet
* Demo Balance
* Project Cycle
* Commission History
* Referral Code

The application should clearly communicate that the system is a simulation/demo wherever appropriate.

---

# 4. LANDING PAGE

The first page users see should be a polished, attractive landing page.

The purpose is to:

* Explain the platform
* Highlight the project/reward concept
* Show featured projects
* Display the welcome bonus
* Encourage registration

## Hero Section

Include:

* Brand/logo
* Strong headline
* Short platform description
* Primary CTA
* Secondary CTA
* Welcome bonus highlight

Example:

> Welcome to [Platform Name]

> Explore projects, activate your selected project, and track your daily rewards from one simple dashboard.

Buttons:

* Get Started
* View Projects

---

# 5. WELCOME BONUS

The landing page should prominently display the simulated welcome bonus.

Example:

```text
WELCOME BONUS

Get ₹100 Demo Bonus
when you create your account.

[ Register Now ]
```

The bonus amount should be configurable.

After successful registration, the configured demo welcome bonus should be reflected in the user's wallet according to the platform rules.

Clearly treat this as **demo balance/bonus**.

---

# 6. LANDING PAGE SECTIONS

Recommended sections:

### Hero

Main introduction and welcome bonus.

### How It Works

```text
01
Create Account

02
Receive Welcome Bonus

03
Choose a Project

04
Activate Project

05
Receive Daily Commission

06
Manage Your Demo Wallet
```

### Featured Projects

Show selected projects.

### Platform Features

Examples:

* Daily Commission Tracking
* Project Management
* Wallet
* Order History
* Secure Account
* Referral Tracking

### FAQ

Basic questions about the platform.

### Footer

Include:

* Home
* Projects
* How It Works
* Terms
* Privacy
* Contact/Support

---

# 7. SIGNUP

Registration should be simple.

Required fields:

```text
Name

Mobile Number

Password

Confirm Password

Invitation Code
```

### Invitation Code

The Invitation Code is optional.

If an existing user shares their referral code, a new user can enter it during registration.

If the invitation code is valid:

```text
New User
    ↓
Registered using User A's code
    ↓
User A becomes the referrer
```

No referral commission is generated.

---

# 8. AUTOMATIC REFERRAL CODE

Every newly registered user should automatically receive their own unique referral code.

Example:

```text
User:
Vikas Nagar

Referral Code:
VIKAS82K
```

The referral code must be unique.

The user should be able to view and copy their code from their account.

Optionally provide a referral link such as:

```text
yourdomain.com/register?ref=VIKAS82K
```

If a new user opens the registration page using this link, the invitation code should be pre-filled.

---

# 9. REFERRAL TRACKING

The platform should track referral relationships.

Example:

```text
User A
Referral Code: VIKAS82K
        ↓
User B registers with VIKAS82K
        ↓
User B is linked to User A
```

The system should maintain:

* Referrer
* Referred user
* Referral date
* Referral status

The user should be able to see how many people joined using their referral code.

---

# 10. NO REFERRAL COMMISSION

There is **no referral commission system currently**.

Referral functionality is limited to:

* Unique referral code
* Optional invitation code during signup
* Referral relationship tracking
* Referral count
* Referral history

Do NOT implement:

* Referral earnings
* Referral commission
* Referral rewards
* Referral payout
* Referral income

The architecture should remain flexible enough that a referral commission feature could potentially be added in the future, but it is **not part of the current project**.

---

# 11. LOGIN

Login should allow users to enter:

* Mobile number
* Password

Include:

* Forgot password
* Remember session
* Show/hide password

---

# 12. USER DASHBOARD

After login, the user enters the dashboard.

The dashboard should provide a complete summary of their account.

## Main Statistics

Display:

```text
Wallet Balance

Today's Commission

Total Commission

Active Projects
```

Additional useful statistics:

```text
Total Activated Amount

Completed Projects

Pending Cash Out

Total Referrals
```

Do not show referral earnings because referral commission does not exist.

---

# 13. DASHBOARD QUICK ACTIONS

Provide prominent actions:

```text
[ Projects ]

[ Orders ]

[ Wallet ]

[ Cash In ]

[ Cash Out ]
```

The most important actions should be easily accessible.

---

# 14. DASHBOARD ACTIVE PROJECTS

Show currently active projects.

Example:

```text
Premium Project

Activated Amount
₹1,000

Daily Commission
₹10

Day 17 / 30

Progress
██████████████░░░░

Earned
₹170

Remaining
₹130

Next Commission
Tomorrow

[ View Details ]
```

---

# 15. PROJECTS PAGE

This is the main project listing page.

Each project should have:

* Project image/icon
* Project name
* Short description
* Activation amount
* Daily commission
* Duration
* Total possible commission
* Project status
* CTA

Example:

```text
Premium Project

Activation Amount
₹1,000

Daily Commission
₹10

Duration
30 Days

Total Commission
₹300

[ View Project ]
```

---

# 16. PROJECT DETAILS PAGE

The Project Details page should provide complete information before activation.

Display:

### Project Information

* Project name
* Image
* Description
* Activation amount
* Daily commission
* Commission timing
* Duration
* Total possible commission
* Project status

Example:

```text
Premium Project

Activation Amount
₹1,000

Daily Commission
₹10

Commission Duration
30 Days

Commission Timing
Daily

Total Commission
₹300
```

---

# 17. COMMISSION TIMING

Each project should have configurable commission timing.

For the basic version:

```text
Daily
```

The project configuration should allow the admin to define:

* Commission amount
* Commission frequency
* Duration
* Start/end behavior

The user should be able to clearly see when the next commission is expected.

---

# 18. PROJECT ACTIVATION

The user should be able to activate a project from the Project Details page.

Before activation, show a confirmation:

```text
Confirm Project Activation

Project:
Premium Project

Activation Amount:
₹1,000

Daily Commission:
₹10

Duration:
30 Days

Total Commission:
₹300

Available Demo Balance:
₹1,250

Balance After Activation:
₹250

[ Cancel ]

[ Confirm Activation ]
```

After successful activation:

```text
Project Activated Successfully
```

An order should automatically be created.

---

# 19. ORDERS PAGE

Create a dedicated Orders section.

The Orders page should show all project activations.

Each order should contain:

* Order ID
* Project name
* Activation amount
* Daily commission
* Duration
* Order date
* Start date
* End date
* Earned commission
* Remaining commission
* Current status

Possible statuses:

```text
Active
Completed
Cancelled
```

---

# 20. ORDER DETAILS

Users should be able to open an order.

Show:

```text
Order ID

Project

Activation Amount

Daily Commission

Duration

Start Date

End Date

Current Day

Total Earned

Remaining Commission

Next Commission

Status
```

Also show the complete commission history for that order.

Example:

```text
Commission History

29 Sep
+ ₹10
Completed

28 Sep
+ ₹10
Completed

27 Sep
+ ₹10
Completed
```

---

# 21. DAILY COMMISSION

When an order is active, the platform should generate the configured commission according to the project rules.

Example:

```text
Activation:
₹1,000

Daily Commission:
₹10

Duration:
30 Days
```

The system should generate:

```text
Day 1  +₹10
Day 2  +₹10
Day 3  +₹10
...
Day 30 +₹10
```

Important rules:

* Commission must not be generated twice for the same day/order.
* Commission must only be generated while the order is active.
* Commission must stop after the configured duration.
* Completed orders must not generate additional commissions.
* The user should be able to see every generated commission.
* Existing orders must retain the project terms that applied when they were activated.

---

# 22. EARNINGS PAGE

Create a dedicated Earnings page.

Show:

### Summary

* Today's Commission
* This Week
* This Month
* Total Commission

### Earnings Chart

Provide a clean chart showing commission history over time.

Allow users to switch between:

* 7 days
* 30 days
* 90 days
* All time

### Commission History

Display:

* Date
* Project
* Order
* Commission amount
* Status

---

# 23. WALLET PAGE

The Wallet is the central balance management page.

Display:

```text
Available Balance

Total Demo Cash In

Total Commission

Total Cash Out

Pending Cash Out
```

Main actions:

```text
[ Cash In ]

[ Cash Out ]
```

---

# 24. WALLET TRANSACTIONS

Show complete wallet activity.

Transaction types:

* Welcome Bonus
* Demo Cash In
* Project Activation
* Daily Commission
* Cash Out
* Refund
* Adjustment

There is currently **no referral commission transaction type**.

Each transaction should display:

* Transaction type
* Description
* Amount
* Credit/debit
* Status
* Date/time
* Reference

Provide filters and transaction history.

---

# 25. CASH IN

The Cash In page should follow the requested flow.

Show the simulated USDT deposit information.

Example:

```text
Cash In

USDT

Network:
TRC20

Demo Deposit Address:

TXXXXXXXXXXXXXXXXXXXX

[ Copy Address ]
```

Also provide:

```text
Need Help?

Contact our support team on Telegram.

[ Contact Telegram Team ]
```

The Telegram button should open the configured Telegram support destination.

IMPORTANT:

For the practice version, use a clearly marked demo/test address and demo Telegram account.

Do not implement actual blockchain payment verification.

---

# 26. CASH IN INSTRUCTIONS

Provide simple instructions:

```text
1. Select the supported demo network.
2. Copy the displayed demo address.
3. Follow the simulated deposit process.
4. Contact demo support if required.
5. Your demo balance will be updated according to the application's simulation rules.
```

The exact UI can be improved by the development agent.

---

# 27. CASH OUT

The Cash Out page should allow the user to select a withdrawal method.

Methods:

```text
Crypto
Bank
```

The user must first bind withdrawal details before requesting Cash Out.

---

# 28. CRYPTO WITHDRAWAL DETAILS

Support these simulated networks:

### USDT TRC20

Fields:

```text
Network
USDT TRC20

Wallet Address
[________________]
```

### USDT BEP20

Fields:

```text
Network
USDT BEP20

Wallet Address
[________________]
```

The user should be able to:

* Add address
* View saved address
* Change address

Clearly label these as demo/simulation withdrawal addresses.

---

# 29. BANK WITHDRAWAL DETAILS

Support a simulated bank withdrawal method.

Fields:

```text
Name

Mobile Number

Account Number

IFSC Code

Branch
```

User should be able to:

* Add bank details
* View saved bank details
* Update bank details

Sensitive information should be appropriately protected in the interface.

---

# 30. WITHDRAWAL METHOD SELECTION

When requesting Cash Out:

```text
Select Withdrawal Method

○ USDT TRC20

○ USDT BEP20

○ Bank
```

Then display the corresponding saved details.

Example:

```text
Available Balance
₹2,000

Cash Out Amount
₹500

Withdrawal Method
USDT TRC20

Address
TXXXXXXXXXXXXXXXX

Withdrawal Password
••••••••

[ Request Cash Out ]
```

---

# 31. WITHDRAWAL PASSWORD

Create a separate withdrawal password.

The user should be able to:

* Set withdrawal password
* Change withdrawal password
* Reset withdrawal password

The withdrawal password should be required before submitting a Cash Out request.

Never display or expose the actual password.

---

# 32. CASH OUT HISTORY

Create a withdrawal history section.

Display:

* Withdrawal ID
* Amount
* Method
* Destination
* Request date
* Status
* Completion/rejection date
* Rejection reason if applicable

Statuses:

```text
Pending
Processing
Completed
Rejected
Cancelled
```

---

# 33. REFERRAL PAGE

Create a simple Referral page focused only on tracking.

Display:

```text
My Referral

Your Referral Code

VIKAS82K

[ Copy Code ]

Your Referral Link

yourdomain.com/register?ref=VIKAS82K

[ Copy Link ]
```

Statistics:

```text
Total Referrals
12

Today's Referrals
2

This Month
7
```

Referral history should show:

* Referred user
* Registration date
* Status

Do NOT show referral earnings because there is no referral commission system.

---

# 34. PROFILE PAGE

Display:

```text
Name

Mobile

Referral Code

Account Status

Registration Date
```

Actions:

```text
Edit Profile

Change Password

Withdrawal Password

Withdrawal Details

Logout
```

---

# 35. NOTIFICATIONS

Include an in-app notification system.

Notifications may include:

* Welcome bonus received
* Project activated
* Daily commission received
* Project completed
* Cash In update
* Cash Out requested
* Cash Out completed
* Cash Out rejected
* New user joined through your referral
* Security information changed

Do not generate referral commission notifications.

---

# 36. ADMIN PANEL

The admin panel is required for managing the entire platform.

The admin dashboard should provide a high-level overview.

Display:

```text
Total Users

Active Users

Total Projects

Active Projects

Total Orders

Active Orders

Total Demo Wallet Balance

Total Demo Commission

Pending Cash Outs

Completed Cash Outs

Total Referrals
```

Use appropriate charts/statistics where useful.

---

# 37. ADMIN USER MANAGEMENT

Admin should be able to:

* View users
* Search users
* Filter users
* View user profile
* View user's wallet
* View user's orders
* View user's commissions
* View user's Cash In history
* View user's Cash Out history
* View user's referral code
* View users referred by them
* View who referred the user
* Freeze user
* Unfreeze user

---

# 38. ADMIN USER WALLET MANAGEMENT

Admin should be able to view a user's wallet.

Display:

```text
Available Balance

Total Cash In

Total Commission

Total Cash Out

Pending Cash Out
```

Admin should also be able to see complete wallet activity.

If manual balance adjustments are supported for the demo:

* Require amount
* Require reason
* Show confirmation
* Record administrator
* Record date/time

---

# 39. ADMIN PROJECT MANAGEMENT

Admin should be able to create and manage projects.

Create Project fields:

```text
Project Name

Project Image

Description

Activation Amount

Daily Commission

Commission Frequency

Duration

Total Commission

Status
```

Total commission should be calculated automatically from the configured commission and duration.

Example:

```text
Daily Commission = ₹10
Duration = 30 days

Total Commission = ₹300
```

Admin should be able to:

* Create
* Edit
* Activate
* Deactivate
* View
* Manage display order

Existing user orders should retain the project terms that were active when they were created.

---

# 40. ADMIN ORDER MANAGEMENT

Admin should be able to view all orders.

Display:

* Order ID
* User
* Project
* Activation amount
* Daily commission
* Duration
* Start date
* End date
* Earned commission
* Status

Admin should be able to inspect an order and its commission history.

---

# 41. ADMIN COMMISSION MANAGEMENT

Admin should be able to monitor:

* Today's generated commissions
* Total commissions
* Commission by project
* Commission by user
* Failed processing
* Completed orders

Provide clear statistics and filters.

---

# 42. ADMIN CASH IN MANAGEMENT

Admin should be able to view simulated Cash In activity.

Display:

* User
* Amount
* Date
* Status
* Reference

Since this is a practice project, Cash In should remain simulated.

---

# 43. ADMIN CASH OUT MANAGEMENT

Admin should be able to view and manage Cash Out requests.

Sections:

```text
Pending

Processing

Completed

Rejected
```

For each request show:

* User
* Amount
* Withdrawal method
* Destination/details
* Request time
* Status

Admin actions:

```text
Approve

Reject
```

When rejecting, require a rejection reason.

---

# 44. ADMIN REFERRAL TRACKING

Admin should have a simple referral tracking section.

Admin can:

* Search referral codes
* View users and their referral codes
* View who referred each user
* View users referred by each user
* View total referral counts
* View referral registration dates

There should be **no referral commission management**.

Do not include:

* Referral commission settings
* Referral payout settings
* Referral earnings
* Referral reward configuration

---

# 45. ADMIN SETTINGS

Provide basic platform configuration.

Possible settings:

```text
Platform Name

Welcome Bonus

Minimum Cash Out

Support Telegram Username

Cash In Demo Address

Supported Withdrawal Methods

Project Settings
```

Do not include referral commission settings.

---

# 46. ACCOUNT STATUS

Users can have account states such as:

### Active

Normal access.

### Frozen

User can access the account but restricted actions may be disabled.

### Suspended

Account access is restricted.

The user should clearly see their account status.

---

# 47. RESPONSIVE DESIGN

The entire platform must work properly on:

* Desktop
* Laptop
* Tablet
* Mobile

The mobile version should not simply shrink the desktop interface.

Create a proper mobile experience.

Main mobile navigation should make these areas easy to access:

```text
Home

Projects

Orders

Wallet

Profile
```

---

# 48. UI/UX QUALITY

The platform should feel polished and professional.

Prioritize:

* Clean typography
* Consistent spacing
* Strong visual hierarchy
* Modern cards
* Professional tables
* Clear status badges
* Good forms
* Attractive project cards
* Clear wallet information
* Good mobile experience
* Smooth but subtle interactions

Use loading states, empty states, confirmation dialogs and error states throughout the application.

---

# 49. IMPORTANT BUSINESS RULES

### Project activation

A user should only be able to activate a project when they have sufficient demo balance.

### Daily commission

A commission should only be generated while an order is active.

### Duplicate prevention

The same order must never receive the same daily commission twice.

### Completion

After the configured duration, the order becomes completed and no further commission is generated.

### Project changes

Changes made by the admin to a project should not unexpectedly alter existing active orders.

### Cash Out

A user should not be able to request more than their available balance.

### Withdrawal details

A user must have valid withdrawal details before requesting Cash Out.

### Withdrawal password

A valid withdrawal password must be required before Cash Out.

### Referral tracking

Each user receives a unique referral code.

If another user registers using that code, the relationship is recorded.

Referral count should increase accordingly.

No monetary commission or reward is generated from referrals.

### Account restrictions

Frozen/suspended users should follow the platform's configured restrictions.

---

# 50. DEMO PROJECTS

Use realistic demo projects for development.

### Premium Project

Activation Amount: ₹1,000

Daily Commission: ₹10

Duration: 30 Days

Total Commission: ₹300

### Smart Gadget Project

Activation Amount: ₹2,000

Daily Commission: ₹25

Duration: 60 Days

Total Commission: ₹1,500

### Lifestyle Project

Activation Amount: ₹1,500

Daily Commission: ₹18

Duration: 45 Days

Total Commission: ₹810

### Premium Project Plus

Activation Amount: ₹3,000

Daily Commission: ₹40

Duration: 90 Days

Total Commission: ₹3,600

These are fictional demo configurations.

---

# 51. FINAL INFORMATION ARCHITECTURE

## Public

```text
Home
Projects
How It Works
Login
Signup
Terms
Privacy
```

## User

```text
Dashboard
Projects
Orders
Wallet
Earnings
Transactions
Referral
Profile
Settings
```

## Wallet

```text
Balance
Cash In
Cash Out
Transactions
Withdrawal Details
```

## Admin

```text
Dashboard
Users
User Wallets
Projects
Orders
Commissions
Cash In
Cash Out
Referral Tracking
Settings
Activity
```

---

# 52. FINAL USER FLOW

```text
                 LANDING PAGE
                      │
           ┌──────────┴──────────┐
           │                     │
        LOGIN                  SIGNUP
                                  │
                           Invitation Code
                              (Optional)
                                  │
                           Welcome Bonus
                                  │
                                  ▼
                             DASHBOARD
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
             ▼                    ▼                    ▼
         PROJECTS              ORDERS               WALLET
             │                                        │
             ▼                                  ┌─────┴─────┐
      PROJECT DETAILS                           │           │
             │                               CASH IN     CASH OUT
             ▼                                           │
       ACTIVATE PROJECT                                  ▼
             │                                  WITHDRAWAL DETAILS
             ▼                                           │
        ORDER CREATED                                     ▼
             │                                  Withdrawal Password
             ▼                                           │
      DAILY COMMISSION                                    ▼
             │                                        REQUEST
             ▼                                           │
         EARNINGS                                         ▼
                                                    ADMIN REVIEW

                          REFERRAL
                             │
                             ▼
                    Unique Referral Code
                             │
                             ▼
                  Other User Registers
                             │
                             ▼
                    Referral Count +1
```

---

# 53. ADMIN FLOW

```text
ADMIN LOGIN
     │
     ▼
ADMIN DASHBOARD
     │
     ├── Users
     │     └── User Wallet / Orders / Commissions
     │
     ├── Projects
     │     └── Create / Edit / Activate / Deactivate
     │
     ├── Orders
     │     └── Monitor Project Cycles
     │
     ├── Commissions
     │     └── Monitor Daily Commissions
     │
     ├── Cash In
     │     └── View Demo Deposits
     │
     ├── Cash Out
     │     └── Approve / Reject
     │
     ├── Referral Tracking
     │     └── Codes / Relationships / Counts
     │
     └── Settings
```

---

# 54. IMPLEMENTATION FREEDOM

The development agent should decide the technical implementation.

This document intentionally does NOT prescribe:

* Programming language
* Framework
* Database
* API endpoints
* Authentication architecture
* Folder structure
* Libraries
* Hosting
* Deployment architecture
* Internal data models

Choose appropriate engineering solutions based on the requirements above.

The priority is to deliver the described **user experience, business behavior, admin capabilities and visual quality**.

---

# 55. FINAL GOAL

Build a complete, polished **demo project-rewards platform** where:

A visitor discovers the platform through the landing page → sees the welcome bonus → registers using name, mobile, password, confirmation password and optional invitation code → receives their own unique referral code → enters the dashboard → browses projects → views activation amount, daily commission, duration and timing → activates a project → an order is created → receives simulated daily commissions → tracks the order and earnings → manages the demo wallet → binds a simulated crypto or bank withdrawal method → requests Cash Out → and sees the status of the request.

The referral system should only track:

**Who referred whom + referral codes + referral counts.**

There should be **no referral commission or referral earnings** in the current version.

Administrators must have control over:

* Users
* User wallets
* Projects
* Project activation settings
* Daily commissions
* Project durations
* Orders
* Cash In
* Cash Out
* Referral tracking
* Welcome bonus
* Platform settings

The final result should be **simple, modern, responsive, visually polished and easy to understand**, while leaving all technical implementation decisions to the development agent.
