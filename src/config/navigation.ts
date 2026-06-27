import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  AlertTriangle,
  BarChart3,
  Sparkles,
  Settings,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Calculator,
  Calendar,
  FileText,
  LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  path: string;
  icon: LucideIcon;
  isAdmin?: boolean;
  hideFromSidebar?: boolean;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', path: '/finance/dashboard', icon: LayoutDashboard },
  { name: 'Transaksi', path: '/finance/transactions', icon: ArrowLeftRight },
  { name: 'Anggaran', path: '/finance/budgets', icon: PieChart },
  { name: 'Tabungan', path: '/finance/savings', icon: Target },
  { name: 'Pinjol', path: '/finance/pinjol', icon: AlertTriangle },
  { name: 'Laporan', path: '/finance/reports', icon: BarChart3 },
  { name: 'Analisis', path: '/finance/insights', icon: Sparkles },
  { name: 'Pengaturan', path: '/finance/settings', icon: Settings, hideFromSidebar: true },
  { name: 'Dompet', path: '/finance/wallets', icon: Wallet, hideFromSidebar: true },
  { name: 'Admin', path: '/user/admin', icon: ShieldAlert, isAdmin: true, hideFromSidebar: false },
];

export const navigationGroups: NavigationGroup[] = [
  {
    title: 'MAIN MENU',
    items: [
      { name: 'Financial Health', path: '/finance/dashboard', icon: LayoutDashboard },
      { name: 'Cashflow', path: '/finance/reports', icon: TrendingUp },
      { name: 'Transaction', path: '/finance/transactions', icon: ArrowLeftRight },
      { name: 'Debt Tracker', path: '/finance/debts', icon: TrendingDown },
      { name: 'Pinjol Tracker', path: '/finance/pinjol', icon: AlertTriangle },
      { name: 'Goals', path: '/finance/savings', icon: Target },
      { name: 'Insight', path: '/finance/insights', icon: Sparkles },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { name: 'Calculator', path: '#calculator', icon: Calculator },
      { name: 'Calendar', path: '#calendar', icon: Calendar },
      { name: 'Document', path: '#document', icon: FileText },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { name: 'Settings', path: '/finance/settings', icon: Settings },
    ],
  },
];

// List of paths that should be displayed in the mobile bottom navigation bar
export const mobileBottomBarPaths = [
  '/finance/dashboard',
  '/finance/transactions',
  '/finance/pinjol',
  '/finance/savings',
];
