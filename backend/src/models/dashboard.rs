use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardSummary {
    pub total_balance: Decimal,
    pub total_income: Decimal,
    pub total_expense: Decimal,
    pub net_savings: Decimal,
    pub savings_rate_percentage: Decimal,
    pub transaction_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorySpendingSummary {
    pub category_id: Option<uuid::Uuid>,
    pub category_name: String,
    pub color: String,
    pub total_amount: Decimal,
    pub percentage: Decimal,
}
