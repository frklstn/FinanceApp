use crate::middleware::auth::AuthUser;
use crate::models::auth::{AuthResponse, GoogleLoginRequest, LoginRequest};
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

pub async fn google_auth_handler(
    State(pool): State<PgPool>,
    Extension(jwt_secret): Extension<Arc<String>>,
    jar: CookieJar,
    Json(payload): Json<GoogleLoginRequest>,
) -> impl IntoResponse {
    let email = payload.email.trim().to_lowercase();
    if email.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            jar,
            Json(ApiResponse::<()>::err("Email is required")),
        )
            .into_response();
    }

    let existing_user = sqlx::query_as::<_, crate::models::auth::User>(
        "SELECT id, email, username, password_hash, email_verified, created_at, updated_at FROM users WHERE lower(email) = lower($1) LIMIT 1",
    )
    .bind(&email)
    .fetch_optional(&pool)
    .await;

    let user_id = match existing_user {
        Ok(Some(u)) => u.id,
        Ok(None) => {
            let placeholder_hash = bcrypt::hash(uuid::Uuid::new_v4().to_string(), 4).unwrap_or_default();
            let new_user = sqlx::query_as::<_, crate::models::auth::User>(
                "INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, true) RETURNING id, email, username, password_hash, email_verified, created_at, updated_at",
            )
            .bind(&email)
            .bind(placeholder_hash)
            .fetch_one(&pool)
            .await;

            let u = match new_user {
                Ok(u) => u,
                Err(e) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        jar,
                        Json(ApiResponse::<()>::err(&format!("Failed to create user: {:?}", e))),
                    )
                        .into_response();
                }
            };

            let ws_name = format!("Workspace {}", payload.name.as_deref().unwrap_or(&email));
            let ws_res = sqlx::query!(
                "INSERT INTO workspaces (name, owner_id) VALUES ($1, $2) RETURNING id",
                ws_name,
                u.id
            )
            .fetch_one(&pool)
            .await;

            let ws_id = match ws_res {
                Ok(w) => w.id,
                Err(e) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        jar,
                        Json(ApiResponse::<()>::err(&format!("Failed to create workspace: {:?}", e))),
                    )
                        .into_response();
                }
            };

            let _ = sqlx::query!(
                "INSERT INTO profiles (id, email, full_name, avatar_url, workspace_id, plan) VALUES ($1, $2, $3, $4, $5, 'pro')",
                u.id,
                &email,
                payload.name.as_deref(),
                payload.avatar_url.as_deref(),
                ws_id
            )
            .execute(&pool)
            .await;

            let _ = sqlx::query!(
                "INSERT INTO workspace_members (workspace_id, profile_id, role) VALUES ($1, $2, 'owner')",
                ws_id,
                u.id
            )
            .execute(&pool)
            .await;

            u.id
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                jar,
                Json(ApiResponse::<()>::err(&format!("Database error: {:?}", e))),
            )
                .into_response();
        }
    };

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
    .bind(user_id)
    .fetch_one(&pool)
    .await;

    let profile = match profile {
        Ok(p) => p,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                jar,
                Json(ApiResponse::<()>::err(&format!("Profile error: {:?}", e))),
            )
                .into_response();
        }
    };

    let workspace_id = match profile.workspace_id {
        Some(ws) => ws,
        None => user_id,
    };

    let token = match AuthService::generate_jwt(
        user_id,
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
        Json(ApiResponse::ok_msg(resp_data, "Google login successful")),
    )
        .into_response()
}
