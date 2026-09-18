use crate::models::dashboard::{CategorySpendingSummary, DashboardSummary};
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

pub struct DashboardService;

impl DashboardService {
    pub async fn get_summary(
        pool: &PgPool,
        workspace_id: Uuid,
        start_date: DateTime<Utc>,
        end_date: DateTime<Utc>,
    ) -> Result<DashboardSummary, sqlx::Error> {
        // 1. Total Balance from Wallets (Single SQL)
        let wallet_row = sqlx::query!(
            r#"
            SELECT COALESCE(SUM(balance), 0) AS "total_balance!"
            FROM wallets
            WHERE workspace_id = $1 AND is_active = true
            "#,
            workspace_id
        )
        .fetch_one(pool)
        .await?;

        // 2. Single-pass CTE aggregation for Income, Expense & Count
        let tx_row = sqlx::query!(
            r#"
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount * exchange_rate ELSE 0 END), 0) AS "total_income!",
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount * exchange_rate ELSE 0 END), 0) AS "total_expense!",
                COUNT(*) AS "tx_count!"
            FROM transactions
            WHERE workspace_id = $1 AND date >= $2 AND date <= $3
            "#,
            workspace_id,
            start_date,
            end_date
        )
        .fetch_one(pool)
        .await?;

        let total_income = tx_row.total_income;
        let total_expense = tx_row.total_expense;
        let net_savings = total_income - total_expense;

        let savings_rate = if !total_income.is_zero() && total_income > Decimal::ZERO {
            (net_savings / total_income) * Decimal::from(100)
        } else {
            Decimal::ZERO
        };

        Ok(DashboardSummary {
            total_balance: wallet_row.total_balance,
            total_income,
            total_expense,
            net_savings,
            savings_rate_percentage: savings_rate.round_dp(2),
            transaction_count: tx_row.tx_count,
        })
    }

    pub async fn get_category_spending(
        pool: &PgPool,
        workspace_id: Uuid,
        start_date: DateTime<Utc>,
        end_date: DateTime<Utc>,
    ) -> Result<Vec<CategorySpendingSummary>, sqlx::Error> {
        let rows = sqlx::query!(
            r#"
            WITH total_exp AS (
                SELECT COALESCE(SUM(amount * exchange_rate), 0) as total
                FROM transactions
                WHERE workspace_id = $1 AND type = 'expense' AND date >= $2 AND date <= $3
            )
            SELECT 
                t.category_id,
                COALESCE(c.name, 'Lainnya') AS "category_name!",
                COALESCE(c.color, '#9CA3AF') AS "color!",
                SUM(t.amount * t.exchange_rate) AS "total_amount!",
                CASE 
                    WHEN (SELECT total FROM total_exp) > 0 
                    THEN ROUND((SUM(t.amount * t.exchange_rate) / (SELECT total FROM total_exp) * 100)::numeric, 2)
                    ELSE 0 
                END AS "percentage!"
            FROM transactions t
            LEFT JOIN categories c ON c.id = t.category_id
            WHERE t.workspace_id = $1 AND t.type = 'expense' AND t.date >= $2 AND t.date <= $3
            GROUP BY t.category_id, c.name, c.color
            ORDER BY SUM(t.amount * t.exchange_rate) DESC
            "#,
            workspace_id,
            start_date,
            end_date
        )
        .fetch_all(pool)
        .await?;

        let result = rows
            .into_iter()
            .map(|r| CategorySpendingSummary {
                category_id: r.category_id,
                category_name: r.category_name,
                color: r.color,
                total_amount: r.total_amount,
                percentage: r.percentage,
            })
            .collect();

        Ok(result)
    }
}
