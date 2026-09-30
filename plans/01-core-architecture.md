# Module 01: Core Architecture & Data Schemas

## Objective
Establish the foundational data structures, state management, storage rules, and shared configurations for the Project Rewards Platform simulation.

---

## 1. System Positioning & Rules
- **Demo / Simulation Platform**: No real money, real cryptocurrency, or live banking transactions.
- **Currency Units**: INR (₹) or AED as configured in system settings (default: ₹).
- **Core Business Terms**:
  - `Project`: Pre-configured reward opportunity.
  - `Order`: Active or completed project instance linked to a user.
  - `Daily Commission`: Reward generated periodically (e.g. daily) per active order.
  - `Demo Wallet`: User balance tracking welcome bonus, commissions, demo cash ins, and demo cash outs.

---

## 2. Core Data Entities & Schemas

### User Model (`users`)
```json
{
  "id": "usr_1001",
  "fullName": "Vjfgf",
  "mobile": "+91 654654654654",
  "passwordHash": "hashed_pw",
  "withdrawalPasswordHash": "hashed_wpw",
  "referralCode": "cvdS82K",
  "referredBy": "usr_1000",
  "accountStatus": "active", // active | frozen | suspended
  "welcomeBonusReceived": true,
  "createdAt": "2026-09-29T10:00:00Z"
}
```

### Project Model (`projects`)
```json
{
  "id": "proj_2001",
  "name": "Premium Project",
  "image": "assets/images/project-1.jpg",
  "description": "Curated high-reward property project simulation.",
  "activationAmount": 1000,
  "dailyCommission": 10,
  "commissionFrequency": "daily", // daily
  "durationDays": 30,
  "totalCommission": 300, // calculated: dailyCommission * durationDays
  "status": "active" // active | inactive
}
```

### Order Model (`orders`)
```json
{
  "id": "ord_5001",
  "userId": "usr_1001",
  "projectId": "proj_2001",
  "projectName": "Premium Project",
  "activationAmount": 1000,
  "dailyCommission": 10,
  "durationDays": 30,
  "startDate": "2026-09-29T10:00:00Z",
  "endDate": "2026-10-29T10:00:00Z",
  "daysCompleted": 5,
  "earnedCommission": 50,
  "remainingCommission": 250,
  "status": "active" // active | completed | cancelled
}
```

### Commission Record (`commissions`)
```json
{
  "id": "comm_7001",
  "userId": "usr_1001",
  "orderId": "ord_5001",
  "projectId": "proj_2001",
  "amount": 10,
  "dayIndex": 6,
  "date": "2026-10-04",
  "status": "completed"
}
```

### Wallet Ledger (`wallet_transactions`)
```json
{
  "id": "tx_9001",
  "userId": "usr_1001",
  "type": "welcome_bonus", // welcome_bonus | demo_cash_in | project_activation | daily_commission | cash_out | refund | adjustment
  "amount": 100,
  "direction": "credit", // credit | debit
  "description": "Demo Welcome Bonus",
  "status": "completed", // completed | pending | failed
  "referenceId": "ord_5001",
  "createdAt": "2026-09-29T10:00:00Z"
}
```

### Withdrawal Details (`withdrawal_details`)
```json
{
  "id": "wd_3001",
  "userId": "usr_1001",
  "type": "crypto_trc20", // crypto_trc20 | crypto_bep20 | bank
  "cryptoAddress": "TXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "bankName": "Demo Bank",
  "accountName": "Vikas Nagar",
  "accountNumber": "1234567890",
  "ifscCode": "DEMO0001234",
  "branch": "Main Branch",
  "createdAt": "2026-09-29T10:00:00Z"
}
```

### Cash Out Request (`cash_out_requests`)
```json
{
  "id": "co_8001",
  "userId": "usr_1001",
  "amount": 500,
  "method": "USDT TRC20",
  "destination": "TXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "status": "pending", // pending | processing | completed | rejected | cancelled
  "rejectionReason": "",
  "requestedAt": "2026-09-29T12:00:00Z",
  "processedAt": null
}
```

### Referral Link (`referrals`)
```json
{
  "id": "ref_4001",
  "referrerUserId": "usr_1000",
  "referredUserId": "usr_1001",
  "referralCodeUsed": "VIKAS82K",
  "createdAt": "2026-09-29T10:00:00Z"
}
```

### System Settings (`system_settings`)
```json
{
  "platformName": "PrimeSpace Rewards",
  "currencySymbol": "₹",
  "welcomeBonusAmount": 100,
  "minCashOutAmount": 500,
  "supportTelegramUsername": "PrimeSpaceDemoSupport",
  "demoCashInUSDTAddress": "TXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "supportedWithdrawalMethods": ["USDT TRC20", "USDT BEP20", "Bank"]
}
```

---

## 3. Implementation Verification Checklist
- [ ] Define data access interfaces & mock persistence store.
- [ ] Ensure proper seed data for demo projects (₹1,000 / ₹10 daily; ₹2,000 / ₹25 daily; ₹1,500 / ₹18 daily; ₹3,000 / ₹40 daily).
- [ ] Verify validation rules for balance, unique referral code generation, and withdrawal conditions.
