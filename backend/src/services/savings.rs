use crate::models::savings::{ContributeSavingsRequest, SavingsGoal};
use chrono::NaiveDate;
use rust_decimal::Decimal;
use sqlx::{PgPool, Postgres, Transaction as SqlxTx};
use uuid::Uuid;

pub struct SavingsService;

impl SavingsService {
    pub async fn get_savings_goals(
        pool: &PgPool,
        workspace_id: Uuid,
    ) -> Result<Vec<SavingsGoal>, sqlx::Error> {
        sqlx::query_as::<_, SavingsGoal>(
            r#"
            SELECT id, workspace_id, wallet_id, name, target_amount, current_amount, 
                   deadline, is_completed, created_at, updated_at
            FROM savings_goals
            WHERE workspace_id = $1
            ORDER BY is_completed ASC, created_at DESC
            "#,
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn create_savings_goal(
        pool: &PgPool,
        workspace_id: Uuid,
        name: &str,
        target_amount: Decimal,
        wallet_id: Option<Uuid>,
        deadline: Option<NaiveDate>,
    ) -> Result<SavingsGoal, sqlx::Error> {
        sqlx::query_as::<_, SavingsGoal>(
            r#"
            INSERT INTO savings_goals (workspace_id, name, target_amount, wallet_id, deadline)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, workspace_id, wallet_id, name, target_amount, current_amount, 
                      deadline, is_completed, created_at, updated_at
            "#,
        )
        .bind(workspace_id)
        .bind(name)
        .bind(target_amount)
        .bind(wallet_id)
        .bind(deadline)
        .fetch_one(pool)
        .await
    }

    pub async fn contribute(
        pool: &PgPool,
        workspace_id: Uuid,
        req: ContributeSavingsRequest,
    ) -> Result<SavingsGoal, sqlx::Error> {
        let mut tx: SqlxTx<'_, Postgres> = pool.begin().await?;

        // 1. Potong saldo dompet
        sqlx::query!(
            r#"UPDATE wallets SET balance = balance - $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
            req.amount,
            workspace_id,
            req.wallet_id
        )
        .execute(&mut *tx)
        .await?;

        // 2. Tambah current_amount pada savings_goal
        let updated = sqlx::query_as::<_, SavingsGoal>(
            r#"
            UPDATE savings_goals
            SET current_amount = current_amount + $1,
                is_completed = CASE WHEN current_amount + $1 >= target_amount THEN true ELSE is_completed END,
                updated_at = now()
            WHERE workspace_id = $2 AND id = $3
            RETURNING id, workspace_id, wallet_id, name, target_amount, current_amount, 
                      deadline, is_completed, created_at, updated_at
            "#,
        )
        .bind(req.amount)
        .bind(workspace_id)
        .bind(req.savings_goal_id)
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(updated)
    }
}
