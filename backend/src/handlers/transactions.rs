use crate::middleware::auth::AuthUser;
use crate::models::common::ApiResponse;
use crate::models::transaction::{CreateTransactionRequest, TransactionQueryFilter};
use crate::services::transaction::TransactionService;
use axum::{
    extract::{Extension, Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list_transactions_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Query(filter): Query<TransactionQueryFilter>,
) -> impl IntoResponse {
    match TransactionService::get_transactions(&pool, auth.workspace_id, filter).await {
        Ok(txs) => (StatusCode::OK, Json(ApiResponse::ok(txs))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn create_transaction_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<CreateTransactionRequest>,
) -> impl IntoResponse {
    match TransactionService::create_transaction(&pool, auth.workspace_id, payload).await {
        Ok(tx) => (
            StatusCode::CREATED,
            Json(ApiResponse::ok_msg(tx, "Transaksi berhasil dicatat")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn delete_transaction_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Path(transaction_id): Path<Uuid>,
) -> impl IntoResponse {
    match TransactionService::delete_transaction(&pool, auth.workspace_id, transaction_id).await {
        Ok(true) => (
            StatusCode::OK,
            Json(ApiResponse::ok_msg((), "Transaksi berhasil dihapus")),
        )
            .into_response(),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::err("Transaksi tidak ditemukan")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}
