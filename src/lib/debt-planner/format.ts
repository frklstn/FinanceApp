export function formatCurrency(amount: number, currencyCode: string = 'IDR'): string {
  const localeMap: Record<string, string> = {
    'IDR': 'id-ID',
    'USD': 'en-US',
    'SGD': 'en-SG',
    'EUR': 'de-DE',
    'BTC': 'en-US',
  };

  return new Intl.NumberFormat(localeMap[currencyCode] || 'id-ID', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currencyCode === 'BTC' ? 8 : 0,
    maximumFractionDigits: currencyCode === 'BTC' ? 8 : 0,
  }).format(amount);
}

export function formatDateId(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
