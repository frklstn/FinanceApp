import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  HandCoins,
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
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Transaksi', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Anggaran', path: '/budgets', icon: PieChart },
  { name: 'Tabungan', path: '/savings', icon: Target },
  { name: 'Piutang', path: '/debts', icon: HandCoins },
  { name: 'Tracker', path: '/pinjol', icon: AlertTriangle },
  { name: 'Laporan', path: '/reports', icon: BarChart3 },
  { name: 'Insight', path: '/insights', icon: Sparkles },
  { name: 'Pengaturan', path: '/settings', icon: Settings, hideFromSidebar: true },
  { name: 'Dompet', path: '/wallets', icon: Wallet, hideFromSidebar: true },
  { name: 'Admin', path: '/admin', icon: ShieldAlert, isAdmin: true, hideFromSidebar: true },
];

// List of paths that should be displayed in the mobile bottom navigation bar
export const mobileBottomBarPaths = [
  '/dashboard',
  '/transactions',
  '/pinjol',
  '/savings',
];
