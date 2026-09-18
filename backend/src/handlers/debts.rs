use crate::middleware::auth::AuthUser;
use crate::models::common::ApiResponse;
use crate::models::debt::{PayDebtRequest, PayLoanRequest};
use crate::services::debt::DebtService;
use axum::{
    extract::{Extension, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;

pub async fn list_debts_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    match DebtService::get_debts(&pool, auth.workspace_id).await {
        Ok(debts) => (StatusCode::OK, Json(ApiResponse::ok(debts))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn list_loans_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    match DebtService::get_loans(&pool, auth.workspace_id).await {
        Ok(loans) => (StatusCode::OK, Json(ApiResponse::ok(loans))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn pay_debt_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<PayDebtRequest>,
) -> impl IntoResponse {
    match DebtService::pay_debt(&pool, auth.workspace_id, payload).await {
        Ok(debt) => (
            StatusCode::OK,
            Json(ApiResponse::ok_msg(debt, "Pembayaran utang berhasil dicatat")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn pay_loan_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<PayLoanRequest>,
) -> impl IntoResponse {
    match DebtService::pay_loan(&pool, auth.workspace_id, payload).await {
        Ok(loan) => (
            StatusCode::OK,
            Json(ApiResponse::ok_msg(loan, "Pembayaran cicilan/pinjol berhasil")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}
