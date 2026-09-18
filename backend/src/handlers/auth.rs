use crate::middleware::auth::AuthUser;
use crate::models::auth::{AuthResponse, LoginRequest};
use crate::models::common::ApiResponse;
use crate::services::auth::AuthService;
use axum::{
    extract::{Extension, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use axum_extra::extract::cookie::{Cookie, SameSite};
use axum_extra::extract::CookieJar;
use sqlx::PgPool;
use std::sync::Arc;

pub async fn login_handler(
    State(pool): State<PgPool>,
    Extension(jwt_secret): Extension<Arc<String>>,
    jar: CookieJar,
    Json(payload): Json<LoginRequest>,
) -> impl IntoResponse {
    let auth_result = AuthService::authenticate(&pool, &payload.identifier, &payload.password).await;

    match auth_result {
        Ok(Some((user, profile))) => {
            let workspace_id = match profile.workspace_id {
                Some(ws) => ws,
                None => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        jar,
                        Json(ApiResponse::<()>::err("User profile has no active workspace")),
                    )
                        .into_response();
                }
            };

            let token = match AuthService::generate_jwt(
                user.id,
                workspace_id,
                &profile.email,
                &profile.plan,
                &jwt_secret,
            ) {
                Ok(t) => t,
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        jar,
                        Json(ApiResponse::<()>::err("Failed to generate JWT token")),
                    )
                        .into_response();
                }
            };

            // Set secure cookie for Web client
            let mut cookie = Cookie::new("auth_token", token.clone());
            cookie.set_path("/");
            cookie.set_http_only(true);
            cookie.set_same_site(SameSite::Lax);
            cookie.set_max_age(time::Duration::days(30));
            let jar = jar.add(cookie);

            let resp_data = AuthResponse {
                token,
                user: profile,
                workspace_id,
            };

            (
                StatusCode::OK,
                jar,
                Json(ApiResponse::ok_msg(resp_data, "Login successful")),
            )
                .into_response()
        }
        Ok(None) => (
            StatusCode::UNAUTHORIZED,
            jar,
            Json(ApiResponse::<()>::err("Email/username atau password salah")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            jar,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn me_handler(
    State(pool): State<PgPool>,
    Extension(auth): Extension<AuthUser>,
) -> impl IntoResponse {
    let profile = sqlx::query_as::<_, crate::models::auth::Profile>(
        r#"
        SELECT id, email, full_name, avatar_url, currency, language, timezone, 
               is_suspended, workspace_id, plan, plan_expires_at, whatsapp_contact,
               created_at, updated_at
        FROM profiles
        WHERE id = $1
        LIMIT 1
        "#,
    )
    .bind(auth.user_id)
    .fetch_optional(&pool)
    .await;

    match profile {
        Ok(Some(p)) => (StatusCode::OK, Json(ApiResponse::ok(p))).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<()>::err("Profile not found")),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
        )
            .into_response(),
    }
}

pub async fn logout_handler(jar: CookieJar) -> impl IntoResponse {
    let mut cookie = Cookie::new("auth_token", "");
    cookie.set_path("/");
    cookie.set_max_age(time::Duration::seconds(0));
    let jar = jar.add(cookie);

    (
        StatusCode::OK,
        jar,
        Json(ApiResponse::ok_msg((), "Logged out successfully")),
    )
}
