use crate::middleware::auth::AuthUser;
use crate::models::common::ApiResponse;
use crate::services::dashboard::DashboardService;
use axum::{
    extract::{Extension, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use chrono::{DateTime, Datelike, Utc};
use serde::Deserialize;
use sqlx::PgPool;

#[derive(Debug, Deserialize)]
pub struct DateRangeQuery {
    pub start_date: Option<DateTime<Utc>>,
    pub end_date: Option<DateTime<Utc>>,
}

pub async fn dashboard_summary_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Query(query): Query<DateRangeQuery>,
) -> impl IntoResponse {
    let now = Utc::now();
    // Default to start of current month
    let start_date = query.start_date.unwrap_or_else(|| {
        chrono::NaiveDate::from_ymd_opt(now.date_naive().year(), now.date_naive().month(), 1)
            .unwrap()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_utc()
    });
    let end_date = query.end_date.unwrap_or(now);

    match DashboardService::get_summary(&pool, auth.workspace_id, start_date, end_date).await {
        Ok(summary) => (StatusCode::OK, Json(ApiResponse::ok(summary))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn category_spending_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Query(query): Query<DateRangeQuery>,
) -> impl IntoResponse {
    let now = Utc::now();
    let start_date = query.start_date.unwrap_or_else(|| {
        chrono::NaiveDate::from_ymd_opt(now.date_naive().year(), now.date_naive().month(), 1)
            .unwrap()
            .and_hms_opt(0, 0, 0)
            .unwrap()
            .and_utc()
    });
    let end_date = query.end_date.unwrap_or(now);

    match DashboardService::get_category_spending(&pool, auth.workspace_id, start_date, end_date).await {
        Ok(data) => (StatusCode::OK, Json(ApiResponse::ok(data))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}
