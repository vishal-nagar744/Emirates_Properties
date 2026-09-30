# Module 04: User Dashboard & Member Workspace Overview

## Objective
Build the main dashboard overview page (`/pages/dashboard.html`) for logged-in users, displaying account KPIs, active project cards, quick navigation, and recent activity.

---

## 1. Dashboard Structure (`pages/dashboard.html`)

### 1. Sidebar Navigation (`.sidebar`)
- Brand header & Member Workspace label
- Navigation links: `Dashboard`, `Projects`, `Order activity`, `Earnings`, `Wallet`, `Profile`
- User profile snippet & Logout/Return to public site link (`↪`)
- Mobile drawer toggle button (`☰`) and backdrop overlay

### 2. Sticky Dashboard Topbar (`.dashbar`)
- Mobile menu toggle button
- Greeting snippet (*"Good morning, Vikas"*) dynamically adjusted by time of day
- Notifications button (`♢ Notifications`) & User avatar

### 3. Welcome Banner
- Greeting & workspace summary
- Quick CTA buttons: `Explore projects`, `View wallet`

### 4. Main KPI Grid
Display 4 primary KPI cards:
1. **Wallet Balance**: Available demo balance (₹ / AED)
2. **Today's Commission**: Total commission earned today
3. **Total Commission**: Cumulative earned commission
4. **Active Projects**: Count of active orders vs capacity (e.g. `4 / 20`)

Additional Stats Row:
- Total Activated Amount
- Completed Projects
- Pending Cash Out
- Total Referrals

*(Note: Do NOT show referral earnings because referral commission does not exist).*

### 5. Quick Actions Bar
- Buttons: `Projects`, `Orders`, `Wallet`, `Cash In`, `Cash Out`

### 6. Active Projects Section
Display cards for each active project order:
- Project Name & Image
- Activated Amount (e.g. ₹1,000)
- Daily Commission (e.g. ₹10)
- Day progress (e.g. Day 17 / 30)
- Progress bar indicator (e.g. 56%)
- Earned commission & Remaining commission
- Next Commission timing countdown/date
- CTA: `View Details →`

### 7. Recent Activity Table
- Recent project order updates and commission credits
- Columns: Project, Activity, Amount, Status

---

## 2. Verification Checklist
- [ ] Verify dynamic greeting based on current time (morning/afternoon/evening).
- [ ] Test mobile sidebar opening/closing with toggle button and backdrop overlay click.
- [ ] Ensure KPI cards accurately reflect mock/user data.
- [ ] Verify active project progress bar rendering.
