import { createClient } from '@/lib/supabase/client';

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

export const currencyService = {
  /**
   * Converts an amount from one currency to another using cached rates.
   * Default base currency is IDR.
   */
  async convert(amount: number, from: string, to: string = 'IDR'): Promise<number> {
    if (from === to) return amount;

    const rate = await this.getExchangeRate(from, to);
    return amount * rate;
  },

  /**
   * Fetches the exchange rate between two currencies.
   * Priority: Local cache -> External API (planned) -> fallback 1.0
   */
  async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1.0;

    const supabase = createClient();
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', from)
      .eq('to_currency', to)
      .maybeSingle();

    if (error || !data) {
      // Fallback manual rates if DB empty (Demo purposes)
      const manualRates: Record<string, number> = {
        'USD_IDR': 16300,
        'SGD_IDR': 12100,
        'EUR_IDR': 17500,
      };
      return manualRates[`${from}_${to}`] || 1.0;
    }

    return Number(data.rate);
  },

  /**
   * Returns supported currencies list.
   */
  getSupportedCurrencies() {
    return [
      { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
    ];
  }
};
