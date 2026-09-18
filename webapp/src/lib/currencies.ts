/**
 * Daftar mata uang. Sengaja di modul biasa (bukan di currency.service.ts yang
 * 'server-only'): daftar ini dipakai form di client, dan mengimpornya dari
 * service akan menyeret 'pg' ke bundle browser.
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'IDR', name: 'Rupiah' },
  { code: 'USD', name: 'US Dollar' },
] as const;
