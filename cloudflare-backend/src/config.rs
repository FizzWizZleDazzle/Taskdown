use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct CorsOrigins {
    pub development: Vec<String>,
    pub staging: Vec<String>,
    pub production: Vec<String>,
}

impl CorsOrigins {
    pub fn get_origins_for_env(&self, env: &str) -> Vec<String> {
        match env {
            "production" => self.production.clone(),
            "staging" => self.staging.clone(),
            _ => self.development.clone(),
        }
    }
}

pub fn load_cors_origins() -> CorsOrigins {
    // In a real implementation, this would load from a file
    // For Cloudflare Workers, we embed the configuration
    let origins_json = include_str!("../config/cors-origins.json");

    serde_json::from_str(origins_json).unwrap_or_else(|_| CorsOrigins {
        development: vec![
            "http://localhost:3000".to_string(),
            "http://localhost:8080".to_string(),
        ],
        staging: vec!["https://taskdown-staging.example.com".to_string()],
        production: vec!["https://taskdown.example.com".to_string()],
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthConfig {
    pub jwt_secret: String,
    pub session_duration_hours: i64,
    pub require_api_key: bool,
    pub api_keys: Vec<String>,
}

impl Default for AuthConfig {
    fn default() -> Self {
        Self {
            // SECURITY WARNING: This is a placeholder secret.
            // In production, use a cryptographically secure random secret:
            // - Generate using a secure random number generator
            // - Store in environment variables or secure secret management
            // - Must be at least 256 bits (32 bytes) for HS256
            jwt_secret: "INSECURE_PLACEHOLDER_SECRET_REPLACE_IN_PRODUCTION".to_string(),
            session_duration_hours: 24,
            require_api_key: false,
            api_keys: vec![],
        }
    }
}

pub fn get_auth_config() -> AuthConfig {
    // SECURITY NOTE: In production, configuration should come from:
    // - Environment variables (e.g., JWT_SECRET)
    // - Cloudflare Workers secrets
    // - Secure configuration storage
    // Never hardcode secrets in source code
    AuthConfig::default()
}
