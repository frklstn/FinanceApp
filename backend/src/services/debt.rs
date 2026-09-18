use crate::models::debt::{Debt, LoanTracker, PayDebtRequest, PayLoanRequest};
use sqlx::{PgPool, Postgres, Transaction as SqlxTx};
use uuid::Uuid;

pub struct DebtService;

impl DebtService {
    pub async fn get_debts(pool: &PgPool, workspace_id: Uuid) -> Result<Vec<Debt>, sqlx::Error> {
        sqlx::query_as::<_, Debt>(
            r#"
            SELECT id, workspace_id, name, type, amount, interest_rate, due_date, 
                   status, description, remaining_amount, contact_info, currency, 
                   created_at, updated_at
            FROM debts
            WHERE workspace_id = $1
            ORDER BY status ASC, due_date ASC NULLS LAST
            "#,
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn get_loans(pool: &PgPool, workspace_id: Uuid) -> Result<Vec<LoanTracker>, sqlx::Error> {
        sqlx::query_as::<_, LoanTracker>(
            r#"
            SELECT id, workspace_id, category, amount_applied, amount_received, total_repayment,
                   monthly_payment, tenure_months, due_day, start_date, salary_date, status,
                   notes, payment_frequency, end_date, total_remaining_balance, penalty_fee,
                   can_early_payoff, currency, created_at, updated_at
            FROM loan_trackers
            WHERE workspace_id = $1
            ORDER BY status ASC, due_day ASC
            "#,
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn pay_debt(
        pool: &PgPool,
        workspace_id: Uuid,
        req: PayDebtRequest,
    ) -> Result<Debt, sqlx::Error> {
        let mut tx: SqlxTx<'_, Postgres> = pool.begin().await?;

        // 1. Cut wallet balance
        sqlx::query!(
            r#"UPDATE wallets SET balance = balance - $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
            req.amount,
            workspace_id,
            req.wallet_id
        )
        .execute(&mut *tx)
        .await?;

        // 2. Reduce remaining amount & update status
        let updated = sqlx::query_as::<_, Debt>(
            r#"
            UPDATE debts
            SET remaining_amount = GREATEST(0, remaining_amount - $1),
                status = CASE WHEN remaining_amount - $1 <= 0 THEN 'paid' ELSE status END,
                updated_at = now()
            WHERE workspace_id = $2 AND id = $3
            RETURNING id, workspace_id, name, type, amount, interest_rate, due_date, 
                      status, description, remaining_amount, contact_info, currency, 
                      created_at, updated_at
            "#,
        )
        .bind(req.amount)
        .bind(workspace_id)
        .bind(req.debt_id)
        .fetch_one(&mut *tx)
        .await?;

        // 3. Log payment record
        sqlx::query!(
            r#"
            INSERT INTO debt_payments (debt_id, wallet_id, amount, note)
            VALUES ($1, $2, $3, $4)
            "#,
            req.debt_id,
            req.wallet_id,
            req.amount,
            req.note
        )
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(updated)
    }

    pub async fn pay_loan(
        pool: &PgPool,
        workspace_id: Uuid,
        req: PayLoanRequest,
    ) -> Result<LoanTracker, sqlx::Error> {
        let mut tx: SqlxTx<'_, Postgres> = pool.begin().await?;

        // 1. Cut wallet balance
        sqlx::query!(
            r#"UPDATE wallets SET balance = balance - $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
            req.amount,
            workspace_id,
            req.wallet_id
        )
        .execute(&mut *tx)
        .await?;

        // 2. Reduce loan remaining balance
        let updated = sqlx::query_as::<_, LoanTracker>(
            r#"
            UPDATE loan_trackers
            SET total_remaining_balance = GREATEST(0, COALESCE(total_remaining_balance, total_repayment) - $1),
                status = CASE WHEN COALESCE(total_remaining_balance, total_repayment) - $1 <= 0 THEN 'paid' ELSE status END,
                updated_at = now()
            WHERE workspace_id = $2 AND id = $3
            RETURNING id, workspace_id, category, amount_applied, amount_received, total_repayment,
                      monthly_payment, tenure_months, due_day, start_date, salary_date, status,
                      notes, payment_frequency, end_date, total_remaining_balance, penalty_fee,
                      can_early_payoff, currency, created_at, updated_at
            "#,
        )
        .bind(req.amount)
        .bind(workspace_id)
        .bind(req.loan_id)
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(updated)
    }
}
