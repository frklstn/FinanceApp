-- 1. Jalankan script ini di SQL Editor Supabase
-- 2. Pastikan database terhubung dengan proyek yang benar (ref: kortbujyuafwdiqxsiok)

create or replace function create_transaction(
  p_workspace_id uuid,
  p_wallet_id uuid,
  p_category_id uuid,
  p_amount numeric,
  p_type text,
  p_destination_wallet_id uuid,
  p_note text,
  p_date timestamptz,
  p_tags text[],
  p_currency text,
  p_exchange_rate numeric,
  p_is_recurring boolean
) returns transactions as $$
declare
  v_transaction transactions;
begin
  -- Update source wallet
  if p_type = 'income' then
    update wallets set balance = balance + p_amount where id = p_wallet_id;
  elsif p_type = 'expense' then
    update wallets set balance = balance - p_amount where id = p_wallet_id;
  elsif p_type = 'transfer' then
    update wallets set balance = balance - p_amount where id = p_wallet_id;
    update wallets set balance = balance + p_amount where id = p_destination_wallet_id;
  end if;

  -- Insert transaction
  insert into transactions (
    workspace_id, wallet_id, category_id, amount, type, 
    destination_wallet_id, note, date, tags, currency, 
    exchange_rate, is_recurring
  ) values (
    p_workspace_id, p_wallet_id, p_category_id, p_amount, p_type,
    p_destination_wallet_id, p_note, p_date, p_tags, p_currency,
    p_exchange_rate, p_is_recurring
  ) returning * into v_transaction;

  return v_transaction;
end;
$$ language plpgsql;

create or replace function delete_transaction(p_id uuid) returns void as $$
declare
  v_tx transactions;
begin
  -- Fetch the transaction first to get details
  select * into v_tx from transactions where id = p_id;
  if not found then
    raise exception 'Transaction not found';
  end if;

  -- Rollback wallet balance
  if v_tx.type = 'income' then
    update wallets set balance = balance - v_tx.amount where id = v_tx.wallet_id;
  elsif v_tx.type = 'expense' then
    update wallets set balance = balance + v_tx.amount where id = v_tx.wallet_id;
  elsif v_tx.type = 'transfer' then
    update wallets set balance = balance + v_tx.amount where id = v_tx.wallet_id;
    if v_tx.destination_wallet_id is not null then
      update wallets set balance = balance - v_tx.amount where id = v_tx.destination_wallet_id;
    end if;
  end if;

  -- Delete the transaction
  delete from transactions where id = p_id;
end;
$$ language plpgsql;

create or replace function update_transaction(
  p_id uuid,
  p_wallet_id uuid,
  p_category_id uuid,
  p_amount numeric,
  p_type text,
  p_destination_wallet_id uuid,
  p_note text,
  p_date timestamptz,
  p_tags text[],
  p_attachment_url text,
  p_is_recurring boolean
) returns transactions as $$
declare
  v_old_tx transactions;
  v_new_tx transactions;
begin
  -- Fetch the old transaction first
  select * into v_old_tx from transactions where id = p_id;
  if not found then
    raise exception 'Transaction not found';
  end if;

  -- 1. Rollback old wallet balance
  if v_old_tx.type = 'income' then
    update wallets set balance = balance - v_old_tx.amount where id = v_old_tx.wallet_id;
  elsif v_old_tx.type = 'expense' then
    update wallets set balance = balance + v_old_tx.amount where id = v_old_tx.wallet_id;
  elsif v_old_tx.type = 'transfer' then
    update wallets set balance = balance + v_old_tx.amount where id = v_old_tx.wallet_id;
    if v_old_tx.destination_wallet_id is not null then
      update wallets set balance = balance - v_old_tx.amount where id = v_old_tx.destination_wallet_id;
    end if;
  end if;

  -- 2. Apply new wallet balance
  if p_type = 'income' then
    update wallets set balance = balance + p_amount where id = p_wallet_id;
  elsif p_type = 'expense' then
    update wallets set balance = balance - p_amount where id = p_wallet_id;
  elsif p_type = 'transfer' then
    update wallets set balance = balance - p_amount where id = p_wallet_id;
    if p_destination_wallet_id is not null then
      update wallets set balance = balance + p_amount where id = p_destination_wallet_id;
    end if;
  end if;

  -- 3. Update the transaction
  update transactions set
    wallet_id = p_wallet_id,
    category_id = p_category_id,
    amount = p_amount,
    type = p_type,
    destination_wallet_id = p_destination_wallet_id,
    note = p_note,
    date = p_date,
    tags = p_tags,
    attachment_url = p_attachment_url,
    is_recurring = p_is_recurring,
    updated_at = now()
  where id = p_id
  returning * into v_new_tx;

  return v_new_tx;
end;
$$ language plpgsql;
