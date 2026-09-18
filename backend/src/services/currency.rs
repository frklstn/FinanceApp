use rust_decimal::Decimal;
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::RwLock;
use std::time::Duration;
use tracing::{error, info};

pub struct CurrencyCache {
    rates: RwLock<HashMap<(String, String), Decimal>>,
}

impl CurrencyCache {
    pub fn new() -> Self {
        Self {
            rates: RwLock::new(HashMap::new()),
        }
    }

    pub fn convert(&self, amount: Decimal, from: &str, to: &str) -> Decimal {
        if from == to || amount == Decimal::ZERO {
            return amount;
        }

        let guard = self.rates.read().unwrap();
        if let Some(rate) = guard.get(&(from.to_string(), to.to_string())) {
            return amount * rate;
        }

        // Check inverse
        if let Some(rate) = guard.get(&(to.to_string(), from.to_string())) {
            if !rate.is_zero() {
                return amount / rate;
            }
        }

        // Fallback 1:1 if rate not found
        amount
    }

    pub async fn refresh(&self, pool: &PgPool) -> Result<usize, sqlx::Error> {
        let rows = sqlx::query!(
            r#"SELECT from_currency, to_currency, rate FROM exchange_rates"#
        )
        .fetch_all(pool)
        .await?;

        let count = rows.len();
        let mut map = HashMap::new();
        for r in rows {
            map.insert((r.from_currency, r.to_currency), r.rate);
        }

        {
            let mut guard = self.rates.write().unwrap();
            *guard = map;
        }

        info!("CurrencyCache refreshed with {} exchange rates", count);
        Ok(count)
    }

    pub fn start_background_sync(self: std::sync::Arc<Self>, pool: PgPool) {
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(3600));
            loop {
                interval.tick().await;
                if let Err(e) = self.refresh(&pool).await {
                    error!("CurrencyCache background sync failed: {:?}", e);
                }
            }
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal_macros::dec;

    #[test]
    fn test_currency_conversion() {
        let cache = CurrencyCache::new();
        {
            let mut guard = cache.rates.write().unwrap();
            guard.insert(("USD".to_string(), "IDR".to_string()), dec!(16000));
        }

        // Same currency
        assert_eq!(cache.convert(dec!(100), "IDR", "IDR"), dec!(100));

        // Direct rate
        assert_eq!(cache.convert(dec!(10), "USD", "IDR"), dec!(160000));

        // Inverse rate
        assert_eq!(cache.convert(dec!(32000), "IDR", "USD"), dec!(2));
    }
}
