use crate::middleware::auth::AuthUser;
use crate::models::budget::CreateBudgetRequest;
use crate::models::common::ApiResponse;
use crate::services::budget::BudgetService;
use axum::{
    extract::{Extension, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;

#[derive(Debug, Deserialize)]
pub struct PeriodQuery {
    pub period: Option<String>,
}

pub async fn list_categories_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    match BudgetService::get_categories(&pool, auth.workspace_id).await {
        Ok(categories) => (StatusCode::OK, Json(ApiResponse::ok(categories))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn list_budgets_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Query(query): Query<PeriodQuery>,
) -> impl IntoResponse {
    let now = chrono::Utc::now();
    let default_period = format!("{:04}-{:02}", chrono::Datelike::year(&now.date_naive()), chrono::Datelike::month(&now.date_naive()));
    let period = query.period.unwrap_or(default_period);

    match BudgetService::get_budgets(&pool, auth.workspace_id, &period).await {
        Ok(budgets) => (StatusCode::OK, Json(ApiResponse::ok(budgets))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn set_budget_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<CreateBudgetRequest>,
) -> impl IntoResponse {
    match BudgetService::set_budget(&pool, auth.workspace_id, payload).await {
        Ok(budget) => (
            StatusCode::OK,
            Json(ApiResponse::ok_msg(budget, "Anggaran berhasil disimpan")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}
