use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SavingsGoal {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub wallet_id: Option<Uuid>,
    pub name: String,
    pub target_amount: Decimal,
    pub current_amount: Decimal,
    pub deadline: Option<NaiveDate>,
    pub is_completed: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ContributeSavingsRequest {
    pub savings_goal_id: Uuid,
    pub wallet_id: Uuid,
    pub amount: Decimal,
}
