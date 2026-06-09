import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  HandCoins,
  AlertTriangle,
  BarChart3,
  Settings,
  ShieldAlert,
  LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  path: string;
  icon: LucideIcon;
  isAdmin?: boolean;
}

export const navigationItems: NavigationItem[] = [
  { name: 'Dasbor', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transaksi', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Dompet', path: '/wallets', icon: Wallet },
  { name: 'Anggaran', path: '/budgets', icon: PieChart },
  { name: 'Target Tabungan', path: '/savings', icon: Target },
  { name: 'Utang & Pinjaman', path: '/debts', icon: HandCoins },
  { name: 'Tracker Pinjol', path: '/pinjol', icon: AlertTriangle },
  { name: 'Laporan', path: '/reports', icon: BarChart3 },
  { name: 'Pengaturan', path: '/settings', icon: Settings },
  { name: 'Admin Portal', path: '/admin', icon: ShieldAlert, isAdmin: true },
];

// List of paths that should be displayed in the mobile bottom navigation bar
export const mobileBottomBarPaths = [
  '/dashboard',
  '/transactions',
  '/budgets',
  '/savings',
];
