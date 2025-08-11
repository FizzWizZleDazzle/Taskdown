use crate::config::AuthConfig;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use worker::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub username: String,
    pub permissions: Vec<String>,
    pub exp: i64,
    pub iat: i64,
}

impl Claims {
    pub fn new(
        user_id: String,
        username: String,
        permissions: Vec<String>,
        expires_in_hours: i64,
    ) -> Self {
        let now = Utc::now();
        Self {
            sub: user_id,
            username,
            permissions,
            exp: (now + Duration::hours(expires_in_hours)).timestamp(),
            iat: now.timestamp(),
        }
    }
}

pub struct AuthService {
    config: AuthConfig,
}

impl AuthService {
    pub fn new(config: AuthConfig) -> Self {
        Self { config }
    }

    pub async fn from_request(req: &Request, _env: &Env) -> std::result::Result<Claims, String> {
        let auth_config = crate::config::get_auth_config();
        let auth_service = AuthService::new(auth_config);

        if let Some(token) = auth_service.extract_auth_header(req) {
            auth_service.verify_session_token(&token)
        } else {
            Err("No authorization header found".to_string())
        }
    }

    pub fn verify_api_key(&self, api_key: &str) -> bool {
        if !self.config.require_api_key {
            return true;
        }

        self.config.api_keys.contains(&api_key.to_string())
    }

    pub fn verify_credentials(&self, username: &str, password: &str) -> bool {
        // In a real implementation, this would verify against a database
        // For now, we use a simple hardcoded check
        match username {
            "admin" => password == "admin123",
            "user" => password == "user123",
            _ => false,
        }
    }

    pub fn create_session_token(&self, user_id: String, username: String) -> String {
        let permissions = self.get_user_permissions(&username);
        let claims = Claims::new(
            user_id,
            username,
            permissions,
            self.config.session_duration_hours,
        );

        // In a real implementation, you would use a proper JWT library
        // For this example, we create a simple encoded token
        format!("session_{}_{}_{}", claims.sub, claims.username, claims.exp)
    }

    pub fn verify_session_token(&self, token: &str) -> std::result::Result<Claims, String> {
        // In a real implementation, you would decode and verify a JWT
        // For this example, we parse our simple token format
        if !token.starts_with("session_") {
            return Err("Invalid token format".to_string());
        }

        let parts: Vec<&str> = token.split('_').collect();
        if parts.len() != 4 {
            return Err("Invalid token structure".to_string());
        }

        let user_id = parts[1].to_string();
        let username = parts[2].to_string();
        let exp: i64 = parts[3].parse().map_err(|_| "Invalid expiration")?;

        // Check if token is expired
        if Utc::now().timestamp() > exp {
            return Err("Token expired".to_string());
        }

        let permissions = self.get_user_permissions(&username);

        Ok(Claims {
            sub: user_id,
            username,
            permissions,
            exp,
            iat: 0, // We don't store issued at in our simple format
        })
    }

    fn get_user_permissions(&self, username: &str) -> Vec<String> {
        // In a real implementation, this would come from a database
        match username {
            "admin" => vec!["read".to_string(), "write".to_string(), "admin".to_string()],
            _ => vec!["read".to_string(), "write".to_string()],
        }
    }

    pub fn extract_auth_header(&self, req: &Request) -> Option<String> {
        req.headers()
            .get("authorization")
            .ok()
            .flatten()
            .and_then(|auth| auth.strip_prefix("Bearer ").map(|token| token.to_string()))
    }

    pub fn require_permission(&self, claims: &Claims, required_permission: &str) -> bool {
        claims
            .permissions
            .contains(&required_permission.to_string())
            || claims.permissions.contains(&"admin".to_string())
    }
}
