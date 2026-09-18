use crate::models::auth::{Claims, Profile, User};
use jsonwebtoken::{encode, DecodingKey, EncodingKey, Header, Validation};
use sqlx::PgPool;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

pub struct AuthService;

impl AuthService {
    pub async fn authenticate(
        pool: &PgPool,
        identifier: &str,
        password: &str,
    ) -> Result<Option<(User, Profile)>, sqlx::Error> {
        // Support login by email OR username (case-insensitive)
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, username, password_hash, email_verified, created_at, updated_at
            FROM users
            WHERE lower(email) = lower($1) OR lower(username) = lower($1)
            LIMIT 1
            "#,
        )
        .bind(identifier)
        .fetch_optional(pool)
        .await?;

        let user = match user {
            Some(u) => u,
            None => return Ok(None),
        };

        // Verify bcrypt hash (matches existing PostgreSQL hashes)
        let is_valid = bcrypt::verify(password, &user.password_hash).unwrap_or(false);
        if !is_valid {
            return Ok(None);
        }

        // Fetch corresponding profile
        let profile = sqlx::query_as::<_, Profile>(
            r#"
            SELECT id, email, full_name, avatar_url, currency, language, timezone, 
                   is_suspended, workspace_id, plan, plan_expires_at, whatsapp_contact,
                   created_at, updated_at
            FROM profiles
            WHERE id = $1
            LIMIT 1
            "#,
        )
        .bind(user.id)
        .fetch_optional(pool)
        .await?;

        match profile {
            Some(p) => Ok(Some((user, p))),
            None => Ok(None),
        }
    }

    pub fn generate_jwt(
        user_id: Uuid,
        workspace_id: Uuid,
        email: &str,
        role: &str,
        secret: &str,
    ) -> Result<String, jsonwebtoken::errors::Error> {
        let expiration = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as usize
            + 60 * 60 * 24 * 30; // 30 days expiration

        let claims = Claims {
            sub: user_id.to_string(),
            workspace_id: Some(workspace_id.to_string()),
            email: Some(email.to_string()),
            role: Some(role.to_string()),
            exp: expiration,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes()),
        )
    }

    pub fn verify_jwt(token: &str, secret: &str) -> Result<Claims, jsonwebtoken::errors::Error> {
        let token_data = jsonwebtoken::decode::<Claims>(
            token,
            &DecodingKey::from_secret(secret.as_bytes()),
            &Validation::default(),
        )?;
        Ok(token_data.claims)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jwt_generation_and_verification() {
        let user_id = Uuid::new_v4();
        let workspace_id = Uuid::new_v4();
        let email = "test@llvy.space";
        let role = "pro";
        let secret = "my-super-secret-key-1234567890";

        let token = AuthService::generate_jwt(user_id, workspace_id, email, role, secret).unwrap();
        assert!(!token.is_empty());

        let claims = AuthService::verify_jwt(&token, secret).unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.workspace_id, Some(workspace_id.to_string()));
        assert_eq!(claims.email, Some(email.to_string()));
        assert_eq!(claims.role, Some(role.to_string()));
    }

    #[test]
    fn test_bcrypt_verification() {
        let password = "RahasiaPassword123!";
        let hash = bcrypt::hash(password, 4).unwrap();
        assert!(bcrypt::verify(password, &hash).unwrap());
        assert!(!bcrypt::verify("WrongPassword", &hash).unwrap());
    }
}
