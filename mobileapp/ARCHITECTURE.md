# Mobile App Architecture & Specification (Android)
**Project:** `FinanceApp Mobile (Android / Redmi Focus)`  
**Subdirectory:** `/home/frklstn/Levi/FinanceApp/mobileapp`  
**Target Backend:** Rust Axum REST API (`https://fin.llvy.space/api/v1` or `http://localhost:3006/api/v1`)  
**Auth Scheme:** `Authorization: Bearer <JWT>`  
**Tech Recommendation:** React Native (Expo SDK 51+ with New Architecture / TypeScript) or Native Kotlin Jetpack Compose.  
*(Note: Recommended default for fast iteration matching web models & asset re-use is React Native + TypeScript + React Navigation 6/7 + TanStack Query + Zustand/AsyncStorage).*

---

## 1. Directory & Codebase Structure

```
mobileapp/
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── fonts/
├── src/
│   ├── api/                     # Type-safe API client matching Rust Axum models
│   │   ├── client.ts            # Axios / Fetch client with Bearer token interceptor
│   │   ├── endpoints.ts         # Endpoint URL constants
│   │   ├── auth.api.ts          # /api/v1/auth/*
│   │   ├── wallets.api.ts       # /api/v1/wallets/*
│   │   ├── transactions.api.ts  # /api/v1/transactions/*
│   │   ├── debts.api.ts         # /api/v1/debts/* & /api/v1/pinjol/*
│   │   ├── budgets.api.ts       # /api/v1/budgets/* & /api/v1/categories/*
│   │   ├── savings.api.ts       # /api/v1/savings/*
│   │   └── dashboard.api.ts     # /api/v1/dashboard/*
│   │
│   ├── types/                   # Strict TypeScript definitions matching Rust structs
│   │   ├── common.ts            # ApiResponse<T>, Pagination, etc.
│   │   ├── auth.ts              # Profile, Claims, LoginRequest, RegisterRequest
│   │   ├── wallet.ts            # Wallet, Create/UpdateWalletRequest
│   │   ├── transaction.ts       # Transaction, TransactionQueryFilter
│   │   ├── debt.ts              # Debt, LoanTracker, PayDebtRequest, PayLoanRequest
│   │   ├── budget.ts            # Budget, Category, CreateBudgetRequest
│   │   ├── savings.ts           # SavingsGoal, ContributeSavingsRequest
│   │   └── dashboard.ts         # DashboardSummary, CategorySpendingSummary
│   │
│   ├── store/                   # Global State & Persistence
│   │   ├── authStore.ts         # Zustand store + AsyncStorage for JWT & User Profile
│   │   ├── themeStore.ts        # Dark/Light/System theme mode
│   │   └── filterStore.ts       # Active filters (date range, selected wallet, currency)
│   │
│   ├── navigation/              # App Navigation Structure
│   │   ├── RootNavigator.tsx    # Auth vs Main switch
│   │   ├── AuthNavigator.tsx    # Login, Register, ForgotPassword
│   │   ├── MainTabNavigator.tsx # Bottom Tabs (Dashboard, Wallets, Transactions, Debts, Settings)
│   │   ├── types.ts             # Navigation stack param types
│   │   └── stacks/
│   │       ├── DashboardStack.tsx
│   │       ├── WalletStack.tsx
│   │       ├── TransactionStack.tsx
│   │       └── DebtStack.tsx
│   │
│   ├── screens/                 # UI Screen Components
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx
│   │   │   └── AnalyticsDetailScreen.tsx
│   │   ├── wallets/
│   │   │   ├── WalletListScreen.tsx
│   │   │   ├── WalletDetailScreen.tsx
│   │   │   ├── AddEditWalletModal.tsx
│   │   │   └── TransferWalletModal.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionListScreen.tsx
│   │   │   ├── TransactionDetailScreen.tsx
│   │   │   ├── QuickTransactionModal.tsx
│   │   │   └── TransactionFilterModal.tsx
│   │   ├── debts/
│   │   │   ├── DebtOverviewScreen.tsx
│   │   │   ├── PinjolTrackerScreen.tsx
│   │   │   ├── PayDebtModal.tsx
│   │   │   └── SurvivalScoreDetailScreen.tsx
│   │   ├── budgets/
│   │   │   ├── BudgetListScreen.tsx
│   │   │   └── SavingsGoalScreen.tsx
│   │   └── settings/
│   │       ├── SettingsScreen.tsx
│   │       ├── ProfileScreen.tsx
│   │       ├── CurrencySelectionScreen.tsx
│   │       └── SecurityPinScreen.tsx
│   │
│   ├── components/              # Reusable UI Atoms & Molecules
│   │   ├── common/              # Button, Input, Card, Badge, Modal, BottomSheet
│   │   ├── charts/              # Mini Bar Chart, Pie Chart, Progress Bar
│   │   ├── transactions/        # TransactionItem, AmountDisplay
│   │   └── debts/               # PinjolAlertCard, SurvivalScoreBadge
│   │
│   ├── hooks/                   # React Hooks & TanStack Query wrappers
│   │   ├── useAuth.ts
│   │   ├── useWallets.ts
│   │   ├── useTransactions.ts
│   │   ├── useDebts.ts
│   │   └── useDashboard.ts
│   │
│   ├── utils/                   # Formatters, Currency converters, Date helpers
│   │   ├── currency.ts          # Format IDR/USD, thousand separators
│   │   ├── date.ts              # Format Indonesian dates / relative time
│   │   └── storage.ts           # SecureStore / AsyncStorage helper wrappers
│   │
│   └── constants/
│       ├── colors.ts            # Theme color palette
│       ├── config.ts            # API Base URLs, App Version
│       └── categories.ts        # Default icons & colors
│
├── app.json / app.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## 2. Navigation Flow & Stack Architecture

```
                       ┌─────────────────────────┐
                       │      RootNavigator      │
                       └────────────┬────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
   [ If isAuthenticated = false ]           [ If isAuthenticated = true ]
   ┌─────────────────────────────┐           ┌─────────────────────────────┐
   │        AuthNavigator        │           │      MainTabNavigator       │
   │  - LoginScreen              │           │  (Bottom Navigation Bar)    │
   │  - RegisterScreen           │           └──────────────┬──────────────┘
   │  - ForgotPasswordScreen     │                          │
   └─────────────────────────────┘                          │
         ┌──────────────────┬───────────────────┬───────────┴───────┬──────────────────┐
         ▼                  ▼                   ▼                   ▼                  ▼
  ┌──────────────┐   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   ┌──────────────┐
  │  Dashboard   │   │   Wallets    │    │ Transactions │    │ Debts/Pinjol │   │   Settings   │
  │     Tab      │   │     Tab      │    │     Tab      │    │     Tab      │   │     Tab      │
  └──────┬───────┘   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘   └──────┬───────┘
         │                  │                   │                   │                  │
   - Summary Cards    - Wallet Cards       - Filter Bar        - Survival Score   - User Profile
   - Quick Actions    - Add/Edit Modal     - Search / Date     - Pinjol Loans     - Currency Pref
   - Spending Chart   - Transfer Modal     - Quick Add (+Fab)  - Pay Due Modal    - App Version
   - Recent Txns      - Mutation History   - Tx Detail Modal   - 12-Month Proj    - Logout Action
```

---

## 3. Type-Safe Backend Models & API Contract

Direct mapping from Rust Axum models in `backend/src/models/*`:

### 3.1 Common API Response
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
}
```

### 3.2 Authentication & Profile (`src/types/auth.ts`)
```typescript
export interface Profile {
  id: string; // UUID
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  currency?: string | null;
  language?: string | null;
  timezone?: string | null;
  is_suspended?: boolean | null;
  workspace_id?: string | null;
  plan: string;
  plan_expires_at?: string | null;
  whatsapp_contact?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: Profile;
  workspace_id: string;
}

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface RegisterRequest {
  email: string;
  username?: string;
  password: string;
  full_name?: string;
}
```

### 3.3 Wallets (`src/types/wallet.ts`)
```typescript
export interface Wallet {
  id: string; // UUID
  workspace_id: string;
  name: string;
  type: string; // 'cash' | 'bank' | 'ewallet' | 'investment' | 'other'
  balance: string; // Decimal serialized as string / number
  color: string;
  icon: string;
  is_active: boolean;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWalletRequest {
  name: string;
  type?: string;
  balance?: number | string;
  color?: string;
  icon?: string;
  currency?: string;
}

export interface UpdateWalletRequest {
  name?: string;
  type?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
}
```

### 3.4 Transactions (`src/types/transaction.ts`)
```typescript
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  workspace_id: string;
  wallet_id: string;
  category_id?: string | null;
  amount: string; // Decimal
  type: TransactionType;
  destination_wallet_id?: string | null;
  note?: string | null;
  date: string;
  tags: string[];
  attachment_url?: string | null;
  is_recurring: boolean;
  recurring_id?: string | null;
  currency: string;
  exchange_rate: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionRequest {
  wallet_id: string;
  category_id?: string | null;
  amount: number | string;
  type: TransactionType;
  destination_wallet_id?: string | null;
  note?: string;
  date?: string;
  tags?: string[];
  currency?: string;
  exchange_rate?: number | string;
}

export interface TransactionQueryFilter {
  start_date?: string;
  end_date?: string;
  wallet_id?: string;
  category_id?: string;
  type?: TransactionType;
  limit?: number;
  offset?: number;
}
```

### 3.5 Debts & Pinjol Planner (`src/types/debt.ts`)
```typescript
export interface Debt {
  id: string;
  workspace_id: string;
  name: string;
  type: string; // 'payable' (utang) | 'receivable' (piutang)
  amount: string;
  interest_rate: string;
  due_date?: string | null;
  status: string; // 'unpaid' | 'partial' | 'paid'
  description?: string | null;
  remaining_amount: string;
  contact_info?: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface LoanTracker {
  id: string;
  workspace_id: string;
  category: string; // Provider / platform name (e.g., 'Kredivo', 'ShopeePayLater')
  amount_applied?: string | null;
  amount_received: string;
  total_repayment: string;
  monthly_payment: string;
  tenure_months: number;
  due_day: number; // Day of the month (1-31)
  start_date: string;
  salary_date?: number | null;
  status: string; // 'active' | 'settled' | 'overdue'
  notes?: string | null;
  payment_frequency?: string | null;
  end_date?: string | null;
  total_remaining_balance?: string | null;
  penalty_fee?: string | null;
  can_early_payoff?: boolean | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface PayDebtRequest {
  debt_id: string;
  wallet_id: string;
  amount: number | string;
  note?: string;
}

export interface PayLoanRequest {
  loan_id: string;
  wallet_id: string;
  amount: number | string;
  note?: string;
}
```

### 3.6 Dashboard Summary (`src/types/dashboard.ts`)
```typescript
export interface DashboardSummary {
  total_balance: string;
  total_income: string;
  total_expense: string;
  net_savings: string;
  savings_rate_percentage: string;
  transaction_count: number;
}

export interface CategorySpendingSummary {
  category_id?: string | null;
  category_name: string;
  color: string;
  total_amount: string;
  percentage: string;
}
```

---

## 4. State Management & Token Persistence

### 4.1 Token Storage Engine
* Use `@react-native-async-storage/async-storage` (or `expo-secure-store`) for persisting the Bearer JWT and cached user workspace info.
* Store keys:
  * `@fin_auth_token`: string (Bearer JWT)
  * `@fin_user_profile`: serialized JSON string
  * `@fin_workspace_id`: UUID string

### 4.2 Zustand Auth Store Architecture (`src/store/authStore.ts`)
```typescript
interface AuthState {
  token: string | null;
  user: Profile | null;
  workspaceId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  login: (req: LoginRequest) => Promise<boolean>;
  register: (req: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  setUser: (user: Profile) => void;
}
```

### 4.3 API Client Interceptor (`src/api/client.ts`)
* Intercepts outgoing requests to attach `Authorization: Bearer <token>`.
* Intercepts 401 Unauthorized responses to trigger automatic logout and return to `AuthNavigator`.

---

## 5. Screen & Feature Specifications

### 5.1 AuthStack
1. **Login Screen**:
   - Identifier (Email / Username) & Password fields.
   - Secure input toggle, error messaging, "Remember Me" toggle.
   - Quick transition to Register Screen.
2. **Register Screen**:
   - Full name, Email, Username, Password.
   - Validation feedback matching Rust backend constraints.

### 5.2 MainTab Screens
1. **Dashboard Tab (`DashboardScreen.tsx`)**:
   - **Net Worth & Monthly Cashflow Card**: Total balance, Income vs Expense, Savings rate.
   - **Quick Action Bar**: `+ Income`, `- Expense`, `⇄ Transfer`, `Debt Repayment`.
   - **Wallet Carousel**: Quick horizontal scroll of active wallets with real-time balances.
   - **Spending by Category Chart**: Interactive mini-pie/bar breakdown.
   - **Recent Transactions List**: Top 5 latest transactions with category icons and timestamps.
2. **Wallets Tab (`WalletListScreen.tsx`)**:
   - List of all wallets categorized by type (Cash, Bank, E-Wallet, Investment).
   - "Add Wallet" button modal with custom color and icon picker.
   - Wallet detail view showing specific mutation history and transfer between wallets.
3. **Transactions Tab (`TransactionListScreen.tsx`)**:
   - Paginated / infinite scroll transaction stream grouped by date.
   - Filter Modal: Filter by Wallet, Category, Type (Income/Expense/Transfer), and Date Range.
   - Quick Add Floating Action Button (FAB).
   - Swipe to delete transaction (with confirmation modal).
4. **Debts & Pinjol Tab (`DebtOverviewScreen.tsx`)**:
   - **Survival Score Widget**: 0-100 meter indicating financial health relative to salary cycle.
   - **Pinjol Tracker Section**: Active loans list, next due date countdown, installment amount.
   - **Traditional Debt/Piutang Section**: Debts owed to / by contacts.
   - **Pay Installment Flow**: Direct wallet deduction linked to Rust `/api/v1/debts/pay` & `/api/v1/pinjol/pay`.
5. **Settings Tab (`SettingsScreen.tsx`)**:
   - Profile information & Plan status (Free/Pro).
   - Currency preferences (IDR, USD, etc.).
   - Dark Mode / AMOLED Black Theme toggle (crucial for battery saving on Redmi OLED displays).
   - Cache cleaner & Secure Logout.

---

## 6. Optimization for Android (Redmi / Budget-to-Mid Phones)
* **AMOLED / Dark Mode Support**: Pure `#000000` background token for battery longevity on Redmi AMOLED screens.
* **Lightweight Bundle**: Avoid heavy runtime animation libraries; utilize native layout animations (`react-native-reanimated` with Worklets).
* **FlatList Optimization**: `windowSize={5}`, `maxToRenderPerBatch={10}`, `removeClippedSubviews={true}` on long transaction lists.
* **Offline Resilience**: TanStack Query cache persistence for instant offline app launch before network sync.