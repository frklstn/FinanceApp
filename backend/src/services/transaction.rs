use crate::models::transaction::{CreateTransactionRequest, Transaction, TransactionQueryFilter};
use chrono::Utc;
use rust_decimal::Decimal;
use sqlx::{PgPool, Postgres, Transaction as SqlxTx};
use uuid::Uuid;

pub struct TransactionService;

impl TransactionService {
    pub async fn get_transactions(
        pool: &PgPool,
        workspace_id: Uuid,
        filter: TransactionQueryFilter,
    ) -> Result<Vec<Transaction>, sqlx::Error> {
        let limit = filter.limit.unwrap_or(50).clamp(1, 200);
        let offset = filter.offset.unwrap_or(0).max(0);

        // Uses our newly created composite index idx_transactions_ws_date
        sqlx::query_as::<_, Transaction>(
            r#"
            SELECT id, workspace_id, wallet_id, category_id, amount, type, 
                   destination_wallet_id, note, date, tags, attachment_url, 
                   is_recurring, recurring_id, currency, exchange_rate, 
                   created_at, updated_at
            FROM transactions
            WHERE workspace_id = $1
              AND ($2::timestamptz IS NULL OR date >= $2)
              AND ($3::timestamptz IS NULL OR date <= $3)
              AND ($4::uuid IS NULL OR wallet_id = $4)
              AND ($5::uuid IS NULL OR category_id = $5)
              AND ($6::text IS NULL OR type = $6)
            ORDER BY date DESC, created_at DESC
            LIMIT $7 OFFSET $8
            "#,
        )
        .bind(workspace_id)
        .bind(filter.start_date)
        .bind(filter.end_date)
        .bind(filter.wallet_id)
        .bind(filter.category_id)
        .bind(filter.r#type)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await
    }

    pub async fn create_transaction(
        pool: &PgPool,
        workspace_id: Uuid,
        req: CreateTransactionRequest,
    ) -> Result<Transaction, sqlx::Error> {
        let mut tx: SqlxTx<'_, Postgres> = pool.begin().await?;

        let date = req.date.unwrap_or_else(Utc::now);
        let currency = req.currency.unwrap_or_else(|| "IDR".to_string());
        let exchange_rate = req.exchange_rate.unwrap_or(Decimal::ONE);
        let tags = req.tags.unwrap_or_default();

        // 1. Insert Transaction
        let record = sqlx::query_as::<_, Transaction>(
            r#"
            INSERT INTO transactions (
                workspace_id, wallet_id, category_id, amount, type, 
                destination_wallet_id, note, date, tags, currency, exchange_rate
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id, workspace_id, wallet_id, category_id, amount, type, 
                      destination_wallet_id, note, date, tags, attachment_url, 
                      is_recurring, recurring_id, currency, exchange_rate, 
                      created_at, updated_at
            "#,
        )
        .bind(workspace_id)
        .bind(req.wallet_id)
        .bind(req.category_id)
        .bind(req.amount)
        .bind(&req.r#type)
        .bind(req.destination_wallet_id)
        .bind(req.note)
        .bind(date)
        .bind(&tags)
        .bind(currency)
        .bind(exchange_rate)
        .fetch_one(&mut *tx)
        .await?;

        // 2. Adjust Wallet Balances atomically
        match req.r#type.as_str() {
            "income" => {
                sqlx::query!(
                    r#"UPDATE wallets SET balance = balance + $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
                    req.amount,
                    workspace_id,
                    req.wallet_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "expense" => {
                sqlx::query!(
                    r#"UPDATE wallets SET balance = balance - $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
                    req.amount,
                    workspace_id,
                    req.wallet_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "transfer" => {
                if let Some(dest_id) = req.destination_wallet_id {
                    sqlx::query!(
                        r#"UPDATE wallets SET balance = balance - $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
                        req.amount,
                        workspace_id,
                        req.wallet_id
                    )
                    .execute(&mut *tx)
                    .await?;

                    sqlx::query!(
                        r#"UPDATE wallets SET balance = balance + $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
                        req.amount,
                        workspace_id,
                        dest_id
                    )
                    .execute(&mut *tx)
                    .await?;
                }
            }
            _ => {}
        }

        tx.commit().await?;
        Ok(record)
    }

    pub async fn delete_transaction(
        pool: &PgPool,
        workspace_id: Uuid,
        transaction_id: Uuid,
    ) -> Result<bool, sqlx::Error> {
        let mut tx: SqlxTx<'_, Postgres> = pool.begin().await?;

        let existing = sqlx::query_as::<_, Transaction>(
            r#"SELECT * FROM transactions WHERE workspace_id = $1 AND id = $2"#,
        )
        .bind(workspace_id)
        .bind(transaction_id)
        .fetch_optional(&mut *tx)
        .await?;

        let existing = match existing {
            Some(t) => t,
            None => return Ok(false),
        };

        // Revert wallet balance changes
        match existing.r#type.as_str() {
            "income" => {
                sqlx::query!(
                    r#"UPDATE wallets SET balance = balance - $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
                    existing.amount,
                    workspace_id,
                    existing.wallet_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "expense" => {
                sqlx::query!(
                    r#"UPDATE wallets SET balance = balance + $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
                    existing.amount,
                    workspace_id,
                    existing.wallet_id
                )
                .execute(&mut *tx)
                .await?;
            }
            "transfer" => {
                if let Some(dest_id) = existing.destination_wallet_id {
                    sqlx::query!(
                        r#"UPDATE wallets SET balance = balance + $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
                        existing.amount,
                        workspace_id,
                        existing.wallet_id
                    )
                    .execute(&mut *tx)
                    .await?;

                    sqlx::query!(
                        r#"UPDATE wallets SET balance = balance - $1, updated_at = now() WHERE workspace_id = $2 AND id = $3"#,
                        existing.amount,
                        workspace_id,
                        dest_id
                    )
                    .execute(&mut *tx)
                    .await?;
                }
            }
            _ => {}
        }

        sqlx::query!(
            r#"DELETE FROM transactions WHERE workspace_id = $1 AND id = $2"#,
            workspace_id,
            transaction_id
        )
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(true)
    }
}
