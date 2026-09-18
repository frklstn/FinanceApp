use crate::models::api_key::{ApiKey, CreateApiKeyResponse};
use rand::RngCore;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use uuid::Uuid;

pub struct ApiKeyService;

impl ApiKeyService {
    pub fn hash_key(raw_key: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(raw_key.as_bytes());
        hex::encode(hasher.finalize())
    }

    pub async fn create_key(
        pool: &PgPool,
        workspace_id: Uuid,
        user_id: Uuid,
        name: Option<String>,
    ) -> Result<CreateApiKeyResponse, sqlx::Error> {
        // Generate a 32-byte cryptographically secure random token
        let mut random_bytes = [0u8; 24];
        rand::thread_rng().fill_bytes(&mut random_bytes);
        let random_hex = hex::encode(random_bytes);
        let raw_key = format!("fin_live_{}", random_hex);
        
        let prefix = format!("fin_live_{}", &random_hex[..6]);
        let key_hash = Self::hash_key(&raw_key);
        let key_name = name.unwrap_or_else(|| "Third-Party API Key".to_string());

        let record = sqlx::query!(
            r#"
            INSERT INTO api_keys (workspace_id, user_id, name, key_hash, key_prefix)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, key_prefix, created_at
            "#,
            workspace_id,
            user_id,
            key_name,
            key_hash,
            prefix
        )
        .fetch_one(pool)
        .await?;

        Ok(CreateApiKeyResponse {
            id: record.id,
            name: record.name,
            key: raw_key, // Returned only once upon creation
            prefix: record.key_prefix,
            created_at: record.created_at,
        })
    }

    pub async fn validate_key(
        pool: &PgPool,
        raw_key: &str,
    ) -> Result<Option<(Uuid, Uuid)>, sqlx::Error> {
        let key_hash = Self::hash_key(raw_key);

        let row = sqlx::query!(
            r#"
            UPDATE api_keys
            SET last_used_at = now()
            WHERE key_hash = $1 AND is_active = true
            RETURNING user_id, workspace_id
            "#,
            key_hash
        )
        .fetch_optional(pool)
        .await?;

        Ok(row.map(|r| (r.user_id, r.workspace_id)))
    }

    pub async fn list_keys(pool: &PgPool, workspace_id: Uuid) -> Result<Vec<ApiKey>, sqlx::Error> {
        sqlx::query_as::<_, ApiKey>(
            r#"
            SELECT id, workspace_id, user_id, name, key_prefix, last_used_at, is_active, created_at
            FROM api_keys
            WHERE workspace_id = $1 AND is_active = true
            ORDER BY created_at DESC
            "#,
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn revoke_key(
        pool: &PgPool,
        workspace_id: Uuid,
        key_id: Uuid,
    ) -> Result<bool, sqlx::Error> {
        let res = sqlx::query!(
            r#"
            UPDATE api_keys
            SET is_active = false, updated_at = now()
            WHERE workspace_id = $1 AND id = $2
            "#,
            workspace_id,
            key_id
        )
        .execute(pool)
        .await?;

        Ok(res.rows_affected() > 0)
    }
}
