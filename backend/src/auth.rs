use anyhow::Result;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::models::{AuthConfig, AuthVerificationResult};

// JWT Claims structure
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,          // Subject (user ID)
    pub username: String,     // Username
    pub permissions: Vec<String>, // User permissions
    pub exp: i64,            // Expiration time
    pub iat: i64,            // Issued at
}

impl Claims {
    pub fn new(user_id: String, username: String, permissions: Vec<String>, expires_in_hours: i64) -> Self {
        let now = Utc::now();
        Self {
            sub: user_id,
            username,
            permissions,
            iat: now.timestamp(),
            exp: (now + Duration::hours(expires_in_hours)).timestamp(),
        }
    }
}

pub struct AuthService {
    jwt_secret: String,
}

impl AuthService {
    pub fn new() -> Self {
        let jwt_secret = std::env::var("JWT_SECRET")
            .unwrap_or_else(|_| "default-jwt-secret-change-in-production".to_string());
        
        Self { jwt_secret }
    }

    pub fn create_token(&self, claims: &Claims) -> Result<String> {
        let encoding_key = EncodingKey::from_secret(self.jwt_secret.as_ref());
        encode(&Header::default(), claims, &encoding_key)
            .map_err(|e| anyhow::anyhow!("Failed to create JWT token: {}", e))
    }

    pub fn verify_token(&self, token: &str) -> Result<Claims> {
        let decoding_key = DecodingKey::from_secret(self.jwt_secret.as_ref());
        let validation = Validation::default();
        
        decode::<Claims>(token, &decoding_key, &validation)
            .map(|data| data.claims)
            .map_err(|e| anyhow::anyhow!("Failed to verify JWT token: {}", e))
    }

    pub async fn authenticate_request(&self, auth_config: &AuthConfig) -> Result<AuthVerificationResult> {
        match auth_config.r#type.as_str() {
            "api-key" | "bearer" => {
                if let Some(token) = &auth_config.token {
                    self.verify_api_key(token).await
                } else {
                    Err(anyhow::anyhow!("Token is required for API key authentication"))
                }
            }
            "basic" => {
                if let (Some(username), Some(password)) = (&auth_config.username, &auth_config.password) {
                    self.verify_basic_auth(username, password).await
                } else {
                    Err(anyhow::anyhow!("Username and password are required for basic authentication"))
                }
            }
            "custom" => {
                if let Some(headers) = &auth_config.custom_headers {
                    self.verify_custom_auth(headers).await
                } else {
                    Err(anyhow::anyhow!("Custom headers are required for custom authentication"))
                }
            }
            _ => Err(anyhow::anyhow!("Unsupported authentication type: {}", auth_config.r#type))
        }
    }

    async fn verify_api_key(&self, token: &str) -> Result<AuthVerificationResult> {
        // For development, we'll accept a simple API key
        // In production, this should validate against a database of API keys
        const VALID_API_KEY: &str = "taskdown-api-key-12345";
        
        if token == VALID_API_KEY {
            let claims = Claims::new(
                "api-user".to_string(),
                "api-user".to_string(),
                vec!["read".to_string(), "write".to_string()],
                24 // 24 hours
            );
            
            let session_token = self.create_token(&claims)?;
            
            Ok(AuthVerificationResult {
                authenticated: true,
                session_token: Some(session_token),
                expires_at: Some(Utc::now() + Duration::hours(24)),
                permissions: claims.permissions,
            })
        } else {
            Err(anyhow::anyhow!("Invalid API key"))
        }
    }

    async fn verify_basic_auth(&self, username: &str, password: &str) -> Result<AuthVerificationResult> {
        // For development, we'll accept demo credentials
        // In production, this should verify against a user database with hashed passwords
        const DEMO_USERNAME: &str = "admin";
        const DEMO_PASSWORD: &str = "admin";
        
        if username == DEMO_USERNAME && password == DEMO_PASSWORD {
            let claims = Claims::new(
                "admin-user".to_string(),
                username.to_string(),
                vec!["read".to_string(), "write".to_string(), "admin".to_string()],
                24 // 24 hours
            );
            
            let session_token = self.create_token(&claims)?;
            
            Ok(AuthVerificationResult {
                authenticated: true,
                session_token: Some(session_token),
                expires_at: Some(Utc::now() + Duration::hours(24)),
                permissions: claims.permissions,
            })
        } else {
            Err(anyhow::anyhow!("Invalid username or password"))
        }
    }

    async fn verify_custom_auth(&self, headers: &HashMap<String, String>) -> Result<AuthVerificationResult> {
        // Custom authentication example: check for specific headers
        if let Some(auth_token) = headers.get("X-Auth-Token") {
            const VALID_CUSTOM_TOKEN: &str = "custom-token-abc123";
            
            if auth_token == VALID_CUSTOM_TOKEN {
                let claims = Claims::new(
                    "custom-user".to_string(),
                    "custom-user".to_string(),
                    vec!["read".to_string(), "write".to_string()],
                    24 // 24 hours
                );
                
                let session_token = self.create_token(&claims)?;
                
                Ok(AuthVerificationResult {
                    authenticated: true,
                    session_token: Some(session_token),
                    expires_at: Some(Utc::now() + Duration::hours(24)),
                    permissions: claims.permissions,
                })
            } else {
                Err(anyhow::anyhow!("Invalid custom auth token"))
            }
        } else {
            Err(anyhow::anyhow!("Missing X-Auth-Token header for custom authentication"))
        }
    }
}

// Middleware for checking authentication
pub fn extract_auth_claims(authorization_header: Option<&str>) -> Result<Option<Claims>> {
    if let Some(auth_header) = authorization_header {
        if auth_header.starts_with("Bearer ") {
            let token = &auth_header[7..]; // Remove "Bearer " prefix
            let auth_service = AuthService::new();
            match auth_service.verify_token(token) {
                Ok(claims) => Ok(Some(claims)),
                Err(_) => Ok(None), // Invalid token, but don't error out
            }
        } else {
            Ok(None)
        }
    } else {
        Ok(None)
    }
}

pub fn hash_password(password: &str) -> Result<String> {
    bcrypt::hash(password, bcrypt::DEFAULT_COST)
        .map_err(|e| anyhow::anyhow!("Failed to hash password: {}", e))
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool> {
    bcrypt::verify(password, hash)
        .map_err(|e| anyhow::anyhow!("Failed to verify password: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn test_claims_creation() {
        let claims = Claims::new(
            "test-user".to_string(),
            "testuser".to_string(),
            vec!["read".to_string(), "write".to_string()],
            24
        );

        assert_eq!(claims.sub, "test-user");
        assert_eq!(claims.username, "testuser");
        assert_eq!(claims.permissions, vec!["read", "write"]);
        assert!(claims.exp > claims.iat);
    }

    #[test]
    fn test_jwt_token_creation_and_verification() {
        let auth_service = AuthService::new();
        let claims = Claims::new(
            "test-user".to_string(),
            "testuser".to_string(),
            vec!["read".to_string()],
            1
        );

        // Test token creation
        let token = auth_service.create_token(&claims).unwrap();
        assert!(!token.is_empty());

        // Test token verification
        let verified_claims = auth_service.verify_token(&token).unwrap();
        assert_eq!(verified_claims.sub, claims.sub);
        assert_eq!(verified_claims.username, claims.username);
        assert_eq!(verified_claims.permissions, claims.permissions);
    }

    #[test]
    fn test_jwt_token_verification_invalid_token() {
        let auth_service = AuthService::new();
        let result = auth_service.verify_token("invalid-token");
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_api_key_authentication_valid() {
        let auth_service = AuthService::new();
        let auth_config = AuthConfig {
            r#type: "api-key".to_string(),
            token: Some("taskdown-api-key-12345".to_string()),
            username: None,
            password: None,
            custom_headers: None,
        };

        let result = auth_service.authenticate_request(&auth_config).await.unwrap();
        assert!(result.authenticated);
        assert!(result.session_token.is_some());
        assert!(result.expires_at.is_some());
        assert_eq!(result.permissions, vec!["read", "write"]);
    }

    #[tokio::test]
    async fn test_api_key_authentication_invalid() {
        let auth_service = AuthService::new();
        let auth_config = AuthConfig {
            r#type: "api-key".to_string(),
            token: Some("invalid-key".to_string()),
            username: None,
            password: None,
            custom_headers: None,
        };

        let result = auth_service.authenticate_request(&auth_config).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_basic_authentication_valid() {
        let auth_service = AuthService::new();
        let auth_config = AuthConfig {
            r#type: "basic".to_string(),
            token: None,
            username: Some("admin".to_string()),
            password: Some("admin".to_string()),
            custom_headers: None,
        };

        let result = auth_service.authenticate_request(&auth_config).await.unwrap();
        assert!(result.authenticated);
        assert!(result.session_token.is_some());
        assert_eq!(result.permissions, vec!["read", "write", "admin"]);
    }

    #[tokio::test]
    async fn test_basic_authentication_invalid() {
        let auth_service = AuthService::new();
        let auth_config = AuthConfig {
            r#type: "basic".to_string(),
            token: None,
            username: Some("wrong".to_string()),
            password: Some("wrong".to_string()),
            custom_headers: None,
        };

        let result = auth_service.authenticate_request(&auth_config).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_custom_authentication_valid() {
        let auth_service = AuthService::new();
        let mut headers = HashMap::new();
        headers.insert("X-Auth-Token".to_string(), "custom-token-abc123".to_string());
        
        let auth_config = AuthConfig {
            r#type: "custom".to_string(),
            token: None,
            username: None,
            password: None,
            custom_headers: Some(headers),
        };

        let result = auth_service.authenticate_request(&auth_config).await.unwrap();
        assert!(result.authenticated);
        assert!(result.session_token.is_some());
        assert_eq!(result.permissions, vec!["read", "write"]);
    }

    #[test]
    fn test_extract_auth_claims_valid_bearer() {
        let auth_service = AuthService::new();
        let claims = Claims::new(
            "test-user".to_string(),
            "testuser".to_string(),
            vec!["read".to_string()],
            1
        );
        let token = auth_service.create_token(&claims).unwrap();
        let auth_header = format!("Bearer {}", token);

        let result = extract_auth_claims(Some(&auth_header)).unwrap();
        assert!(result.is_some());
        let extracted_claims = result.unwrap();
        assert_eq!(extracted_claims.sub, "test-user");
        assert_eq!(extracted_claims.username, "testuser");
    }

    #[test]
    fn test_extract_auth_claims_invalid_bearer() {
        let result = extract_auth_claims(Some("Bearer invalid-token")).unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_extract_auth_claims_no_bearer_prefix() {
        let result = extract_auth_claims(Some("invalid-format")).unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_extract_auth_claims_no_header() {
        let result = extract_auth_claims(None).unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn test_password_hashing_and_verification() {
        let password = "test-password";
        let hash = hash_password(password).unwrap();
        
        assert_ne!(hash, password); // Hash should be different from password
        assert!(verify_password(password, &hash).unwrap()); // Should verify correctly
        assert!(!verify_password("wrong-password", &hash).unwrap()); // Should fail with wrong password
    }
}