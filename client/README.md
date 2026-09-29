# PrimeSpace Frontend — Refactored Structure

A clean, scalable, production-ready HTML + CSS + Vanilla JS frontend for the Emirates Properties / PrimeSpace platform.

---

## 📁 Folder Structure

```
client/
├── index.html                  # Public landing page (entry point)
│
├── pages/                      # All application pages
│   ├── login.html              # Auth: Log in
│   ├── signup.html             # Auth: Create account
│   ├── forgot.html             # Auth: Forgot password
│   ├── dashboard.html          # Member workspace: Overview
│   ├── projects.html           # Member workspace: Project catalogue
│   ├── project-details.html    # Member workspace: Single project view
│   ├── orders.html             # Member workspace: Order activity
│   ├── earnings.html           # Member workspace: Earnings summary
│   ├── wallet.html             # Member workspace: Wallet balance
│   ├── profile.html            # Account: Member profile
│   └── kyc.html                # Account: KYC verification form
│
├── assets/
│   ├── css/
│   │   └── global.css          # Single shared design system stylesheet
│   ├── js/
│   │   ├── app.js              # Centralized UI logic (toast, sidebar, hearts, etc.)
│   │   └── api.js              # API service layer (all backend stubs with TODO comments)
│   └── images/                 # Local image assets (if/when used)
│
└── data/
    └── app-data.json           # Centralized static data (projects, member info, activity)
```

---

## 🎨 Design System

All styles live in a **single CSS file**: [`assets/css/global.css`](assets/css/global.css)

### CSS Variables (Design Tokens)
```css
--g:      #123f32   /* Primary green */
--g2:     #0b3026   /* Dark green */
--sage:   #dfece4   /* Sage green (backgrounds) */
--pale:   #f2f7f4   /* Pale green (hover states) */
--cream:  #fbfaf7   /* Page background */
--ink:    #17231f   /* Body text */
--muted:  #74817b   /* Secondary text */
--line:   #e2eae5   /* Borders & dividers */
--gold:   #b69b68   /* Accent gold (smallcaps) */
```

### Key CSS Components
| Class | Purpose |
|---|---|
| `.btn.primary` / `.btn.light` | Button variants |
| `.card` | White rounded card with shadow |
| `.sidebar` / `.sidelink` | Dashboard sidebar navigation |
| `.dashbar` | Sticky top bar for dashboard pages |
| `.kpis` / `.kpi` | KPI card grid |
| `.twocol` | Two-column grid (1.4fr / 0.8fr) |
| `.data-table` | Semantic data table |
| `.property-card` | Property listing card |
| `.stat-grid` / `.stat-item` | 3-column stat blocks |
| `.progress-bar` | Animated progress indicator |
| `.wallet-card` | Dark green wallet balance display |
| `.auth-layout` | 2-panel auth page split |
| `.toast` | Bottom-right notification toast |

---

## ⚡ JavaScript

### `assets/js/app.js` — Shared UI Logic
| Function | Description |
|---|---|
| `toast(message)` | Show bottom-right notification |
| `toggleSide()` | Open/close mobile sidebar |
| `closeSide()` | Close sidebar + overlay |
| `initHearts()` | Wishlist heart toggle |
| `initDemoForms()` | Demo form submission handler |
| `initActiveNav()` | Highlight current page in sidebar |
| `initProjectFilter(inputId, gridId)` | Live project search filter |
| `initApp()` | Auto-initializes all behaviors |

### `assets/js/api.js` — Backend Service Layer
All API calls are pre-structured and ready to connect. Each method has a `TODO:` comment with the real `fetch()` call to uncomment:

```javascript
// Before (demo mode):
async login(emailOrMobile, password) {
  // TODO: return _request('POST', '/auth/login', { emailOrMobile, password });
  return { ok: true, data: { token: 'demo_token' } };
}

// After (connected to backend):
async login(emailOrMobile, password) {
  return _request('POST', '/auth/login', { emailOrMobile, password });
}
```

Available services: `AuthAPI`, `ProjectsAPI`, `OrdersAPI`, `EarningsAPI`, `WalletAPI`, `ProfileAPI`, `KYCAPI`, `DashboardAPI`

---

## 📄 Pages Overview

| Page | Route | Layout |
|---|---|---|
| Landing | `/index.html` | Public (navbar + footer) |
| Login | `/pages/login.html` | Auth split-panel |
| Signup | `/pages/signup.html` | Auth split-panel |
| Forgot Password | `/pages/forgot.html` | Auth split-panel |
| Dashboard | `/pages/dashboard.html` | Dashboard (sidebar + dashbar) |
| Projects | `/pages/projects.html` | Dashboard |
| Project Details | `/pages/project-details.html` | Dashboard |
| Order Activity | `/pages/orders.html` | Dashboard |
| Earnings | `/pages/earnings.html` | Dashboard |
| Wallet | `/pages/wallet.html` | Dashboard |
| Profile | `/pages/profile.html` | Dashboard |
| KYC Form | `/pages/kyc.html` | Dashboard |

---

## 🔗 Navigation Flow

```
index.html
├── → pages/login.html → pages/dashboard.html
├── → pages/signup.html → pages/login.html
└── → pages/project-details.html (public preview)

pages/dashboard.html (sidebar)
├── → pages/projects.html → pages/project-details.html
├── → pages/orders.html
├── → pages/earnings.html → pages/wallet.html
├── → pages/wallet.html
├── → pages/profile.html → pages/kyc.html
└── → pages/kyc.html
```

---

## 📱 Responsive Breakpoints

| Breakpoint | Changes |
|---|---|
| `≤ 1050px` | Sidebar hidden (slide-in on toggle), 2-column grids collapse |
| `≤ 700px` | Mobile layout: single-column grids, hidden auth visual panel, stacked search bar |

---

## 🔌 Backend Integration

When the backend is ready:

1. **Update `API_CONFIG.BASE_URL`** in `assets/js/api.js`
2. **Uncomment the `_request()` calls** in each API method (look for `// TODO:`)
3. **Auth token**: `Auth.setToken(token)` after login, `Auth.getToken()` for authorized requests
4. **No UI code changes needed** — the UI reads from the same API response structure

---

*PrimeSpace · Emirates Properties · © 2026*
