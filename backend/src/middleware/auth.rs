use crate::models::common::ApiResponse;
use crate::services::api_key::ApiKeyService;
use crate::services::auth::AuthService;
use axum::{
    extract::Request,
    http::{header, HeaderName, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use axum_extra::extract::CookieJar;
use sqlx::PgPool;
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
    let pool = req.extensions().get::<PgPool>().cloned();

    // 1. Check for X-API-Key header (Third-Party Apps & Automation)
    let api_key_header = HeaderName::from_static("x-api-key");
    let api_key = req
        .headers()
        .get(&api_key_header)
        .and_then(|h| h.to_str().ok())
        .map(|s| s.trim().to_string());

    if let Some(key) = api_key {
        if let Some(ref db_pool) = pool {
            match ApiKeyService::validate_key(db_pool, &key).await {
                Ok(Some((user_id, workspace_id))) => {
                    let auth_user = AuthUser {
                        user_id,
                        workspace_id,
                        email: "api-key@thirdparty.app".to_string(),
                        role: "api_key".to_string(),
                    };
                    req.extensions_mut().insert(auth_user);
                    return Ok(next.run(req).await);
                }
                _ => {
                    let body = Json(ApiResponse::<()>::err("Unauthorized: Invalid or revoked API Key"));
                    return Err((StatusCode::UNAUTHORIZED, body).into_response());
                }
            }
        }
    }

    let jwt_secret = req
        .extensions()
        .get::<Arc<String>>()
        .cloned()
        .unwrap_or_else(|| Arc::new("fin-app-jwt-secret-key-change-in-prod-2026".to_string()));

    // 2. Try Bearer header
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
        // 3. Try Cookie
        .or_else(|| {
            cookie_jar
                .get("auth_token")
                .or_else(|| cookie_jar.get("session_token"))
                .map(|c| c.value().to_string())
        });

    let token = match token {
        Some(t) => t,
        None => {
            let body = Json(ApiResponse::<()>::err("Unauthorized: Missing authentication token or API Key"));
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
            let body = Json(ApiResponse::<()>::err("Unauthorized: Invalid user ID in token"));
            return Err((StatusCode::UNAUTHORIZED, body).into_response());
        }
    };

    let (workspace_id, email, role) = match (claims.workspace_id, claims.email, claims.role) {
        (Some(ws_str), Some(em), Some(ro)) => match Uuid::parse_str(&ws_str) {
            Ok(ws) => (ws, em, ro),
            Err(_) => (user_id, em, ro),
        },
        (ws_opt, em_opt, ro_opt) => {
            // Dynamically resolve missing claims from database profile
            if let Some(ref db_pool) = pool {
                let p = sqlx::query!(
                    "SELECT workspace_id, email, plan FROM profiles WHERE id = $1 LIMIT 1",
                    user_id
                )
                .fetch_optional(db_pool)
                .await
                .ok()
                .flatten();

                if let Some(profile) = p {
                    let ws = profile.workspace_id.unwrap_or(user_id);
                    let em = em_opt.unwrap_or(profile.email);
                    let ro = ro_opt.unwrap_or(profile.plan);
                    (ws, em, ro)
                } else {
                    let ws = ws_opt.and_then(|s| Uuid::parse_str(&s).ok()).unwrap_or(user_id);
                    let em = em_opt.unwrap_or_else(|| "user@llvy.space".to_string());
                    let ro = ro_opt.unwrap_or_else(|| "pro".to_string());
                    (ws, em, ro)
                }
            } else {
                let ws = ws_opt.and_then(|s| Uuid::parse_str(&s).ok()).unwrap_or(user_id);
                let em = em_opt.unwrap_or_else(|| "user@llvy.space".to_string());
                let ro = ro_opt.unwrap_or_else(|| "pro".to_string());
                (ws, em, ro)
            }
        }
    };

    let auth_user = AuthUser {
        user_id,
        workspace_id,
        email,
        role,
    };

    req.extensions_mut().insert(auth_user);
    Ok(next.run(req).await)
}
