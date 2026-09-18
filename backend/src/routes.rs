use crate::handlers::{api_keys::*, auth::*, budgets::*, dashboard::*, debts::*, savings::*, transactions::*, wallets::*};
use crate::middleware::auth::auth_middleware;
use crate::models::common::ApiResponse;
use axum::{
    middleware::from_fn,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Extension, Json, Router,
};
use sqlx::PgPool;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

pub fn create_router(pool: PgPool, jwt_secret: Arc<String>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Public Routes
    let public_routes = Router::new()
        .route("/health", get(health_handler))
        .route("/auth/login", post(login_handler))
        .route("/auth/logout", post(logout_handler));

    // Protected Routes
    let protected_routes = Router::new()
        .route("/auth/me", get(me_handler))
        // Wallets
        .route("/wallets", get(list_wallets_handler).post(create_wallet_handler))
        .route("/wallets/{id}", put(update_wallet_handler).delete(delete_wallet_handler))
        // Transactions
        .route("/transactions", get(list_transactions_handler).post(create_transaction_handler))
        .route("/transactions/{id}", delete(delete_transaction_handler))
        // Debts & Pinjol
        .route("/debts", get(list_debts_handler))
        .route("/debts/pay", post(pay_debt_handler))
        .route("/pinjol/loans", get(list_loans_handler))
        .route("/pinjol/pay", post(pay_loan_handler))
        // Budgets & Categories
        .route("/categories", get(list_categories_handler))
        .route("/budgets", get(list_budgets_handler).post(set_budget_handler))
        // Savings Goals
        .route("/savings", get(list_savings_handler).post(create_savings_handler))
        .route("/savings/contribute", post(contribute_savings_handler))
        // Dashboard Aggregations
        .route("/dashboard/summary", get(dashboard_summary_handler))
        .route("/dashboard/categories", get(category_spending_handler))
        // API Keys (Third-Party Integration)
        .route("/keys", get(list_keys_handler).post(create_key_handler))
        .route("/keys/{id}", delete(revoke_key_handler))
        .layer(from_fn(auth_middleware));

    Router::new()
        .nest("/api/v1", public_routes.merge(protected_routes))
        .layer(Extension(pool.clone()))
        .layer(Extension(jwt_secret))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(pool)
}

async fn health_handler() -> impl IntoResponse {
    Json(ApiResponse::ok_msg(
        serde_json::json!({
            "status": "healthy",
            "version": "0.1.0",
            "engine": "Axum 0.8 (Rust)",
        }),
        "Fin-backend is running",
    ))
}
