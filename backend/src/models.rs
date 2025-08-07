use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

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
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "PascalCase")]
pub enum TaskType {
    Epic,
    Story,
    Task,
    Bug,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "PascalCase")]
pub enum Priority {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "PascalCase")]
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

#[derive(Debug, FromRow)]
pub struct TaskRow {
    pub id: String,
    pub title: String,
    pub task_type: String,
    pub priority: String,
    pub status: String,
    pub story_points: Option<i32>,
    pub sprint: Option<String>,
    pub epic: Option<String>,
    pub description: String,
    pub assignee: Option<String>,
    pub is_favorite: Option<bool>,
    pub thumbnail: Option<String>,
    pub created_at: String,
    pub updated_at: String,
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

// Type alias for compatibility with auth.rs
pub type AuthConfig = AuthCredentials;

#[derive(Debug, Serialize)]
pub struct AuthVerificationResult {
    pub authenticated: bool,
    pub session_token: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub permissions: Vec<String>,
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
}

#[derive(Debug, Serialize)]
pub struct WorkspacePermissions {
    pub can_manage_users: bool,
    pub can_modify_settings: bool,
    pub can_view_analytics: bool,
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
    pub response_time: u64,
}

#[derive(Debug, Serialize)]
pub struct MemoryStatus {
    pub used: u64,
    pub total: u64,
    pub percentage: f32,
}

// Task sync response
#[derive(Debug, Serialize)]
pub struct TaskSyncResponse {
    pub tasks: Vec<Task>,
    pub last_sync: DateTime<Utc>,
    pub total_count: Option<u32>,
    pub has_more: Option<bool>,
}

// Query parameters for tasks
#[derive(Debug, Deserialize, Default)]
pub struct TaskQueryParams {
    pub last_sync: Option<String>,
    pub epic: Option<String>,
    pub status: Option<String>, // Changed from TaskStatus to String for easier filtering
    pub assignee: Option<String>,
    pub limit: Option<u32>,
    pub offset: Option<u32>,
    pub sort: Option<String>,
    pub search: Option<String>,
}

// User types
#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: String,
    pub username: String,
    pub display_name: String,
    pub email: String,
    pub role: UserRole,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar: Option<String>,
    pub is_active: bool,
    pub last_seen: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    User,
    Viewer,
}

#[derive(Debug, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub display_name: String,
    pub email: String,
    pub role: UserRole,
    pub password: String,
}

// Activity types
#[derive(Debug, Serialize, FromRow)]
pub struct Activity {
    pub id: String,
    pub user_id: String,
    pub user_name: String,
    pub action: String,
    pub target_type: String,
    pub target_id: String,
    pub target_name: String,
    #[sqlx(skip)]
    pub details: Option<ActivityDetails>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivityDetails {
    pub field: Option<String>,
    pub old_value: Option<serde_json::Value>,
    pub new_value: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct ActivityResponse {
    pub activities: Vec<Activity>,
    pub total_count: u32,
    pub has_more: bool,
}

// Analytics types
#[derive(Debug, Serialize)]
pub struct AnalyticsSummary {
    pub total_tasks: u32,
    pub tasks_by_status: std::collections::HashMap<String, u32>,
    pub tasks_by_type: std::collections::HashMap<String, u32>,
    pub tasks_by_priority: std::collections::HashMap<String, u32>,
    pub average_story_points: f32,
    pub completion_rate: f32,
    pub active_sprints: Vec<String>,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct BurndownData {
    pub sprint: String,
    pub start_date: String,
    pub end_date: String,
    pub total_story_points: u32,
    pub daily_data: Vec<BurndownDataPoint>,
}

#[derive(Debug, Serialize)]
pub struct BurndownDataPoint {
    pub date: String,
    pub remaining_points: u32,
    pub completed_points: u32,
    pub ideal_remaining: u32,
}

// Configuration types
#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceConfig {
    pub workspace_name: String,
    pub timezone: String,
    pub date_format: String,
    pub features: WorkspaceFeatures,
    pub limits: WorkspaceLimits,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceFeatures {
    pub realtime: bool,
    pub analytics: bool,
    pub webhooks: bool,
    pub custom_fields: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceLimits {
    pub max_tasks: u32,
    pub max_users: u32,
    pub api_rate_limit: u32,
}

// Bulk operations
#[derive(Debug, Deserialize)]
pub struct BulkOperationsRequest {
    pub operations: Vec<BulkOperation>,
}

#[derive(Debug, Deserialize)]
pub struct BulkOperation {
    pub r#type: String, // "create", "update", "delete"
    pub task_id: Option<String>,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize)]
pub struct BulkOperationResult {
    pub operation: String,
    pub task_id: String,
    pub success: bool,
    pub error: Option<String>,
}

// Import/Export types
#[derive(Debug, Deserialize)]
pub struct ImportMarkdownRequest {
    pub markdown: String,
    pub options: Option<ImportOptions>,
}

#[derive(Debug, Deserialize)]
pub struct ImportOptions {
    pub overwrite: Option<bool>,
    pub preserve_ids: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub imported: u32,
    pub updated: u32,
    pub errors: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct ExportResult {
    pub markdown: String,
    pub filename: String,
}