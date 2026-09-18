use crate::models::wallet::{CreateWalletRequest, UpdateWalletRequest, Wallet};
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

pub struct WalletService;

impl WalletService {
    pub async fn get_wallets(pool: &PgPool, workspace_id: Uuid) -> Result<Vec<Wallet>, sqlx::Error> {
        sqlx::query_as::<_, Wallet>(
            r#"
            SELECT id, workspace_id, name, type, balance, color, icon, is_active, currency, created_at, updated_at
            FROM wallets
            WHERE workspace_id = $1
            ORDER BY is_active DESC, name ASC
            "#,
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn get_wallet_by_id(
        pool: &PgPool,
        workspace_id: Uuid,
        wallet_id: Uuid,
    ) -> Result<Option<Wallet>, sqlx::Error> {
        sqlx::query_as::<_, Wallet>(
            r#"
            SELECT id, workspace_id, name, type, balance, color, icon, is_active, currency, created_at, updated_at
            FROM wallets
            WHERE workspace_id = $1 AND id = $2
            LIMIT 1
            "#,
        )
        .bind(workspace_id)
        .bind(wallet_id)
        .fetch_optional(pool)
        .await
    }

    pub async fn create_wallet(
        pool: &PgPool,
        workspace_id: Uuid,
        req: CreateWalletRequest,
    ) -> Result<Wallet, sqlx::Error> {
        let name = req.name.trim();
        let w_type = req.r#type.unwrap_or_else(|| "cash".to_string());
        let balance = req.balance.unwrap_or(Decimal::ZERO);
        let color = req.color.unwrap_or_else(|| "#4F46E5".to_string());
        let icon = req.icon.unwrap_or_else(|| "wallet".to_string());
        let currency = req.currency.unwrap_or_else(|| "IDR".to_string());

        sqlx::query_as::<_, Wallet>(
            r#"
            INSERT INTO wallets (workspace_id, name, type, balance, color, icon, is_active, currency)
            VALUES ($1, $2, $3, $4, $5, $6, true, $7)
            RETURNING id, workspace_id, name, type, balance, color, icon, is_active, currency, created_at, updated_at
            "#,
        )
        .bind(workspace_id)
        .bind(name)
        .bind(w_type)
        .bind(balance)
        .bind(color)
        .bind(icon)
        .bind(currency)
        .fetch_one(pool)
        .await
    }

    pub async fn update_wallet(
        pool: &PgPool,
        workspace_id: Uuid,
        wallet_id: Uuid,
        req: UpdateWalletRequest,
    ) -> Result<Option<Wallet>, sqlx::Error> {
        let existing = Self::get_wallet_by_id(pool, workspace_id, wallet_id).await?;
        let existing = match existing {
            Some(w) => w,
            None => return Ok(None),
        };

        let name = req.name.unwrap_or(existing.name);
        let w_type = req.r#type.unwrap_or(existing.r#type);
        let color = req.color.unwrap_or(existing.color);
        let icon = req.icon.unwrap_or(existing.icon);
        let is_active = req.is_active.unwrap_or(existing.is_active);

        let updated = sqlx::query_as::<_, Wallet>(
            r#"
            UPDATE wallets
            SET name = $1, type = $2, color = $3, icon = $4, is_active = $5, updated_at = now()
            WHERE workspace_id = $6 AND id = $7
            RETURNING id, workspace_id, name, type, balance, color, icon, is_active, currency, created_at, updated_at
            "#,
        )
        .bind(name)
        .bind(w_type)
        .bind(color)
        .bind(icon)
        .bind(is_active)
        .bind(workspace_id)
        .bind(wallet_id)
        .fetch_optional(pool)
        .await?;

        Ok(updated)
    }

    pub async fn delete_wallet(
        pool: &PgPool,
        workspace_id: Uuid,
        wallet_id: Uuid,
    ) -> Result<bool, sqlx::Error> {
        let res = sqlx::query!(
            r#"
            DELETE FROM wallets
            WHERE workspace_id = $1 AND id = $2
            "#,
            workspace_id,
            wallet_id
        )
        .execute(pool)
        .await?;

        Ok(res.rows_affected() > 0)
    }
}
