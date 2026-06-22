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
  LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  path: string;
  icon: LucideIcon;
  isAdmin?: boolean;
  hideFromSidebar?: boolean;
}

export const navigationItems: NavigationItem[] = [
  { name: 'Dashboard', path: '/finance/dashboard', icon: LayoutDashboard },
  { name: 'Transaksi', path: '/finance/transactions', icon: ArrowLeftRight },
  { name: 'Anggaran', path: '/finance/budgets', icon: PieChart },
  { name: 'Tabungan', path: '/finance/savings', icon: Target },
  { name: 'Pinjol', path: '/finance/pinjol', icon: AlertTriangle },
  { name: 'Laporan', path: '/finance/reports', icon: BarChart3 },
  { name: 'Analisis', path: '/finance/insights', icon: Sparkles },
  { name: 'Pengaturan', path: '/settings', icon: Settings, hideFromSidebar: true },
  { name: 'Dompet', path: '/finance/wallets', icon: Wallet, hideFromSidebar: true },
  { name: 'Admin', path: '/user/admin', icon: ShieldAlert, isAdmin: true, hideFromSidebar: false },
];

// List of paths that should be displayed in the mobile bottom navigation bar
export const mobileBottomBarPaths = [
  '/finance/dashboard',
  '/finance/transactions',
  '/finance/pinjol',
  '/finance/savings',
];
