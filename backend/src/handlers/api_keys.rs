use crate::middleware::auth::AuthUser;
use crate::models::api_key::CreateApiKeyRequest;
use crate::models::common::ApiResponse;
use crate::services::api_key::ApiKeyService;
use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sqlx::PgPool;
use uuid::Uuid;

pub async fn create_key_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Json(payload): Json<CreateApiKeyRequest>,
) -> impl IntoResponse {
    match ApiKeyService::create_key(&pool, auth.workspace_id, auth.user_id, payload.name).await {
        Ok(key_data) => (
            StatusCode::CREATED,
            Json(ApiResponse::ok_msg(key_data, "API Key berhasil dibuat. Simpan sekarang karena tidak akan ditampilkan lagi.")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn list_keys_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    match ApiKeyService::list_keys(&pool, auth.workspace_id).await {
        Ok(keys) => (StatusCode::OK, Json(ApiResponse::ok(keys))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn revoke_key_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
    Path(key_id): Path<Uuid>,
) -> impl IntoResponse {
    match ApiKeyService::revoke_key(&pool, auth.workspace_id, key_id).await {
        Ok(true) => (
            StatusCode::OK,
            Json(ApiResponse::ok_msg((), "API Key berhasil dicabut")),
        )
            .into_response(),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::err("API Key tidak ditemukan")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}
