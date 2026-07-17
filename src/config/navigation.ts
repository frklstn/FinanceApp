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
  TrendingDown,
  LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
  name: string;
  path: string;
  icon: LucideIcon;
  isAdmin?: boolean;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

/**
 * Satu-satunya sumber navigasi: sidebar pakai grup, mobile nav pakai versi
 * flat yang diturunkan dari sini. Setiap path wajib punya halaman nyata di
 * src/app -- jangan tambah entri tanpa halaman.
 */
export const navigationGroups: NavigationGroup[] = [
  {
    title: 'Menu utama',
    items: [
      { name: 'Dashboard', path: '/finance/dashboard', icon: LayoutDashboard },
      { name: 'Transaksi', path: '/finance/transactions', icon: ArrowLeftRight },
      { name: 'Dompet', path: '/finance/wallets', icon: Wallet },
      { name: 'Anggaran', path: '/finance/budgets', icon: PieChart },
      { name: 'Tabungan', path: '/finance/savings', icon: Target },
      { name: 'Utang', path: '/finance/debts', icon: TrendingDown },
      { name: 'Pinjol', path: '/finance/pinjol', icon: AlertTriangle },
      { name: 'Laporan', path: '/finance/reports', icon: BarChart3 },
      { name: 'Insight', path: '/finance/insights', icon: Sparkles },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      { name: 'Admin', path: '/user/admin', icon: ShieldAlert, isAdmin: true },
      { name: 'Pengaturan', path: '/finance/settings', icon: Settings },
    ],
  },
];

/** Versi flat untuk mobile nav -- diturunkan, bukan daftar kedua. */
export const navigationItems: NavigationItem[] = navigationGroups.flatMap((g) => g.items);

/** Tampil di bottom bar mobile; sisanya masuk drawer "Lainnya". */
export const mobileBottomBarPaths = [
  '/finance/dashboard',
  '/finance/transactions',
  '/finance/wallets',
  '/finance/pinjol',
];
