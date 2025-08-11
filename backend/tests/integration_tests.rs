use axum::http::StatusCode;
use axum_test::TestServer;
use serde_json::json;
use std::env;

// Import the application modules
use taskdown_backend::models::*;
use taskdown_backend::handlers::*;
use taskdown_backend::database;

async fn create_test_server() -> TestServer {
    // Set up test database
    let database_url = "sqlite::memory:";
    env::set_var("DATABASE_URL", database_url);
    
    // Initialize database
    let db_pool = database::init_db().await.expect("Failed to initialize test database");
    
    // Create the application router
    let app = axum::Router::new()
        .route("/api/health", axum::routing::get(health_handler))
        .route("/api/auth/verify", axum::routing::post(auth_verify_handler))
        .route("/api/auth/status", axum::routing::get(auth_status_handler))
        .route("/api/workspace", axum::routing::get(workspace_info_handler))
        .route("/api/tasks", axum::routing::get(tasks_list_handler).post(tasks_create_handler))
        .route("/api/tasks/:id", axum::routing::get(tasks_get_handler).put(tasks_update_handler).delete(tasks_delete_handler))
        .route("/api/tasks/bulk", axum::routing::post(tasks_bulk_handler))
        .route("/api/import/markdown", axum::routing::post(import_markdown_handler))
        .route("/api/export/markdown", axum::routing::get(export_markdown_handler))
        .route("/api/analytics/summary", axum::routing::get(analytics_summary_handler))
        .route("/api/analytics/burndown", axum::routing::get(analytics_burndown_handler))
        .route("/api/users", axum::routing::get(users_list_handler).post(users_create_handler))
        .route("/api/users/:id", axum::routing::put(users_update_handler).delete(users_delete_handler))
        .route("/api/activity", axum::routing::get(activity_handler))
        .route("/api/config", axum::routing::get(config_get_handler).put(config_update_handler))
        .with_state(db_pool);

    TestServer::new(app).unwrap()
}

#[tokio::test]
async fn test_health_endpoint() {
    let server = create_test_server().await;
    
    let response = server.get("/api/health").await;
    
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<HealthStatus> = response.json();
    assert!(body.success);
    assert!(body.data.is_some());
    
    let health = body.data.unwrap();
    assert_eq!(health.status, "healthy");
    assert_eq!(health.version, "0.1.0");
    assert_eq!(health.database.status, "connected");
}

#[tokio::test]
async fn test_workspace_info_endpoint() {
    let server = create_test_server().await;
    
    let response = server.get("/api/workspace").await;
    
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<WorkspaceInfo> = response.json();
    assert!(body.success);
    assert!(body.data.is_some());
    
    let workspace = body.data.unwrap();
    assert_eq!(workspace.id, "default-workspace");
    assert_eq!(workspace.name, "Taskdown Workspace");
    assert_eq!(workspace.server_version, "0.1.0");
    assert!(workspace.capabilities.contains(&"sync".to_string()));
}

#[tokio::test]
async fn test_auth_verify_endpoint_api_key() {
    let server = create_test_server().await;
    
    let auth_request = AuthRequest {
        credentials: AuthCredentials {
            r#type: "api-key".to_string(),
            token: Some("taskdown-api-key-12345".to_string()),
            username: None,
            password: None,
            custom_headers: None,
        },
    };
    
    let response = server
        .post("/api/auth/verify")
        .json(&auth_request)
        .await;
    
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<AuthResponse> = response.json();
    assert!(body.success);
    assert!(body.data.is_some());
    
    let auth_response = body.data.unwrap();
    assert!(auth_response.authenticated);
    assert!(auth_response.session_token.is_some());
    assert!(auth_response.expires_at.is_some());
    assert_eq!(auth_response.permissions, vec!["read", "write"]);
}

#[tokio::test]
async fn test_auth_verify_endpoint_invalid_api_key() {
    let server = create_test_server().await;
    
    let auth_request = AuthRequest {
        credentials: AuthCredentials {
            r#type: "api-key".to_string(),
            token: Some("invalid-key".to_string()),
            username: None,
            password: None,
            custom_headers: None,
        },
    };
    
    let response = server
        .post("/api/auth/verify")
        .json(&auth_request)
        .await;
    
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<AuthResponse> = response.json();
    assert!(!body.success);
    assert!(body.error.is_some());
}

#[tokio::test]
async fn test_auth_verify_endpoint_basic_auth() {
    let server = create_test_server().await;
    
    let auth_request = AuthRequest {
        credentials: AuthCredentials {
            r#type: "basic".to_string(),
            token: None,
            username: Some("admin".to_string()),
            password: Some("admin".to_string()),
            custom_headers: None,
        },
    };
    
    let response = server
        .post("/api/auth/verify")
        .json(&auth_request)
        .await;
    
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<AuthResponse> = response.json();
    assert!(body.success);
    assert!(body.data.is_some());
    
    let auth_response = body.data.unwrap();
    assert!(auth_response.authenticated);
    assert!(auth_response.session_token.is_some());
    assert_eq!(auth_response.permissions, vec!["read", "write", "admin"]);
}

#[tokio::test]
async fn test_auth_status_endpoint_valid_token() {
    let server = create_test_server().await;
    
    // First get a valid token
    let auth_request = AuthRequest {
        credentials: AuthCredentials {
            r#type: "api-key".to_string(),
            token: Some("taskdown-api-key-12345".to_string()),
            username: None,
            password: None,
            custom_headers: None,
        },
    };
    
    let auth_response = server
        .post("/api/auth/verify")
        .json(&auth_request)
        .await;
    
    let auth_body: ApiResponse<AuthResponse> = auth_response.json();
    let token = auth_body.data.unwrap().session_token.unwrap();
    
    // Now check status with the token
    let status_response = server
        .get("/api/auth/status")
        .add_header(
            axum::http::header::AUTHORIZATION,
            axum::http::HeaderValue::from_str(&format!("Bearer {}", token)).unwrap()
        )
        .await;
    
    assert_eq!(status_response.status_code(), StatusCode::OK);
    
    let status_body: ApiResponse<AuthResponse> = status_response.json();
    assert!(status_body.success);
    assert!(status_body.data.is_some());
    
    let status_data = status_body.data.unwrap();
    assert!(status_data.authenticated);
    assert!(status_data.expires_at.is_some());
}

#[tokio::test]
async fn test_auth_status_endpoint_no_token() {
    let server = create_test_server().await;
    
    let response = server.get("/api/auth/status").await;
    
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<AuthResponse> = response.json();
    assert!(body.success);
    assert!(body.data.is_some());
    
    let auth_response = body.data.unwrap();
    assert!(!auth_response.authenticated);
    assert!(auth_response.session_token.is_none());
    assert!(auth_response.expires_at.is_none());
    assert!(auth_response.permissions.is_empty());
}

#[tokio::test]
async fn test_tasks_crud_operations() {
    let server = create_test_server().await;
    
    // Test creating a task
    let create_request = CreateTaskRequest {
        title: "Integration Test Task".to_string(),
        r#type: TaskType::Story,
        priority: Priority::High,
        status: TaskStatus::Todo,
        story_points: Some(5),
        sprint: Some("Sprint 1".to_string()),
        epic: Some("Epic 1".to_string()),
        description: "Test description".to_string(),
        acceptance_criteria: vec![
            ChecklistItem {
                id: None,
                text: "Should work correctly".to_string(),
                completed: false,
            }
        ],
        technical_tasks: vec![
            ChecklistItem {
                id: None,
                text: "Implement feature".to_string(),
                completed: false,
            }
        ],
        dependencies: vec![],
        blocks: vec![],
        assignee: Some("test-user".to_string()),
        is_favorite: Some(false),
        thumbnail: None,
    };
    
    let create_response = server
        .post("/api/tasks")
        .json(&create_request)
        .await;
    
    assert_eq!(create_response.status_code(), StatusCode::OK);
    
    let create_body: ApiResponse<serde_json::Value> = create_response.json();
    assert!(create_body.success);
    assert!(create_body.data.is_some());
    
    let created_data = create_body.data.unwrap();
    let task_id = created_data["id"].as_str().unwrap();
    
    // Test getting the created task
    let get_response = server
        .get(&format!("/api/tasks/{}", task_id))
        .await;
    
    assert_eq!(get_response.status_code(), StatusCode::OK);
    
    let get_body: ApiResponse<Task> = get_response.json();
    assert!(get_body.success);
    assert!(get_body.data.is_some());
    
    let task = get_body.data.unwrap();
    assert_eq!(task.id, task_id);
    assert_eq!(task.title, "Integration Test Task");
    assert_eq!(task.r#type, TaskType::Story);
    assert_eq!(task.priority, Priority::High);
    assert_eq!(task.status, TaskStatus::Todo);
    assert_eq!(task.story_points, Some(5));
    assert_eq!(task.acceptance_criteria.len(), 1);
    assert_eq!(task.technical_tasks.len(), 1);
    
    // Test updating the task
    let update_request = UpdateTaskRequest {
        title: Some("Updated Task Title".to_string()),
        r#type: None,
        priority: Some(Priority::Medium),
        status: Some(TaskStatus::InProgress),
        story_points: Some(Some(8)),
        sprint: None,
        epic: None,
        description: Some("Updated description".to_string()),
        acceptance_criteria: None,
        technical_tasks: None,
        dependencies: None,
        blocks: None,
        assignee: None,
        is_favorite: None,
        thumbnail: None,
    };
    
    let update_response = server
        .put(&format!("/api/tasks/{}", task_id))
        .json(&update_request)
        .await;
    
    assert_eq!(update_response.status_code(), StatusCode::OK);
    
    let update_body: ApiResponse<serde_json::Value> = update_response.json();
    assert!(update_body.success);
    
    // Test deleting the task
    let delete_response = server
        .delete(&format!("/api/tasks/{}", task_id))
        .await;
    
    assert_eq!(delete_response.status_code(), StatusCode::OK);
    
    let delete_body: ApiResponse<serde_json::Value> = delete_response.json();
    assert!(delete_body.success);
    
    // Verify task is deleted
    let get_deleted_response = server
        .get(&format!("/api/tasks/{}", task_id))
        .await;
    
    assert_eq!(get_deleted_response.status_code(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_tasks_list_endpoint() {
    let server = create_test_server().await;
    
    // Create a few test tasks first
    let tasks_data = vec![
        ("Task 1", TaskType::Story, Priority::High, TaskStatus::Todo, Some("Epic 1")),
        ("Task 2", TaskType::Bug, Priority::Low, TaskStatus::Done, Some("Epic 1")),
        ("Task 3", TaskType::Task, Priority::Medium, TaskStatus::InProgress, Some("Epic 2")),
    ];

    for (title, task_type, priority, status, epic) in tasks_data {
        let create_request = CreateTaskRequest {
            title: title.to_string(),
            r#type: task_type,
            priority,
            status,
            story_points: None,
            sprint: None,
            epic: epic.map(|e| e.to_string()),
            description: "Test".to_string(),
            acceptance_criteria: vec![],
            technical_tasks: vec![],
            dependencies: vec![],
            blocks: vec![],
            assignee: None,
            is_favorite: None,
            thumbnail: None,
        };
        
        server.post("/api/tasks").json(&create_request).await;
    }
    
    // Test getting all tasks
    let response = server.get("/api/tasks").await;
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<TaskSyncResponse> = response.json();
    assert!(body.success);
    assert!(body.data.is_some());
    
    let sync_response = body.data.unwrap();
    assert_eq!(sync_response.tasks.len(), 3);
    
    // Test filtering by epic
    let filtered_response = server
        .get("/api/tasks?epic=Epic%201")
        .await;
    
    assert_eq!(filtered_response.status_code(), StatusCode::OK);
    
    let filtered_body: ApiResponse<TaskSyncResponse> = filtered_response.json();
    let filtered_tasks = filtered_body.data.unwrap().tasks;
    assert_eq!(filtered_tasks.len(), 2);
    
    // Test filtering by status
    let status_filtered_response = server
        .get("/api/tasks?status=Done")
        .await;
    
    assert_eq!(status_filtered_response.status_code(), StatusCode::OK);
    
    let status_filtered_body: ApiResponse<TaskSyncResponse> = status_filtered_response.json();
    let status_filtered_tasks = status_filtered_body.data.unwrap().tasks;
    assert_eq!(status_filtered_tasks.len(), 1);
    assert_eq!(status_filtered_tasks[0].title, "Task 2");
}

#[tokio::test]
async fn test_analytics_endpoints() {
    let server = create_test_server().await;
    
    // Create some test data for analytics
    let tasks_data = vec![
        (TaskType::Story, Priority::High, TaskStatus::Done, Some(5)),
        (TaskType::Bug, Priority::Low, TaskStatus::Todo, Some(3)),
        (TaskType::Task, Priority::Medium, TaskStatus::Done, Some(8)),
        (TaskType::Story, Priority::High, TaskStatus::InProgress, None),
    ];

    for (task_type, priority, status, story_points) in tasks_data {
        let create_request = CreateTaskRequest {
            title: "Analytics Task".to_string(),
            r#type: task_type,
            priority,
            status,
            story_points,
            sprint: None,
            epic: None,
            description: "Test".to_string(),
            acceptance_criteria: vec![],
            technical_tasks: vec![],
            dependencies: vec![],
            blocks: vec![],
            assignee: None,
            is_favorite: None,
            thumbnail: None,
        };
        
        server.post("/api/tasks").json(&create_request).await;
    }
    
    // Test analytics summary endpoint
    let response = server.get("/api/analytics/summary").await;
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<AnalyticsSummary> = response.json();
    assert!(body.success);
    assert!(body.data.is_some());
    
    let summary = body.data.unwrap();
    assert_eq!(summary.total_tasks, 4);
    assert_eq!(summary.tasks_by_status.get("Done"), Some(&2));
    assert_eq!(summary.tasks_by_status.get("Todo"), Some(&1));
    assert_eq!(summary.tasks_by_status.get("InProgress"), Some(&1));
    assert_eq!(summary.tasks_by_type.get("Story"), Some(&2));
    assert_eq!(summary.tasks_by_type.get("Bug"), Some(&1));
    assert_eq!(summary.tasks_by_type.get("Task"), Some(&1));
    assert_eq!(summary.completion_rate, 50.0);
    
    // Test burndown endpoint
    let burndown_response = server
        .get("/api/analytics/burndown?sprint=Sprint%201")
        .await;
    
    assert_eq!(burndown_response.status_code(), StatusCode::OK);
    
    let burndown_body: ApiResponse<BurndownData> = burndown_response.json();
    assert!(burndown_body.success);
    assert!(burndown_body.data.is_some());
    
    let burndown = burndown_body.data.unwrap();
    assert_eq!(burndown.sprint, "Sprint 1");
}

#[tokio::test]
async fn test_bulk_operations_endpoint() {
    let server = create_test_server().await;
    
    let bulk_request = BulkOperationsRequest {
        operations: vec![
            BulkOperation {
                r#type: "create".to_string(),
                task_id: None,
                data: Some(json!({
                    "title": "Bulk Task 1",
                    "type": "Story"
                })),
            },
            BulkOperation {
                r#type: "create".to_string(),
                task_id: None,
                data: Some(json!({
                    "title": "Bulk Task 2",
                    "type": "Bug"
                })),
            },
        ],
    };
    
    let response = server
        .post("/api/tasks/bulk")
        .json(&bulk_request)
        .await;
    
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<serde_json::Value> = response.json();
    assert!(body.success);
    assert!(body.data.is_some());
    
    let data = body.data.unwrap();
    let results = data["results"].as_array().unwrap();
    assert_eq!(results.len(), 2);
    
    for result in results {
        assert_eq!(result["operation"], "create");
        assert_eq!(result["success"], true);
        assert!(result["error"].is_null());
    }
}

#[tokio::test]
async fn test_import_export_endpoints() {
    let server = create_test_server().await;
    
    // Test import endpoint
    let import_request = ImportMarkdownRequest {
        markdown: "# Test Epic\n\n## Task 1\n\n**Type**: Story\n".to_string(),
        options: None,
    };
    
    let import_response = server
        .post("/api/import/markdown")
        .json(&import_request)
        .await;
    
    assert_eq!(import_response.status_code(), StatusCode::OK);
    
    let import_body: ApiResponse<ImportResult> = import_response.json();
    assert!(import_body.success);
    assert!(import_body.data.is_some());
    
    let import_result = import_body.data.unwrap();
    assert_eq!(import_result.imported, 0); // Current implementation doesn't actually import
    assert!(!import_result.errors.is_empty());
    
    // Test export endpoint
    let export_response = server.get("/api/export/markdown").await;
    assert_eq!(export_response.status_code(), StatusCode::OK);
    
    let export_body: ApiResponse<ExportResult> = export_response.json();
    assert!(export_body.success);
    assert!(export_body.data.is_some());
    
    let export_result = export_body.data.unwrap();
    assert!(!export_result.markdown.is_empty());
    assert!(export_result.filename.contains("taskdown-export-"));
}

#[tokio::test]
async fn test_user_management_endpoints() {
    let server = create_test_server().await;
    
    // Test list users
    let list_response = server.get("/api/users").await;
    assert_eq!(list_response.status_code(), StatusCode::OK);
    
    let list_body: ApiResponse<serde_json::Value> = list_response.json();
    assert!(list_body.success);
    
    // Test create user
    let create_request = CreateUserRequest {
        username: "testuser".to_string(),
        display_name: "Test User".to_string(),
        email: "test@example.com".to_string(),
        role: UserRole::User,
        password: "password123".to_string(),
    };
    
    let create_response = server
        .post("/api/users")
        .json(&create_request)
        .await;
    
    assert_eq!(create_response.status_code(), StatusCode::OK);
    
    let create_body: ApiResponse<User> = create_response.json();
    assert!(create_body.success);
    assert!(create_body.data.is_some());
    
    let user = create_body.data.unwrap();
    assert_eq!(user.username, "testuser");
    assert_eq!(user.display_name, "Test User");
    assert_eq!(user.email, "test@example.com");
    assert_eq!(user.role, UserRole::User);
}

#[tokio::test]
async fn test_config_endpoint() {
    let server = create_test_server().await;
    
    let response = server.get("/api/config").await;
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<WorkspaceConfig> = response.json();
    assert!(body.success);
    assert!(body.data.is_some());
    
    let config = body.data.unwrap();
    assert_eq!(config.workspace_name, "Taskdown Workspace");
    assert_eq!(config.timezone, "UTC");
    assert!(config.features.analytics);
    assert_eq!(config.limits.max_tasks, 10000);
}

#[tokio::test]
async fn test_activity_endpoint() {
    let server = create_test_server().await;
    
    let response = server.get("/api/activity").await;
    assert_eq!(response.status_code(), StatusCode::OK);
    
    let body: ApiResponse<ActivityResponse> = response.json();
    assert!(body.success);
    assert!(body.data.is_some());
    
    let activity = body.data.unwrap();
    assert_eq!(activity.total_count, 0);
    assert!(!activity.has_more);
    assert!(activity.activities.is_empty());
}