use chrono::{Utc, Duration};

// Simple Claims struct for testing
#[derive(Debug, Clone, PartialEq)]
pub struct SimpleClaims {
    pub sub: String,
    pub username: String,
    pub permissions: Vec<String>,
    pub exp: i64,
    pub iat: i64,
}

impl SimpleClaims {
    pub fn new(user_id: String, username: String, permissions: Vec<String>, expires_in_hours: i64) -> Self {
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

// Simple Auth Config for testing
#[derive(Debug, Clone)]
pub struct SimpleAuthConfig {
    pub require_auth: bool,
    pub require_api_key: bool,
    pub api_keys: Vec<String>,
    pub session_duration_hours: i64,
}

// Simple Auth Service for testing
pub struct SimpleAuthService {
    config: SimpleAuthConfig,
}

impl SimpleAuthService {
    pub fn new(config: SimpleAuthConfig) -> Self {
        Self { config }
    }

    pub fn verify_api_key(&self, api_key: &str) -> bool {
        if !self.config.require_api_key {
            return true;
        }
        
        self.config.api_keys.contains(&api_key.to_string())
    }

    pub fn verify_credentials(&self, username: &str, password: &str) -> bool {
        // Simple hardcoded check for testing
        match username {
            "admin" => password == "admin123",
            "user" => password == "user123",
            _ => false,
        }
    }

    pub fn create_session_token(&self, user_id: String, username: String) -> String {
        let permissions = self.get_user_permissions(&username);
        let claims = SimpleClaims::new(user_id, username, permissions, self.config.session_duration_hours);
        
        // Simple token format for testing
        format!("session_{}_{}_{}", claims.sub, claims.username, claims.exp)
    }

    pub fn verify_session_token(&self, token: &str) -> std::result::Result<SimpleClaims, String> {
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
        
        Ok(SimpleClaims {
            sub: user_id,
            username,
            permissions,
            exp,
            iat: 0,
        })
    }

    fn get_user_permissions(&self, username: &str) -> Vec<String> {
        match username {
            "admin" => vec!["read".to_string(), "write".to_string(), "admin".to_string()],
            _ => vec!["read".to_string(), "write".to_string()],
        }
    }

    pub fn require_permission(&self, claims: &SimpleClaims, required_permission: &str) -> bool {
        claims.permissions.contains(&required_permission.to_string()) || 
        claims.permissions.contains(&"admin".to_string())
    }
}

fn create_test_auth_config() -> SimpleAuthConfig {
    SimpleAuthConfig {
        require_auth: true,
        require_api_key: true,
        api_keys: vec!["test-key-123".to_string(), "valid-api-key".to_string()],
        session_duration_hours: 24,
    }
}

#[test]
fn test_simple_claims_creation() {
    let user_id = "user123".to_string();
    let username = "testuser".to_string();
    let permissions = vec!["read".to_string(), "write".to_string()];
    
    let claims = SimpleClaims::new(user_id.clone(), username.clone(), permissions.clone(), 24);
    
    assert_eq!(claims.sub, user_id);
    assert_eq!(claims.username, username);
    assert_eq!(claims.permissions, permissions);
    
    // Check that expiration is set correctly (within a reasonable range)
    let now = Utc::now().timestamp();
    let expected_exp = now + (24 * 3600);
    assert!(claims.exp > now);
    assert!(claims.exp <= expected_exp + 10); // Allow 10 seconds tolerance
}

#[test]
fn test_simple_auth_service_verify_api_key_valid() {
    let config = create_test_auth_config();
    let auth_service = SimpleAuthService::new(config);
    
    assert!(auth_service.verify_api_key("test-key-123"));
    assert!(auth_service.verify_api_key("valid-api-key"));
}

#[test]
fn test_simple_auth_service_verify_api_key_invalid() {
    let config = create_test_auth_config();
    let auth_service = SimpleAuthService::new(config);
    
    assert!(!auth_service.verify_api_key("invalid-key"));
    assert!(!auth_service.verify_api_key(""));
    assert!(!auth_service.verify_api_key("wrong-key"));
}

#[test]
fn test_simple_auth_service_verify_api_key_disabled() {
    let mut config = create_test_auth_config();
    config.require_api_key = false;
    let auth_service = SimpleAuthService::new(config);
    
    // When API key requirement is disabled, any key should be valid
    assert!(auth_service.verify_api_key("any-key"));
    assert!(auth_service.verify_api_key(""));
    assert!(auth_service.verify_api_key("invalid"));
}

#[test]
fn test_simple_auth_service_verify_credentials() {
    let config = create_test_auth_config();
    let auth_service = SimpleAuthService::new(config);
    
    // Valid credentials
    assert!(auth_service.verify_credentials("admin", "admin123"));
    assert!(auth_service.verify_credentials("user", "user123"));
    
    // Invalid credentials
    assert!(!auth_service.verify_credentials("admin", "wrong"));
    assert!(!auth_service.verify_credentials("user", "wrong"));
    assert!(!auth_service.verify_credentials("unknown", "password"));
    assert!(!auth_service.verify_credentials("", ""));
}

#[test]
fn test_simple_auth_service_create_session_token() {
    let config = create_test_auth_config();
    let auth_service = SimpleAuthService::new(config);
    
    let user_id = "user123".to_string();
    let username = "testuser".to_string();
    
    let token = auth_service.create_session_token(user_id.clone(), username.clone());
    
    assert!(token.starts_with("session_"));
    assert!(token.contains(&user_id));
    assert!(token.contains(&username));
}

#[test]
fn test_simple_auth_service_verify_session_token_valid() {
    let config = create_test_auth_config();
    let auth_service = SimpleAuthService::new(config);
    
    let user_id = "user123".to_string();
    let username = "testuser".to_string();
    
    let token = auth_service.create_session_token(user_id.clone(), username.clone());
    let claims = auth_service.verify_session_token(&token).unwrap();
    
    assert_eq!(claims.sub, user_id);
    assert_eq!(claims.username, username);
    assert!(!claims.permissions.is_empty());
}

#[test]
fn test_simple_auth_service_verify_session_token_invalid_format() {
    let config = create_test_auth_config();
    let auth_service = SimpleAuthService::new(config);
    
    assert!(auth_service.verify_session_token("invalid").is_err());
    assert!(auth_service.verify_session_token("").is_err());
    assert!(auth_service.verify_session_token("session_incomplete").is_err());
}

#[test]
fn test_simple_auth_service_verify_session_token_expired() {
    let config = create_test_auth_config();
    let auth_service = SimpleAuthService::new(config);
    
    // Create a token that expired 1 hour ago
    let expired_timestamp = Utc::now().timestamp() - 3600;
    let expired_token = format!("session_user123_testuser_{}", expired_timestamp);
    
    assert!(auth_service.verify_session_token(&expired_token).is_err());
}

#[test]
fn test_simple_auth_service_user_permissions() {
    let config = create_test_auth_config();
    let auth_service = SimpleAuthService::new(config);
    
    // Test admin permissions
    let admin_claims = SimpleClaims::new(
        "admin".to_string(),
        "admin".to_string(),
        vec!["read".to_string(), "write".to_string(), "admin".to_string()],
        24
    );
    
    assert!(auth_service.require_permission(&admin_claims, "read"));
    assert!(auth_service.require_permission(&admin_claims, "write"));
    assert!(auth_service.require_permission(&admin_claims, "admin"));
    assert!(auth_service.require_permission(&admin_claims, "any_permission")); // Admin can do anything
    
    // Test regular user permissions
    let user_claims = SimpleClaims::new(
        "user".to_string(),
        "user".to_string(),
        vec!["read".to_string(), "write".to_string()],
        24
    );
    
    assert!(auth_service.require_permission(&user_claims, "read"));
    assert!(auth_service.require_permission(&user_claims, "write"));
    assert!(!auth_service.require_permission(&user_claims, "admin"));
    assert!(!auth_service.require_permission(&user_claims, "delete"));
}