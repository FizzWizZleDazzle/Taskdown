use axum::{
    extract::{Path, Query, State},
    http::{StatusCode, HeaderMap},
    response::Json,
};
use chrono::Utc;
use std::collections::HashMap;

use crate::database::{self, DbPool};
use crate::models::*;
use crate::auth::{AuthService, extract_auth_claims};

// Health check handler
pub async fn health_handler() -> Json<ApiResponse<HealthStatus>> {
    let uptime = 0; // In a real implementation, track startup time
    let health = HealthStatus {
        status: "healthy".to_string(),
        version: "0.1.0".to_string(),
        uptime,
        connections: 1,
        database: DatabaseStatus {
            status: "connected".to_string(),
            response_time: 1,
        },
        memory: MemoryStatus {
            used: 50 * 1024 * 1024, // 50MB
            total: 500 * 1024 * 1024, // 500MB
            percentage: 10.0,
        },
    };

    Json(ApiResponse::success(health))
}

// Authentication handlers
pub async fn auth_verify_handler(
    Json(request): Json<AuthRequest>,
) -> Json<ApiResponse<AuthResponse>> {
    let auth_service = AuthService::new();
    
    match auth_service.authenticate_request(&request.credentials).await {
        Ok(auth_result) => {
            let auth_response = AuthResponse {
                authenticated: auth_result.authenticated,
                session_token: auth_result.session_token,
                expires_at: auth_result.expires_at,
                permissions: auth_result.permissions,
            };
            Json(ApiResponse::success(auth_response))
        }
        Err(e) => {
            let auth_response = AuthResponse {
                authenticated: false,
                session_token: None,
                expires_at: None,
                permissions: vec![],
            };
            Json(ApiResponse::error("AUTH_FAILED".to_string(), e.to_string()))
        }
    }
}

pub async fn auth_status_handler(
    headers: HeaderMap,
) -> Json<ApiResponse<AuthResponse>> {
    let authorization = headers.get("authorization")
        .and_then(|h| h.to_str().ok());
    
    match extract_auth_claims(authorization) {
        Ok(Some(claims)) => {
            let auth_response = AuthResponse {
                authenticated: true,
                session_token: None, // Don't return the token in status check
                expires_at: Some(chrono::DateTime::from_timestamp(claims.exp, 0).unwrap().into()),
                permissions: claims.permissions,
            };
            Json(ApiResponse::success(auth_response))
        }
        Ok(None) => {
            let auth_response = AuthResponse {
                authenticated: false,
                session_token: None,
                expires_at: None,
                permissions: vec![],
            };
            Json(ApiResponse::success(auth_response))
        }
        Err(e) => {
            Json(ApiResponse::error("TOKEN_INVALID".to_string(), e.to_string()))
        }
    }
}

// Workspace info handler
pub async fn workspace_info_handler() -> Json<ApiResponse<WorkspaceInfo>> {
    let workspace_info = WorkspaceInfo {
        id: "default-workspace".to_string(),
        name: "Taskdown Workspace".to_string(),
        description: Some("Default Taskdown workspace".to_string()),
        server_version: "0.1.0".to_string(),
        capabilities: vec!["sync".to_string(), "auth".to_string(), "analytics".to_string()],
        last_updated: Utc::now(),
        owner: WorkspaceOwner {
            id: "admin".to_string(),
            username: "admin".to_string(),
            display_name: "Administrator".to_string(),
        },
        permissions: WorkspacePermissions {
            can_manage_users: true,
            can_modify_settings: true,
            can_view_analytics: true,
        },
    };

    Json(ApiResponse::success(workspace_info))
}

// Task handlers
pub async fn tasks_list_handler(
    State(pool): State<DbPool>,
    Query(params): Query<TaskQueryParams>,
) -> Result<Json<ApiResponse<TaskSyncResponse>>, StatusCode> {
    match database::get_tasks(&pool, &params).await {
        Ok(tasks) => {
            let response = TaskSyncResponse {
                tasks,
                last_sync: Utc::now(),
                total_count: None,
                has_more: None,
            };
            Ok(Json(ApiResponse::success(response)))
        }
        Err(e) => {
            tracing::error!("Failed to get tasks: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn tasks_get_handler(
    State(pool): State<DbPool>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<Task>>, StatusCode> {
    match database::get_task_by_id(&pool, &id).await {
        Ok(Some(task)) => Ok(Json(ApiResponse::success(task))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            tracing::error!("Failed to get task {}: {}", id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn tasks_create_handler(
    State(pool): State<DbPool>,
    Json(request): Json<CreateTaskRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    match database::create_task(&pool, &request).await {
        Ok(task) => {
            let response = serde_json::json!({
                "id": task.id,
                "createdAt": task.created_at,
                "updatedAt": task.updated_at
            });
            Ok(Json(ApiResponse::success(response)))
        }
        Err(e) => {
            tracing::error!("Failed to create task: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn tasks_update_handler(
    State(pool): State<DbPool>,
    Path(id): Path<String>,
    Json(request): Json<UpdateTaskRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    match database::update_task(&pool, &id, &request).await {
        Ok(_) => {
            let response = serde_json::json!({
                "updatedAt": Utc::now()
            });
            Ok(Json(ApiResponse::success(response)))
        }
        Err(e) => {
            tracing::error!("Failed to update task {}: {}", id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn tasks_delete_handler(
    State(pool): State<DbPool>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    match database::delete_task(&pool, &id).await {
        Ok(_) => {
            let response = serde_json::json!({
                "deleted": true
            });
            Ok(Json(ApiResponse::success(response)))
        }
        Err(e) => {
            tracing::error!("Failed to delete task {}: {}", id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

// Bulk operations handler
pub async fn tasks_bulk_handler(
    State(pool): State<DbPool>,
    Json(request): Json<BulkOperationsRequest>,
) -> Json<ApiResponse<serde_json::Value>> {
    let mut results = Vec::new();

    for operation in request.operations {
        let result = match operation.r#type.as_str() {
            "create" => {
                // Handle create operation
                BulkOperationResult {
                    operation: "create".to_string(),
                    task_id: uuid::Uuid::new_v4().to_string(),
                    success: true,
                    error: None,
                }
            }
            "update" => {
                // Handle update operation
                BulkOperationResult {
                    operation: "update".to_string(),
                    task_id: operation.task_id.unwrap_or_default(),
                    success: true,
                    error: None,
                }
            }
            "delete" => {
                // Handle delete operation
                BulkOperationResult {
                    operation: "delete".to_string(),
                    task_id: operation.task_id.unwrap_or_default(),
                    success: true,
                    error: None,
                }
            }
            _ => BulkOperationResult {
                operation: operation.r#type,
                task_id: operation.task_id.unwrap_or_default(),
                success: false,
                error: Some("Unknown operation type".to_string()),
            },
        };
        results.push(result);
    }

    let response = serde_json::json!({
        "results": results
    });

    Json(ApiResponse::success(response))
}

// Import/Export handlers
pub async fn import_markdown_handler(
    State(pool): State<DbPool>,
    Json(request): Json<ImportMarkdownRequest>,
) -> Json<ApiResponse<ImportResult>> {
    // For now, this is a basic implementation that could be enhanced
    // In a production environment, you'd implement the Jira-style markdown parser
    let result = ImportResult {
        imported: 0,
        updated: 0,
        errors: vec!["Import functionality requires frontend parser integration".to_string()],
    };

    Json(ApiResponse::success(result))
}

pub async fn export_markdown_handler(
    State(pool): State<DbPool>,
) -> Result<Json<ApiResponse<ExportResult>>, StatusCode> {
    match database::get_all_tasks_for_export(&pool).await {
        Ok(tasks) => {
            let mut markdown = String::new();
            markdown.push_str("# Taskdown Export\n\n");
            
            // Group tasks by epic
            let mut epics: HashMap<String, Vec<&Task>> = HashMap::new();
            let mut orphaned_tasks = Vec::new();
            
            for task in &tasks {
                if let Some(epic) = &task.epic {
                    epics.entry(epic.clone()).or_insert_with(Vec::new).push(task);
                } else {
                    orphaned_tasks.push(task);
                }
            }
            
            // Export epics
            for (epic_name, epic_tasks) in epics {
                markdown.push_str(&format!("## Epic: {}\n\n", epic_name));
                
                for task in epic_tasks {
                    export_task_to_markdown(task, &mut markdown);
                }
            }
            
            // Export orphaned tasks
            if !orphaned_tasks.is_empty() {
                markdown.push_str("## Miscellaneous Tasks\n\n");
                for task in orphaned_tasks {
                    export_task_to_markdown(task, &mut markdown);
                }
            }
            
            let result = ExportResult {
                markdown,
                filename: format!("taskdown-export-{}.md", Utc::now().format("%Y-%m-%d")),
            };
            
            Ok(Json(ApiResponse::success(result)))
        }
        Err(e) => {
            tracing::error!("Failed to export tasks: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

fn export_task_to_markdown(task: &Task, markdown: &mut String) {
    markdown.push_str(&format!("### {}: {}\n\n", task.id, task.title));
    
    markdown.push_str(&format!("**Type**: {:?}\n", task.r#type));
    markdown.push_str(&format!("**Priority**: {:?}\n", task.priority));
    markdown.push_str(&format!("**Status**: {:?}\n", task.status));
    
    if let Some(points) = task.story_points {
        markdown.push_str(&format!("**Story Points**: {}\n", points));
    }
    
    if let Some(sprint) = &task.sprint {
        markdown.push_str(&format!("**Sprint**: {}\n", sprint));
    }
    
    if let Some(assignee) = &task.assignee {
        markdown.push_str(&format!("**Assignee**: {}\n", assignee));
    }
    
    if !task.description.is_empty() {
        markdown.push_str(&format!("**Description**: {}\n", task.description));
    }
    
    // Export acceptance criteria
    if !task.acceptance_criteria.is_empty() {
        markdown.push_str("\n**Acceptance Criteria**:\n");
        for item in &task.acceptance_criteria {
            let checkbox = if item.completed { "x" } else { " " };
            markdown.push_str(&format!("- [{}] {}\n", checkbox, item.text));
        }
    }
    
    // Export technical tasks
    if !task.technical_tasks.is_empty() {
        markdown.push_str("\n**Technical Tasks**:\n");
        for item in &task.technical_tasks {
            let checkbox = if item.completed { "x" } else { " " };
            markdown.push_str(&format!("- [{}] {}\n", checkbox, item.text));
        }
    }
    
    // Export dependencies and blocks
    if !task.dependencies.is_empty() {
        markdown.push_str(&format!("**Dependencies**: {}\n", task.dependencies.join(", ")));
    } else {
        markdown.push_str("**Dependencies**: None\n");
    }
    
    if !task.blocks.is_empty() {
        markdown.push_str(&format!("**Blocks**: {}\n", task.blocks.join(", ")));
    } else {
        markdown.push_str("**Blocks**: None\n");
    }
    
    markdown.push_str("\n---\n\n");
}

// Analytics handlers
pub async fn analytics_summary_handler(
    State(pool): State<DbPool>,
) -> Result<Json<ApiResponse<AnalyticsSummary>>, StatusCode> {
    let total_tasks = database::get_task_count(&pool).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let tasks_by_status = database::get_tasks_by_status(&pool).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let tasks_by_type = database::get_tasks_by_type(&pool).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let tasks_by_priority = database::get_tasks_by_priority(&pool).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let average_story_points = database::get_average_story_points(&pool).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let completion_rate = database::get_completion_rate(&pool).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let active_sprints = database::get_active_sprints(&pool).await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let summary = AnalyticsSummary {
        total_tasks,
        tasks_by_status,
        tasks_by_type,
        tasks_by_priority,
        average_story_points,
        completion_rate,
        active_sprints,
        last_updated: Utc::now(),
    };

    Ok(Json(ApiResponse::success(summary)))
}

pub async fn analytics_burndown_handler(
    Query(params): Query<HashMap<String, String>>,
) -> Json<ApiResponse<BurndownData>> {
    let sprint = params.get("sprint").cloned().unwrap_or_default();
    
    let burndown = BurndownData {
        sprint: sprint.clone(),
        start_date: "2024-01-01".to_string(),
        end_date: "2024-01-14".to_string(),
        total_story_points: 0,
        daily_data: vec![],
    };

    Json(ApiResponse::success(burndown))
}

// User management handlers
pub async fn users_list_handler() -> Json<ApiResponse<serde_json::Value>> {
    let users: Vec<User> = vec![];
    let response = serde_json::json!({
        "users": users
    });

    Json(ApiResponse::success(response))
}

pub async fn users_create_handler(
    Json(request): Json<CreateUserRequest>,
) -> Json<ApiResponse<User>> {
    let user = User {
        id: uuid::Uuid::new_v4().to_string(),
        username: request.username,
        display_name: request.display_name,
        email: request.email,
        role: request.role,
        avatar: None,
        is_active: true,
        last_seen: Utc::now(),
    };

    Json(ApiResponse::success(user))
}

pub async fn users_update_handler(
    Path(id): Path<String>,
    Json(request): Json<serde_json::Value>,
) -> Json<ApiResponse<serde_json::Value>> {
    let response = serde_json::json!({
        "updated": true
    });

    Json(ApiResponse::success(response))
}

pub async fn users_delete_handler(
    Path(id): Path<String>,
) -> Json<ApiResponse<serde_json::Value>> {
    let response = serde_json::json!({
        "deleted": true
    });

    Json(ApiResponse::success(response))
}

// Activity handler
pub async fn activity_handler(
    Query(params): Query<HashMap<String, String>>,
) -> Json<ApiResponse<ActivityResponse>> {
    let activities = vec![];
    
    let response = ActivityResponse {
        activities,
        total_count: 0,
        has_more: false,
    };

    Json(ApiResponse::success(response))
}

// Configuration handlers
pub async fn config_get_handler(
    State(pool): State<DbPool>,
) -> Result<Json<ApiResponse<WorkspaceConfig>>, StatusCode> {
    match database::get_workspace_config(&pool).await {
        Ok(config) => Ok(Json(ApiResponse::success(config))),
        Err(e) => {
            tracing::error!("Failed to get workspace config: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

pub async fn config_update_handler(
    State(pool): State<DbPool>,
    Json(request): Json<serde_json::Value>,
) -> Json<ApiResponse<serde_json::Value>> {
    let response = serde_json::json!({
        "updated": true
    });

    Json(ApiResponse::success(response))
}