use crate::middleware::auth::AuthUser;
use crate::models::common::ApiResponse;
use crate::models::wallet::{CreateWalletRequest, UpdateWalletRequest};
use crate::services::wallet::WalletService;
use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn list_wallets_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    match WalletService::get_wallets(&pool, auth.workspace_id).await {
        Ok(wallets) => (StatusCode::OK, Json(ApiResponse::ok(wallets))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn create_wallet_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<CreateWalletRequest>,
) -> impl IntoResponse {
    match WalletService::create_wallet(&pool, auth.workspace_id, payload).await {
        Ok(wallet) => (
            StatusCode::CREATED,
            Json(ApiResponse::ok_msg(wallet, "Dompet berhasil dibuat")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn update_wallet_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Path(wallet_id): Path<Uuid>,
    Json(payload): Json<UpdateWalletRequest>,
) -> impl IntoResponse {
    match WalletService::update_wallet(&pool, auth.workspace_id, wallet_id, payload).await {
        Ok(Some(wallet)) => (
            StatusCode::OK,
            Json(ApiResponse::ok_msg(wallet, "Dompet berhasil diupdate")),
        )
            .into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::err("Dompet tidak ditemukan")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn delete_wallet_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Path(wallet_id): Path<Uuid>,
) -> impl IntoResponse {
    match WalletService::delete_wallet(&pool, auth.workspace_id, wallet_id).await {
        Ok(true) => (
            StatusCode::OK,
            Json(ApiResponse::ok_msg((), "Dompet berhasil dihapus")),
        )
            .into_response(),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::err("Dompet tidak ditemukan")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}
