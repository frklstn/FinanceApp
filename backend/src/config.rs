use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
    pub host: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://financeapp:financeapp@localhost:5432/financeapp".to_string());
        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "fin-app-jwt-secret-key-change-in-prod-2026".to_string());
        let port = env::var("BACKEND_PORT")
            .or_else(|_| env::var("PORT"))
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(3006);
        let host = env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());

        Self {
            database_url,
            jwt_secret,
            port,
            host,
        }
    }
}
