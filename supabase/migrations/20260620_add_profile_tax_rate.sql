-- Add tax_rate column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 15.00;
