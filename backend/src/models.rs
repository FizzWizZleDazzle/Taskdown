use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// API Response wrapper
#[derive(Debug, Serialize, Deserialize)]
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
    #[serde(skip_serializing_if = "Option::is_none", rename = "storyPoints")]
    pub story_points: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sprint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub epic: Option<String>,
    pub description: String,
    #[serde(rename = "acceptanceCriteria")]
    pub acceptance_criteria: Vec<ChecklistItem>,
    #[serde(rename = "technicalTasks")]
    pub technical_tasks: Vec<ChecklistItem>,
    pub dependencies: Vec<String>,
    pub blocks: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assignee: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "isFavorite")]
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

#[derive(Debug, Deserialize, Serialize)]
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

#[derive(Debug, Deserialize, Serialize)]
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
#[derive(Debug, Deserialize, Serialize)]
pub struct AuthRequest {
    pub credentials: AuthCredentials,
}

#[derive(Debug, Deserialize, Serialize)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub authenticated: bool,
    pub session_token: Option<String>,
    pub expires_at: Option<DateTime<Utc>>,
    pub permissions: Vec<String>,
}

// Workspace types
#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspaceOwner {
    pub id: String,
    pub username: String,
    pub display_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkspacePermissions {
    pub can_manage_users: bool,
    pub can_modify_settings: bool,
    pub can_view_analytics: bool,
}

// Health check types
#[derive(Debug, Serialize, Deserialize)]
pub struct HealthStatus {
    pub status: String,
    pub version: String,
    pub uptime: u64,
    pub connections: u32,
    pub database: DatabaseStatus,
    pub memory: MemoryStatus,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseStatus {
    pub status: String,
    pub response_time: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MemoryStatus {
    pub used: u64,
    pub total: u64,
    pub percentage: f32,
}

// Task sync response
#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize, PartialEq, sqlx::Type)]
#[sqlx(type_name = "TEXT", rename_all = "lowercase")]
pub enum UserRole {
    Admin,
    User,
    Viewer,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub display_name: String,
    pub email: String,
    pub role: UserRole,
    pub password: String,
}

// Activity types
#[derive(Debug, Serialize, Deserialize, FromRow)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct ActivityResponse {
    pub activities: Vec<Activity>,
    pub total_count: u32,
    pub has_more: bool,
}

// Analytics types
#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize)]
pub struct BurndownData {
    pub sprint: String,
    pub start_date: String,
    pub end_date: String,
    pub total_story_points: u32,
    pub daily_data: Vec<BurndownDataPoint>,
}

#[derive(Debug, Serialize, Deserialize)]
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
#[derive(Debug, Deserialize, Serialize)]
pub struct BulkOperationsRequest {
    pub operations: Vec<BulkOperation>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct BulkOperation {
    pub r#type: String, // "create", "update", "delete"
    pub task_id: Option<String>,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BulkOperationResult {
    pub operation: String,
    pub task_id: String,
    pub success: bool,
    pub error: Option<String>,
}

// Import/Export types
#[derive(Debug, Deserialize, Serialize)]
pub struct ImportMarkdownRequest {
    pub markdown: String,
    pub options: Option<ImportOptions>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct ImportOptions {
    pub overwrite: Option<bool>,
    pub preserve_ids: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub imported: u32,
    pub updated: u32,
    pub errors: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportResult {
    pub markdown: String,
    pub filename: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    #[test]
    fn test_api_response_success() {
        let data = "test data";
        let response = ApiResponse::success(data);
        
        assert!(response.success);
        assert_eq!(response.data, Some(data));
        assert!(response.error.is_none());
    }

    #[test]
    fn test_api_response_error() {
        let response: ApiResponse<String> = ApiResponse::error(
            "TEST_ERROR".to_string(), 
            "Test error message".to_string()
        );
        
        assert!(!response.success);
        assert!(response.data.is_none());
        assert!(response.error.is_some());
        
        let error = response.error.unwrap();
        assert_eq!(error.code, "TEST_ERROR");
        assert_eq!(error.message, "Test error message");
    }

    #[test]
    fn test_task_type_enum_serialization() {
        assert_eq!(format!("{:?}", TaskType::Epic), "Epic");
        assert_eq!(format!("{:?}", TaskType::Story), "Story");
        assert_eq!(format!("{:?}", TaskType::Task), "Task");
        assert_eq!(format!("{:?}", TaskType::Bug), "Bug");
    }

    #[test]
    fn test_priority_enum_serialization() {
        assert_eq!(format!("{:?}", Priority::Critical), "Critical");
        assert_eq!(format!("{:?}", Priority::High), "High");
        assert_eq!(format!("{:?}", Priority::Medium), "Medium");
        assert_eq!(format!("{:?}", Priority::Low), "Low");
    }

    #[test]
    fn test_task_status_enum_serialization() {
        assert_eq!(format!("{:?}", TaskStatus::Todo), "Todo");
        assert_eq!(format!("{:?}", TaskStatus::InProgress), "InProgress");
        assert_eq!(format!("{:?}", TaskStatus::InReview), "InReview");
        assert_eq!(format!("{:?}", TaskStatus::Done), "Done");
    }

    #[test]
    fn test_checklist_item_creation() {
        let item = ChecklistItem {
            id: Some("test-id".to_string()),
            text: "Test item".to_string(),
            completed: false,
        };
        
        assert_eq!(item.id, Some("test-id".to_string()));
        assert_eq!(item.text, "Test item");
        assert!(!item.completed);
    }

    #[test]
    fn test_task_creation() {
        let now = Utc::now();
        let task = Task {
            id: "test-task-1".to_string(),
            title: "Test Task".to_string(),
            r#type: TaskType::Story,
            priority: Priority::High,
            status: TaskStatus::Todo,
            story_points: Some(5),
            sprint: Some("Sprint 1".to_string()),
            epic: Some("Epic 1".to_string()),
            description: "Test description".to_string(),
            acceptance_criteria: vec![
                ChecklistItem {
                    id: Some("ac-1".to_string()),
                    text: "Should do something".to_string(),
                    completed: false,
                }
            ],
            technical_tasks: vec![
                ChecklistItem {
                    id: Some("tt-1".to_string()),
                    text: "Implement feature".to_string(),
                    completed: true,
                }
            ],
            dependencies: vec!["task-2".to_string()],
            blocks: vec!["task-3".to_string()],
            assignee: Some("user-1".to_string()),
            is_favorite: Some(true),
            thumbnail: None,
            created_at: now,
            updated_at: now,
        };
        
        assert_eq!(task.id, "test-task-1");
        assert_eq!(task.title, "Test Task");
        assert_eq!(task.r#type, TaskType::Story);
        assert_eq!(task.priority, Priority::High);
        assert_eq!(task.status, TaskStatus::Todo);
        assert_eq!(task.story_points, Some(5));
        assert_eq!(task.acceptance_criteria.len(), 1);
        assert_eq!(task.technical_tasks.len(), 1);
        assert_eq!(task.dependencies.len(), 1);
        assert_eq!(task.blocks.len(), 1);
    }

    #[test]
    fn test_create_task_request() {
        let request = CreateTaskRequest {
            title: "New Task".to_string(),
            r#type: TaskType::Bug,
            priority: Priority::Critical,
            status: TaskStatus::Todo,
            story_points: Some(3),
            sprint: Some("Sprint 2".to_string()),
            epic: None,
            description: "Bug description".to_string(),
            acceptance_criteria: vec![],
            technical_tasks: vec![],
            dependencies: vec![],
            blocks: vec![],
            assignee: None,
            is_favorite: Some(false),
            thumbnail: None,
        };
        
        assert_eq!(request.title, "New Task");
        assert_eq!(request.r#type, TaskType::Bug);
        assert_eq!(request.priority, Priority::Critical);
        assert_eq!(request.story_points, Some(3));
    }

    #[test]
    fn test_update_task_request() {
        let request = UpdateTaskRequest {
            title: Some("Updated Title".to_string()),
            r#type: Some(TaskType::Story),
            priority: Some(Priority::Low),
            status: Some(TaskStatus::Done),
            story_points: Some(Some(8)),
            sprint: Some(Some("New Sprint".to_string())),
            epic: Some(None),
            description: Some("Updated description".to_string()),
            acceptance_criteria: Some(vec![]),
            technical_tasks: Some(vec![]),
            dependencies: Some(vec![]),
            blocks: Some(vec![]),
            assignee: Some(Some("new-user".to_string())),
            is_favorite: Some(Some(true)),
            thumbnail: Some(None),
        };
        
        assert_eq!(request.title, Some("Updated Title".to_string()));
        assert_eq!(request.status, Some(TaskStatus::Done));
    }

    #[test]
    fn test_user_creation() {
        let now = Utc::now();
        let user = User {
            id: "user-1".to_string(),
            username: "testuser".to_string(),
            display_name: "Test User".to_string(),
            email: "test@example.com".to_string(),
            role: UserRole::User,
            avatar: Some("avatar.png".to_string()),
            is_active: true,
            last_seen: now,
        };
        
        assert_eq!(user.id, "user-1");
        assert_eq!(user.username, "testuser");
        assert_eq!(user.role, UserRole::User);
        assert!(user.is_active);
    }

    #[test]
    fn test_health_status_creation() {
        let health = HealthStatus {
            status: "healthy".to_string(),
            version: "1.0.0".to_string(),
            uptime: 3600,
            connections: 10,
            database: DatabaseStatus {
                status: "connected".to_string(),
                response_time: 5,
            },
            memory: MemoryStatus {
                used: 50 * 1024 * 1024,
                total: 500 * 1024 * 1024,
                percentage: 10.0,
            },
        };
        
        assert_eq!(health.status, "healthy");
        assert_eq!(health.version, "1.0.0");
        assert_eq!(health.uptime, 3600);
        assert_eq!(health.connections, 10);
        assert_eq!(health.database.status, "connected");
        assert_eq!(health.memory.percentage, 10.0);
    }

    #[test]
    fn test_workspace_info_creation() {
        let workspace = WorkspaceInfo {
            id: "workspace-1".to_string(),
            name: "Test Workspace".to_string(),
            description: Some("Test description".to_string()),
            server_version: "1.0.0".to_string(),
            capabilities: vec!["sync".to_string(), "auth".to_string()],
            last_updated: Utc::now(),
            owner: WorkspaceOwner {
                id: "owner-1".to_string(),
                username: "owner".to_string(),
                display_name: "Workspace Owner".to_string(),
            },
            permissions: WorkspacePermissions {
                can_manage_users: true,
                can_modify_settings: false,
                can_view_analytics: true,
            },
        };
        
        assert_eq!(workspace.id, "workspace-1");
        assert_eq!(workspace.name, "Test Workspace");
        assert_eq!(workspace.capabilities.len(), 2);
        assert!(workspace.permissions.can_manage_users);
        assert!(!workspace.permissions.can_modify_settings);
    }
}