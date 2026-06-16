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
  { name: 'Catat Transaksi', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Kelola Anggaran', path: '/budgets', icon: PieChart },
  { name: 'Target Tabungan', path: '/savings', icon: Target },
  { name: 'Utang Piutang', path: '/debts', icon: HandCoins },
  { name: 'Tracker Pinjol', path: '/pinjol', icon: AlertTriangle },
  { name: 'Laporan Analisis', path: '/reports', icon: BarChart3 },
  { name: 'Insight Keuangan', path: '/insights', icon: Sparkles },
  { name: 'Pengaturan', path: '/settings', icon: Settings, hideFromSidebar: true },
  { name: 'Dompet Saya', path: '/wallets', icon: Wallet, hideFromSidebar: true },
  { name: 'Portal Admin', path: '/admin', icon: ShieldAlert, isAdmin: true, hideFromSidebar: true },
];

// List of paths that should be displayed in the mobile bottom navigation bar
export const mobileBottomBarPaths = [
  '/dashboard',
  '/transactions',
  '/pinjol',
  '/savings',
];
