use crate::models::budget::{Budget, Category, CreateBudgetRequest};
use sqlx::PgPool;
use uuid::Uuid;

pub struct BudgetService;

impl BudgetService {
    pub async fn get_categories(
        pool: &PgPool,
        workspace_id: Uuid,
    ) -> Result<Vec<Category>, sqlx::Error> {
        sqlx::query_as::<_, Category>(
            r#"
            SELECT id, workspace_id, name, icon, color, type, parent_id, created_at, updated_at
            FROM categories
            WHERE workspace_id = $1 OR workspace_id IS NULL
            ORDER BY name ASC
            "#,
        )
        .bind(workspace_id)
        .fetch_all(pool)
        .await
    }

    pub async fn create_category(
        pool: &PgPool,
        workspace_id: Uuid,
        name: &str,
        icon: &str,
        color: &str,
        c_type: &str,
    ) -> Result<Category, sqlx::Error> {
        sqlx::query_as::<_, Category>(
            r#"
            INSERT INTO categories (workspace_id, name, icon, color, type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, workspace_id, name, icon, color, type, parent_id, created_at, updated_at
            "#,
        )
        .bind(workspace_id)
        .bind(name)
        .bind(icon)
        .bind(color)
        .bind(c_type)
        .fetch_one(pool)
        .await
    }

    pub async fn get_budgets(
        pool: &PgPool,
        workspace_id: Uuid,
        period: &str,
    ) -> Result<Vec<Budget>, sqlx::Error> {
        sqlx::query_as::<_, Budget>(
            r#"
            SELECT id, workspace_id, category_id, amount, period, start_date, end_date, currency, created_at, updated_at
            FROM budgets
            WHERE workspace_id = $1 AND period = $2
            "#,
        )
        .bind(workspace_id)
        .bind(period)
        .fetch_all(pool)
        .await
    }

    pub async fn set_budget(
        pool: &PgPool,
        workspace_id: Uuid,
        req: CreateBudgetRequest,
    ) -> Result<Budget, sqlx::Error> {
        // Parse period "YYYY-MM" to compute start_date and end_date
        let parts: Vec<&str> = req.period.split('-').collect();
        let year: i32 = parts.get(0).and_then(|y| y.parse().ok()).unwrap_or(2026);
        let month: u32 = parts.get(1).and_then(|m| m.parse().ok()).unwrap_or(1);

        let start_date = chrono::NaiveDate::from_ymd_opt(year, month, 1).unwrap();
        let next_month = if month == 12 { 1 } else { month + 1 };
        let next_year = if month == 12 { year + 1 } else { year };
        let end_date = chrono::NaiveDate::from_ymd_opt(next_year, next_month, 1)
            .unwrap()
            .pred_opt()
            .unwrap();

        sqlx::query_as::<_, Budget>(
            r#"
            INSERT INTO budgets (workspace_id, category_id, amount, period, start_date, end_date, currency)
            VALUES ($1, $2, $3, $4, $5, $6, 'IDR')
            ON CONFLICT (workspace_id, category_id, period)
            DO UPDATE SET amount = EXCLUDED.amount, updated_at = now()
            RETURNING id, workspace_id, category_id, amount, period, start_date, end_date, currency, created_at, updated_at
            "#,
        )
        .bind(workspace_id)
        .bind(req.category_id)
        .bind(req.amount)
        .bind(&req.period)
        .bind(start_date)
        .bind(end_date)
        .fetch_one(pool)
        .await
    }
}
