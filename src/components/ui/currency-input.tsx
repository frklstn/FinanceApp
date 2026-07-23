'use client';

import React from 'react';
import { Input } from '@/components/ui/input';

type CurrencyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  label?: string;
  error?: string;
  description?: string;
  /** Nilai mentah (hanya digit) atau angka. */
  value: string | number;
  /** Menerima string digit mentah, mis. "200000". Pakai Number() untuk memakainya. */
  onChange: (raw: string) => void;
};

/**
 * Input nominal rupiah dengan pemisah ribuan otomatis: user mengetik angka,
 * tampilan jadi "200.000", tapi nilai yang disimpan tetap digit mentah
 * ("200000"). Memakai type=text + inputMode numeric karena input number tidak
 * bisa menampilkan titik ribuan.
 */
export function CurrencyInput({ value, onChange, ...rest }: CurrencyInputProps) {
  const raw = String(value ?? '').replace(/\D/g, '');
  const display = raw ? Number(raw).toLocaleString('id-ID') : '';
  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
    />
  );
}
