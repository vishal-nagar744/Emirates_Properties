# Master Project Implementation Plan

This directory contains the broken-down sub-plans created from `plan.md`. Each file defines a standalone, implementable module of the **Project Rewards Platform** simulation.

---

## Plan Structure & Module Index

| Module File | Focus & Scope | Dependencies |
|---|---|---|
| [`01-core-architecture.md`](01-core-architecture.md) | Technical Stack, Data Schemas (User, Project, Order, Commission, Wallet, Withdrawal, Referral, Admin), Shared State | None |
| [`02-auth-and-referral.md`](02-auth-and-referral.md) | User Registration (Name, Mobile, Password, Invitation Code), Auto Unique Referral Code, Login/Forgot Password, Welcome Bonus trigger | Module 01 |
| [`03-public-landing-page.md`](03-public-landing-page.md) | Hero, Welcome Bonus Banner, How It Works, Featured Projects, Platform Features, FAQ, Footer | Module 01 |
| [`04-user-dashboard.md`](04-user-dashboard.md) | Member Workspace Overview, Main KPIs, Quick Actions, Active Projects Summary & Progress | Modules 01, 02 |
| [`05-projects-and-activation.md`](05-projects-and-activation.md) | Project Catalog, Project Details, Confirmation Modal, Balance Checks, Project Activation | Modules 01, 04 |
| [`06-orders-and-commission-engine.md`](06-orders-and-commission-engine.md) | Orders Page, Order Detail & History, Daily Commission Scheduler/Automation, Expiration & Duplicate Prevention | Modules 01, 05 |
| [`07-wallet-cashin-cashout.md`](07-wallet-cashin-cashout.md) | Wallet Ledger, Simulated USDT TRC20 Cash In, Cash Out Flow, Withdrawal Password, Crypto/Bank Binding | Modules 01, 02 |
| [`08-profile-security-notifications.md`](08-profile-security-notifications.md) | Member Profile, Password Management, Security/Withdrawal Passwords, Account Status, In-App Notifications | Modules 01, 02 |
| [`09-admin-panel.md`](09-admin-panel.md) | Admin Auth, Admin Dashboard, User & Wallet Management, Project CRUD, Cash Out Approval/Rejection, Referral Tracking, System Settings | Modules 01 - 08 |

---

## Execution Strategy

1. Work through modules sequentially (01 → 09).
2. Each module will be fully built, tested, and verified before moving to the next.
3. Keep all simulations (USDT addresses, Telegram support links, bank details) clearly marked as demo/test data.
