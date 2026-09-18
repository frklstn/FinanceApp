use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Category {
    pub id: Uuid,
    pub workspace_id: Option<Uuid>,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub r#type: String,
    pub parent_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Budget {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub category_id: Uuid,
    pub amount: Decimal,
    pub period: String, // e.g. "2026-09"
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub currency: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBudgetRequest {
    pub category_id: Uuid,
    pub amount: Decimal,
    pub period: String,
}
