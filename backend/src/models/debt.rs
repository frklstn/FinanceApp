use chrono::{DateTime, NaiveDate, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Debt {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub name: String,
    pub r#type: String,
    pub amount: Decimal,
    pub interest_rate: Decimal,
    pub due_date: Option<NaiveDate>,
    pub status: String,
    pub description: Option<String>,
    pub remaining_amount: Decimal,
    pub contact_info: Option<String>,
    pub currency: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct LoanTracker {
    pub id: Uuid,
    pub workspace_id: Uuid,
    pub category: String,
    pub amount_applied: Option<Decimal>,
    pub amount_received: Decimal,
    pub total_repayment: Decimal,
    pub monthly_payment: Decimal,
    pub tenure_months: i32,
    pub due_day: i32,
    pub start_date: NaiveDate,
    pub salary_date: Option<i32>,
    pub status: String,
    pub notes: Option<String>,
    pub payment_frequency: Option<String>,
    pub end_date: Option<NaiveDate>,
    pub total_remaining_balance: Option<Decimal>,
    pub penalty_fee: Option<Decimal>,
    pub can_early_payoff: Option<bool>,
    pub currency: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct PayDebtRequest {
    pub debt_id: Uuid,
    pub wallet_id: Uuid,
    pub amount: Decimal,
    pub note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PayLoanRequest {
    pub loan_id: Uuid,
    pub wallet_id: Uuid,
    pub amount: Decimal,
    pub note: Option<String>,
}
