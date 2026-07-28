-- RPC untuk kontribusi tabungan secara atomik
create or replace function add_savings_contribution(
  p_workspace_id uuid,
  p_goal_id uuid,
  p_wallet_id uuid,
  p_amount numeric,
  p_note text
) returns void as $$
declare
  v_balance numeric;
  v_current numeric;
  v_target numeric;
begin
  -- Cek & Kurangi Saldo Wallet
  select balance into v_balance from wallets where id = p_wallet_id;
  if v_balance is null then
    raise exception 'Dompet tidak ditemukan.';
  end if;
  if v_balance < p_amount then
    raise exception 'Saldo dompet tidak mencukupi.';
  end if;
  update wallets set balance = balance - p_amount where id = p_wallet_id;

  -- Cek & Tambah Saldo Goal
  select current_amount, target_amount into v_current, v_target from savings_goals where id = p_goal_id;
  if v_current is null then
    raise exception 'Target tabungan tidak ditemukan.';
  end if;
  update savings_goals set 
    current_amount = v_current + p_amount,
    is_completed = (v_current + p_amount) >= v_target,
    updated_at = now()
  where id = p_goal_id;

  -- Insert Transaksi Log
  insert into transactions (
    workspace_id, wallet_id, amount, type, note, date, currency, exchange_rate
  ) values (
    p_workspace_id, p_wallet_id, p_amount, 'expense', p_note, now(), 'IDR', 1.0
  );
end;
$$ language plpgsql;

-- RPC untuk pembayaran utang/piutang secara atomik
create or replace function record_debt_payment(
  p_workspace_id uuid,
  p_debt_id uuid,
  p_wallet_id uuid,
  p_amount numeric,
  p_note text
) returns void as $$
declare
  v_debt_type text;
  v_rem_amount numeric;
  v_wallet_bal numeric;
  v_currency text;
  v_rate numeric;
begin
  select type, remaining_amount, currency into v_debt_type, v_rem_amount, v_currency from debts where id = p_debt_id;
  if v_debt_type is null then
    raise exception 'Rekam utang/piutang tidak ditemukan.';
  end if;
  
  select balance into v_wallet_bal from wallets where id = p_wallet_id;
  if v_wallet_bal is null then
    raise exception 'Dompet tidak ditemukan.';
  end if;

  if v_rem_amount < p_amount then
    raise exception 'Pembayaran melebihi sisa kewajiban.';
  end if;

  -- Update Wallet & Debts berdasarkan arah utang/piutang
  if v_debt_type = 'owe' then
    if v_wallet_bal < p_amount then 
      raise exception 'Saldo dompet tidak mencukupi.'; 
    end if;
    update wallets set balance = balance - p_amount where id = p_wallet_id;
  else
    update wallets set balance = balance + p_amount where id = p_wallet_id;
  end if;

  update debts set 
    remaining_amount = remaining_amount - p_amount,
    status = case when (remaining_amount - p_amount) <= 0 then 'settled'::text else 'active'::text end,
    updated_at = now()
  where id = p_debt_id;

  -- Insert Payment Sub-Record
  insert into debt_payments (
    debt_id, amount, wallet_id, note, created_at
  ) values (
    p_debt_id, p_amount, p_wallet_id, p_note, now()
  );
  
  -- Resolve exchange rate
  select rate into v_rate from exchange_rates where from_currency = v_currency and to_currency = 'IDR' limit 1;
  
  -- Log ke buku besar transaksi
  insert into transactions (
    workspace_id, wallet_id, amount, type, note, currency, exchange_rate, date
  ) values (
    p_workspace_id, p_wallet_id, p_amount, 
    case when v_debt_type = 'owe' then 'expense'::text else 'income'::text end, 
    p_note, v_currency, coalesce(v_rate, 1.0), now()
  );
end;
$$ language plpgsql;
