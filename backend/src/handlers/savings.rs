use crate::middleware::auth::AuthUser;
use crate::models::common::ApiResponse;
use crate::models::savings::ContributeSavingsRequest;
use crate::services::savings::SavingsService;
use axum::{
    extract::{Extension, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use rust_decimal::Decimal;
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateSavingsGoalRequest {
    pub name: String,
    pub target_amount: Decimal,
    pub wallet_id: Option<Uuid>,
    pub deadline: Option<chrono::NaiveDate>,
}

pub async fn list_savings_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    match SavingsService::get_savings_goals(&pool, auth.workspace_id).await {
        Ok(goals) => (StatusCode::OK, Json(ApiResponse::ok(goals))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn create_savings_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<CreateSavingsGoalRequest>,
) -> impl IntoResponse {
    match SavingsService::create_savings_goal(
        &pool,
        auth.workspace_id,
        &payload.name,
        payload.target_amount,
        payload.wallet_id,
        payload.deadline,
    )
    .await
    {
        Ok(goal) => (
            StatusCode::CREATED,
            Json(ApiResponse::ok_msg(goal, "Target tabungan berhasil dibuat")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn contribute_savings_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<ContributeSavingsRequest>,
) -> impl IntoResponse {
    match SavingsService::contribute(&pool, auth.workspace_id, payload).await {
        Ok(goal) => (
            StatusCode::OK,
            Json(ApiResponse::ok_msg(goal, "Alokasi tabungan berhasil dicatat")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}
