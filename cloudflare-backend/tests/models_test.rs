use serde_json;

// Simple struct to test basic serialization
#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq)]
pub struct SimpleApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<SimpleApiError>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, PartialEq)]
pub struct SimpleApiError {
    pub code: String,
    pub message: String,
}

impl<T> SimpleApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(code: &str, message: &str) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(SimpleApiError { 
                code: code.to_string(), 
                message: message.to_string() 
            }),
        }
    }
}

#[test]
fn test_simple_api_response_success() {
    let data = "test data";
    let response = SimpleApiResponse::success(data);
    
    assert!(response.success);
    assert_eq!(response.data, Some(data));
    assert!(response.error.is_none());
}

#[test]
fn test_simple_api_response_error() {
    let response: SimpleApiResponse<()> = SimpleApiResponse::error("TEST_ERROR", "Test error message");
    
    assert!(!response.success);
    assert!(response.data.is_none());
    assert!(response.error.is_some());
    
    let error = response.error.unwrap();
    assert_eq!(error.code, "TEST_ERROR");
    assert_eq!(error.message, "Test error message");
}

#[test]
fn test_simple_api_response_serialization() {
    let response = SimpleApiResponse::success("test");
    let json = serde_json::to_string(&response).unwrap();
    
    assert!(json.contains("\"success\":true"));
    assert!(json.contains("\"data\":\"test\""));
    assert!(!json.contains("\"error\""));
}

#[test]
fn test_simple_api_error_serialization() {
    let response: SimpleApiResponse<()> = SimpleApiResponse::error("TEST_CODE", "Test message");
    let json = serde_json::to_string(&response).unwrap();
    
    assert!(json.contains("\"success\":false"));
    assert!(json.contains("\"error\""));
    assert!(json.contains("\"code\":\"TEST_CODE\""));
    assert!(json.contains("\"message\":\"Test message\""));
    assert!(!json.contains("\"data\""));
}