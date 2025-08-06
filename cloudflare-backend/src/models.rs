use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

// API Response wrapper
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ApiError>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    pub code: String,
    pub message: String,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(code: String, message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(ApiError { code, message }),
        }
    }
}

// Task types
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum TaskType {
    Epic,
    Story,
    Task,
    Bug,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum Priority {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum TaskStatus {
    Todo,
    #[serde(rename = "In Progress")]
    InProgress,
    #[serde(rename = "In Review")]
    InReview,
    Done,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChecklistItem {
    pub id: Option<String>,
    pub text: String,
    pub completed: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String,
    pub title: String,
    #[serde(rename = "type")]
    pub r#type: TaskType,
    pub priority: Priority,
    pub status: TaskStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub story_points: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sprint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub epic: Option<String>,
    pub description: String,
    pub acceptance_criteria: Vec<ChecklistItem>,
    pub technical_tasks: Vec<ChecklistItem>,
    pub dependencies: Vec<String>,
    pub blocks: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assignee: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_favorite: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thumbnail: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: DateTime<Utc>,
    #[serde(rename = "updatedAt")]
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub r#type: TaskType,
    pub priority: Priority,
    pub status: TaskStatus,
    pub story_points: Option<i32>,
    pub sprint: Option<String>,
    pub epic: Option<String>,
    pub description: String,
    pub acceptance_criteria: Vec<ChecklistItem>,
    pub technical_tasks: Vec<ChecklistItem>,
    pub dependencies: Vec<String>,
    pub blocks: Vec<String>,
    pub assignee: Option<String>,
    pub is_favorite: Option<bool>,
    pub thumbnail: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub r#type: Option<TaskType>,
    pub priority: Option<Priority>,
    pub status: Option<TaskStatus>,
    pub story_points: Option<Option<i32>>,
    pub sprint: Option<Option<String>>,
    pub epic: Option<Option<String>>,
    pub description: Option<String>,
    pub acceptance_criteria: Option<Vec<ChecklistItem>>,
    pub technical_tasks: Option<Vec<ChecklistItem>>,
    pub dependencies: Option<Vec<String>>,
    pub blocks: Option<Vec<String>>,
    pub assignee: Option<Option<String>>,
    pub is_favorite: Option<Option<bool>>,
    pub thumbnail: Option<Option<String>>,
}

// Authentication types
#[derive(Debug, Deserialize)]
pub struct AuthRequest {
    pub credentials: AuthCredentials,
}

#[derive(Debug, Deserialize)]
pub struct AuthCredentials {
    pub r#type: String,
    pub token: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub custom_headers: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub authenticated: bool,
    pub session_token: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub permissions: Vec<String>,
}

// Workspace types
#[derive(Debug, Serialize)]
pub struct WorkspaceInfo {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub server_version: String,
    pub capabilities: Vec<String>,
    pub last_updated: DateTime<Utc>,
    pub owner: WorkspaceOwner,
    pub permissions: WorkspacePermissions,
}

#[derive(Debug, Serialize)]
pub struct WorkspaceOwner {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub email: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WorkspacePermissions {
    pub can_read: bool,
    pub can_write: bool,
    pub can_delete: bool,
    pub can_admin: bool,
}

// Health check types
#[derive(Debug, Serialize)]
pub struct HealthStatus {
    pub status: String,
    pub version: String,
    pub uptime: u64,
    pub connections: u32,
    pub database: DatabaseStatus,
    pub memory: MemoryStatus,
}

#[derive(Debug, Serialize)]
pub struct DatabaseStatus {
    pub status: String,
    pub response_time: u32,
}

#[derive(Debug, Serialize)]
pub struct MemoryStatus {
    pub used: u64,
    pub total: u64,
    pub percentage: f64,
}

// User management types
#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub email: Option<String>,
    pub role: String,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub display_name: String,
    pub email: Option<String>,
    pub role: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub email: Option<String>,
    pub role: Option<String>,
    pub active: Option<bool>,
}

// Activity log types
#[derive(Debug, Serialize)]
pub struct ActivityLog {
    pub id: String,
    pub user_id: String,
    pub action: String,
    pub resource_type: String,
    pub resource_id: String,
    pub details: serde_json::Value,
    pub timestamp: DateTime<Utc>,
}

// Configuration types
#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    pub name: String,
    pub description: Option<String>,
    pub default_task_type: TaskType,
    pub available_statuses: Vec<TaskStatus>,
    pub available_priorities: Vec<Priority>,
    pub enable_story_points: bool,
    pub enable_sprints: bool,
    pub enable_epics: bool,
    pub theme: String,
}

// Analytics types
#[derive(Debug, Serialize)]
pub struct AnalyticsSummary {
    pub total_tasks: u32,
    pub completed_tasks: u32,
    pub in_progress_tasks: u32,
    pub total_story_points: u32,
    pub completed_story_points: u32,
    pub tasks_by_status: std::collections::HashMap<String, u32>,
    pub tasks_by_priority: std::collections::HashMap<String, u32>,
    pub tasks_by_type: std::collections::HashMap<String, u32>,
}

#[derive(Debug, Serialize)]
pub struct BurndownData {
    pub dates: Vec<String>,
    pub remaining_points: Vec<u32>,
    pub completed_points: Vec<u32>,
}

// Import/Export types
#[derive(Debug, Deserialize)]
pub struct ImportRequest {
    pub content: String,
    pub replace_existing: bool,
}

#[derive(Debug, Serialize)]
pub struct ImportResponse {
    pub tasks_imported: u32,
    pub tasks_updated: u32,
    pub errors: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ExportResponse {
    pub content: String,
    pub format: String,
    pub exported_at: DateTime<Utc>,
}

// Bulk operations
#[derive(Debug, Deserialize)]
pub struct BulkOperationRequest {
    pub operation: String,
    pub task_ids: Vec<String>,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct BulkOperationResponse {
    pub operation: String,
    pub successful_count: u32,
    pub failed_count: u32,
    pub errors: Vec<String>,
}

// Query parameters for list endpoints
#[derive(Debug, Deserialize)]
pub struct TaskListQuery {
    pub status: Option<String>,
    pub priority: Option<String>,
    pub task_type: Option<String>,
    pub assignee: Option<String>,
    pub sprint: Option<String>,
    pub epic: Option<String>,
    pub page: Option<u32>,
    pub limit: Option<u32>,
}

impl Default for TaskListQuery {
    fn default() -> Self {
        Self {
            status: None,
            priority: None,
            task_type: None,
            assignee: None,
            sprint: None,
            epic: None,
            page: Some(1),
            limit: Some(50),
        }
    }
}