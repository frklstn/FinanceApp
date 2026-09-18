import "server-only";
import { query } from '@/lib/db/server';

export const currencyService = {
  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;
    
    const { rows } = await query(
      'SELECT rate FROM exchange_rates WHERE from_currency = $1 AND to_currency = $2',
      [from, to]
    );

    if (rows.length === 0) return amount; // Fallback
    return amount * Number(rows[0].rate);
  },

};
