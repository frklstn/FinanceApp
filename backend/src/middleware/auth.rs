use crate::models::common::ApiResponse;
use crate::services::auth::AuthService;
use axum::{
    extract::Request,
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::extract::CookieJar;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: Uuid,
    pub workspace_id: Uuid,
    pub email: String,
    pub role: String,
}

pub async fn auth_middleware(
    cookie_jar: CookieJar,
    mut req: Request,
    next: Next,
) -> Result<Response, Response> {
    let jwt_secret = req
        .extensions()
        .get::<Arc<String>>()
        .cloned()
        .unwrap_or_else(|| Arc::new("fin-app-jwt-secret-key-change-in-prod-2026".to_string()));

    // 1. Try Bearer header
    let token = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(|h| {
            if h.starts_with("Bearer ") {
                Some(h[7..].to_string())
            } else {
                None
            }
        })
        // 2. Try Cookie
        .or_else(|| {
            cookie_jar
                .get("auth_token")
                .or_else(|| cookie_jar.get("session_token"))
                .map(|c| c.value().to_string())
        });

    let token = match token {
        Some(t) => t,
        None => {
            let body = Json(ApiResponse::<()>::err("Unauthorized: Missing authentication token"));
            return Err((StatusCode::UNAUTHORIZED, body).into_response());
        }
    };

    let claims = match AuthService::verify_jwt(&token, &jwt_secret) {
        Ok(c) => c,
        Err(_) => {
            let body = Json(ApiResponse::<()>::err("Unauthorized: Invalid or expired token"));
            return Err((StatusCode::UNAUTHORIZED, body).into_response());
        }
    };

    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => {
            let body = Json(ApiResponse::<()>::err("Unauthorized: Invalid user ID"));
            return Err((StatusCode::UNAUTHORIZED, body).into_response());
        }
    };

    let workspace_id = match Uuid::parse_str(&claims.workspace_id) {
        Ok(id) => id,
        Err(_) => {
            let body = Json(ApiResponse::<()>::err("Unauthorized: Invalid workspace ID"));
            return Err((StatusCode::UNAUTHORIZED, body).into_response());
        }
    };

    let auth_user = AuthUser {
        user_id,
        workspace_id,
        email: claims.email,
        role: claims.role,
    };

    req.extensions_mut().insert(auth_user);
    Ok(next.run(req).await)
}
