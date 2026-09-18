# Mobile App Feature Roadmap & Execution Plan

**Target Platform:** Android (Redmi / Android Phones)  
**Backend:** Rust Axum REST API (`https://fin.llvy.space/api/v1`)  
**Scope:** Client application inside `/home/frklstn/Levi/FinanceApp/mobileapp`

---

## 🎯 Milestone Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           MOBILE APP MILESTONES                                │
│                                                                                │
│  Phase 1: Project Scaffolding & Core Architecture Setup                        │
│  Phase 2: Authentication & Token Persistence Engine                            │
│  Phase 3: Dashboard & Wallet Management Modules                                │
│  Phase 4: Transaction Stream & Quick Mutation Engine                           │
│  Phase 5: Debt Survival Planner & Pinjol Due-Date Alerts                       │
│  Phase 6: Budgeting, Savings Goals & Offline Optimization                      │
│  Phase 7: APK Build, Android Sizing & Redmi Device Testing                    │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Detailed Execution Phases

### 🔹 Phase 1: Project Scaffolding & Core Architecture
* [ ] Scaffold React Native + Expo TypeScript project structure with New Architecture enabled.
* [ ] Setup theme tokens (Dark/AMOLED mode optimized for Redmi screens).
* [ ] Configure React Navigation container:
  * `RootNavigator` with auth state switch.
  * `AuthNavigator` stack.
  * `MainTabNavigator` bottom navigation bar (5 tabs: Dashboard, Wallets, Transactions, Debts, Settings).
* [ ] Implement Type-Safe API Client with Axios / Fetch interceptors for Bearer Token handling.
* **Deliverable:** Working navigation skeleton with mocked auth flow and theme provider.

### 🔹 Phase 2: Authentication & Token Persistence Engine
* [ ] Build `LoginScreen` supporting email/username + password.
* [ ] Build `RegisterScreen` with instant form validation matching Rust backend constraints.
* [ ] Implement Zustand `useAuthStore` integrated with `@react-native-async-storage/async-storage`.
* [ ] Connect endpoints:
  * `POST /api/v1/auth/login`
  * `POST /api/v1/auth/register`
  * `GET  /api/v1/auth/me`
* [ ] Auto-rehydrate auth session on app cold start and handle automatic token logout on 401.
* **Deliverable:** Full end-to-end login/register flow connected to Rust Axum backend.

### 🔹 Phase 3: Dashboard & Wallet Management
* [ ] Connect `GET /api/v1/dashboard/summary` & `GET /api/v1/dashboard/categories`.
* [ ] Build Dashboard summary cards (Net balance, Income vs Expense, Savings rate).
* [ ] Build interactive Wallet Carousel on Dashboard.
* [ ] Implement Wallet Management (`/api/v1/wallets`):
  * Wallet List screen categorized by type (Cash, Bank, E-Wallet, Investment).
  * Add / Edit Wallet modal with custom color and icon selectors.
  * Delete wallet with safety warning if transactions exist.
* **Deliverable:** Live net worth & multi-wallet balance tracking with real-time updates.

### 🔹 Phase 4: Transaction Stream & Quick Mutation Engine
* [ ] Connect `GET /api/v1/transactions` with pagination and date filters.
* [ ] Build high-performance `FlatList` for transaction stream with date grouping.
* [ ] Build Quick Transaction Modal (FAB button):
  * Amount input with auto thousand separators (IDR `Rp`).
  * Source wallet selector & Category picker with icons.
  * Transaction type toggle: Income / Expense / Transfer (between wallets).
  * Notes and date pickers.
* [ ] Connect `POST /api/v1/transactions` and `DELETE /api/v1/transactions/:id`.
* [ ] Integrate TanStack Query optimistic updates for instant UI feedback.
* **Deliverable:** Fast transaction logging (< 3 taps) with atomic balance mutations.

### 🔹 Phase 5: Debt Survival Planner & Pinjol Tracker
* [ ] Connect `GET /api/v1/debts` & `GET /api/v1/pinjol/loans`.
* [ ] Build Debt & Pinjol Hub:
  * **Survival Score Meter**: Visual dial/gauge (0 - 100) showing cashflow survival risk.
  * **Pinjol Due Date Alert Cards**: Highlight loans due near or after salary date.
  * **Traditional Debt/Piutang tracker**: Categorized by payable/receivable.
* [ ] Implement Pay Installment flow:
  * Connect `POST /api/v1/debts/pay` & `POST /api/v1/pinjol/pay`.
  * Deducts amount directly from selected wallet with atomic rollback on failure.
* **Deliverable:** Complete Debt Survival Planner on mobile matching webapp capabilities.

### 🔹 Phase 6: Budgeting, Savings Goals & Offline Cache
* [ ] Connect `GET /api/v1/budgets` & `POST /api/v1/budgets`.
* [ ] Connect `GET /api/v1/savings` & `POST /api/v1/savings/contribute`.
* [ ] Implement budget progress bars with visual warnings when nearing 100%.
* [ ] Implement Savings goal milestones & target date countdown.
* [ ] Configure TanStack Query offline persistence so dashboard and balances display instantly without network.
* **Deliverable:** Full financial planning suite operating smoothly offline & online.

### 🔹 Phase 7: Android Optimization, Sizing & APK Build
* [ ] Android performance tuning:
  * FlatList `removeClippedSubviews` and item layouts.
  * Deep black AMOLED theme for Redmi battery savings.
  * Android Back Button hardware handling in modals and nested stacks.
* [ ] Configure EAS Build / Gradle release configuration for Android APK.
* [ ] Produce standalone Android release APK for direct installation on Redmi phones.
* **Deliverable:** Production-ready `.apk` file verified on Android hardware.