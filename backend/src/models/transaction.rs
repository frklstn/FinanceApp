use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Transaction {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub wallet_id: Uuid,
    pub category_id: Option<Uuid>,
    pub amount: Decimal,
    pub r#type: String, // 'income', 'expense', 'transfer'
    pub destination_wallet_id: Option<Uuid>,
    pub note: Option<String>,
    pub date: DateTime<Utc>,
    pub tags: Vec<String>,
    pub attachment_url: Option<String>,
    pub is_recurring: bool,
    pub recurring_id: Option<Uuid>,
    pub currency: String,
    pub exchange_rate: Decimal,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionRequest {
    pub wallet_id: Uuid,
    pub category_id: Option<Uuid>,
    pub amount: Decimal,
    pub r#type: String, // 'income', 'expense', 'transfer'
    pub destination_wallet_id: Option<Uuid>,
    pub note: Option<String>,
    pub date: Option<DateTime<Utc>>,
    pub tags: Option<Vec<String>>,
    pub currency: Option<String>,
    pub exchange_rate: Option<Decimal>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTransactionRequest {
    pub wallet_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub amount: Option<Decimal>,
    pub r#type: Option<String>,
    pub destination_wallet_id: Option<Uuid>,
    pub note: Option<String>,
    pub date: Option<DateTime<Utc>>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct TransactionQueryFilter {
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
    pub wallet_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub r#type: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
