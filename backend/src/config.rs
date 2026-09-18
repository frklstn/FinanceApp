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
            .expect("DATABASE_URL environment variable must be set");
        let jwt_secret = env::var("JWT_SECRET")
            .or_else(|_| env::var("SESSION_SECRET"))
            .expect("JWT_SECRET or SESSION_SECRET must be set");
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
