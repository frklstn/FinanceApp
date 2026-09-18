use std::net::SocketAddr;
use std::sync::Arc;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod config;
mod db;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "fin_backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 2. Load configuration
    let cfg = config::Config::from_env();
    info!("Starting Fin-Backend on {}:{}", cfg.host, cfg.port);

    // 3. Connect PostgreSQL Connection Pool
    let pool = db::init_pool(&cfg.database_url).await?;
    info!("Connected to PostgreSQL database pool (max 10 connections)");

    // 4. Initialize in-memory Currency Cache & Background Sync
    let currency_cache = Arc::new(services::currency::CurrencyCache::new());
    if let Err(e) = currency_cache.refresh(&pool).await {
        tracing::warn!("Initial exchange rate load warning: {:?}", e);
    }
    currency_cache.clone().start_background_sync(pool.clone());

    // 5. Build Axum Router
    let jwt_secret = Arc::new(cfg.jwt_secret);
    let app = routes::create_router(pool, jwt_secret);

    // 6. Bind Socket & Serve
    let addr = SocketAddr::from(([0, 0, 0, 0], cfg.port));
    info!("Fin-Backend REST API listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
