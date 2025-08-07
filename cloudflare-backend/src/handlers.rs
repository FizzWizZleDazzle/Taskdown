use worker::*;
use crate::models::*;
use crate::database::Database;
use crate::auth::{AuthService, Claims};
use crate::config::{get_auth_config};
use chrono::Utc;

// Health check handler
pub async fn health_handler(_: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let health = HealthStatus {
        status: "healthy".to_string(),
        version: "0.1.0".to_string(),
        uptime: 0, // In a real implementation, track startup time
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

    Response::from_json(&ApiResponse::success(health))
}

// Authentication handlers
pub async fn auth_verify_handler(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let auth_request: AuthRequest = req.json().await?;
    let auth_config = get_auth_config();
    let auth_service = AuthService::new(auth_config);
    
    // Verify credentials based on type
    let authenticated = match auth_request.credentials.r#type.as_str() {
        "password" => {
            if let (Some(username), Some(password)) = (&auth_request.credentials.username, &auth_request.credentials.password) {
                auth_service.verify_credentials(username, password)
            } else {
                false
            }
        }
        "api_key" => {
            if let Some(token) = &auth_request.credentials.token {
                auth_service.verify_api_key(token)
            } else {
                false
            }
        }
        _ => false,
    };

    if authenticated {
        let username = auth_request.credentials.username.unwrap_or_else(|| "api_user".to_string());
        let user_id = format!("user_{}", username);
        let session_token = auth_service.create_session_token(user_id, username.clone());
        let permissions = if username == "admin" {
            vec!["read".to_string(), "write".to_string(), "admin".to_string()]
        } else {
            vec!["read".to_string(), "write".to_string()]
        };

        let auth_response = AuthResponse {
            authenticated: true,
            session_token: Some(session_token),
            expires_at: Some(Utc::now() + chrono::Duration::hours(24)),
            permissions,
        };

        Response::from_json(&ApiResponse::success(auth_response))
    } else {
        Response::from_json(&ApiResponse::<()>::error(
            "INVALID_CREDENTIALS".to_string(),
            "Invalid username/password or API key".to_string(),
        ))
    }
}

pub async fn auth_status_handler(req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let auth_config = get_auth_config();
    let auth_service = AuthService::new(auth_config);
    
    if let Some(token) = auth_service.extract_auth_header(&req) {
        match auth_service.verify_session_token(&token) {
            Ok(claims) => {
                let auth_response = AuthResponse {
                    authenticated: true,
                    session_token: Some(token),
                    expires_at: Some(chrono::DateTime::from_timestamp(claims.exp, 0).unwrap_or_else(|| Utc::now())),
                    permissions: claims.permissions,
                };
                Response::from_json(&ApiResponse::success(auth_response))
            }
            Err(e) => {
                Response::from_json(&ApiResponse::<()>::error(
                    "INVALID_SESSION".to_string(),
                    e.to_string(),
                ))
            }
        }
    } else {
        let auth_response = AuthResponse {
            authenticated: false,
            session_token: None,
            expires_at: None,
            permissions: vec![],
        };
        Response::from_json(&ApiResponse::success(auth_response))
    }
}

pub async fn auth_register_handler(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let register_request: RegisterRequest = req.json().await?;
    
    // For this implementation, we'll just validate the request and return success
    // In a real system, you would store the user in a database
    if register_request.username.trim().is_empty() || register_request.password.len() < 6 {
        return Response::from_json(&ApiResponse::<()>::error(
            "VALIDATION_ERROR".to_string(),
            "Username is required and password must be at least 6 characters".to_string(),
        ));
    }

    // Check if user already exists (hardcoded for demo)
    if register_request.username == "admin" || register_request.username == "user" {
        return Response::from_json(&ApiResponse::<()>::error(
            "USER_EXISTS".to_string(),
            "Username already exists".to_string(),
        ));
    }

    let user = User {
        id: format!("user_{}", register_request.username),
        username: register_request.username.clone(),
        display_name: register_request.display_name.clone().unwrap_or_else(|| register_request.username.clone()),
        email: register_request.email.clone(),
        role: "user".to_string(),
        active: true,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    Response::from_json(&ApiResponse::success(user))
}

pub async fn registration_page_handler(req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let host = req.headers()
        .get("host")
        .unwrap_or_default()
        .unwrap_or_else(|| "localhost".to_string());
    
    let base_url = if host.contains("localhost") || host.contains("127.0.0.1") {
        format!("http://{}", host)
    } else {
        format!("https://{}", host)
    };

    let html = format!(r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Taskdown Backend Registration</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        .container {{
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
        }}
        h1 {{
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }}
        .form-group {{
            margin-bottom: 20px;
        }}
        label {{
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: 500;
        }}
        input {{
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e1e1;
            border-radius: 6px;
            font-size: 16px;
            transition: border-color 0.3s;
            box-sizing: border-box;
        }}
        input:focus {{
            outline: none;
            border-color: #667eea;
        }}
        button {{
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.3s;
        }}
        button:hover {{
            background: #5a6fd8;
        }}
        button:disabled {{
            background: #ccc;
            cursor: not-allowed;
        }}
        .info {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }}
        .info h3 {{
            margin-top: 0;
            color: #333;
        }}
        .info p {{
            margin-bottom: 10px;
            color: #666;
        }}
        .demo-accounts {{
            background: #fff3cd;
            padding: 15px;
            border-radius: 6px;
            margin-top: 20px;
            border-left: 4px solid #ffc107;
        }}
        .demo-accounts h4 {{
            margin-top: 0;
            color: #856404;
        }}
        .demo-accounts code {{
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }}
        .result {{
            margin-top: 20px;
            padding: 15px;
            border-radius: 6px;
            display: none;
        }}
        .result.success {{
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }}
        .result.error {{
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Taskdown Backend Registration</h1>
        
        <div class="info">
            <h3>Welcome to the Taskdown Backend</h3>
            <p><strong>Backend URL:</strong> <code>{base_url}</code></p>
            <p>This is the registration page for the Taskdown backend running on this domain. Create an account to use this backend with the Taskdown frontend application.</p>
        </div>

        <form id="registrationForm">
            <div class="form-group">
                <label for="username">Username *</label>
                <input type="text" id="username" name="username" required minlength="3" maxlength="50">
            </div>
            
            <div class="form-group">
                <label for="displayName">Display Name</label>
                <input type="text" id="displayName" name="displayName" maxlength="100">
            </div>
            
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email">
            </div>
            
            <div class="form-group">
                <label for="password">Password *</label>
                <input type="password" id="password" name="password" required minlength="6">
            </div>
            
            <button type="submit" id="submitBtn">Create Account</button>
        </form>

        <div id="result" class="result"></div>

        <div class="demo-accounts">
            <h4>Demo Accounts Available</h4>
            <p>For testing purposes, these demo accounts are available:</p>
            <p><strong>Admin:</strong> <code>admin</code> / <code>admin123</code></p>
            <p><strong>User:</strong> <code>user</code> / <code>user123</code></p>
        </div>
    </div>

    <script>
        document.getElementById('registrationForm').addEventListener('submit', async function(e) {{
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const result = document.getElementById('result');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';
            result.style.display = 'none';
            
            const formData = new FormData(e.target);
            const data = {{
                username: formData.get('username'),
                display_name: formData.get('displayName') || null,
                email: formData.get('email') || null,
                password: formData.get('password')
            }};
            
            try {{
                const response = await fetch('{base_url}/api/auth/register', {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json',
                    }},
                    body: JSON.stringify(data)
                }});
                
                const responseData = await response.json();
                
                if (responseData.success) {{
                    result.className = 'result success';
                    result.innerHTML = `
                        <h4>Account Created Successfully!</h4>
                        <p><strong>Username:</strong> ${{data.username}}</p>
                        <p><strong>Backend URL:</strong> {base_url}</p>
                        <p>You can now use these credentials to connect to this backend from the Taskdown frontend application.</p>
                    `;
                    e.target.reset();
                }} else {{
                    result.className = 'result error';
                    result.innerHTML = `
                        <h4>Registration Failed</h4>
                        <p>${{responseData.error?.message || 'Unknown error occurred'}}</p>
                    `;
                }}
            }} catch (error) {{
                result.className = 'result error';
                result.innerHTML = `
                    <h4>Registration Failed</h4>
                    <p>Network error: ${{error.message}}</p>
                `;
            }}
            
            result.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }});
    </script>
</body>
</html>"#, base_url = base_url);

    Response::from_html(html)
}

// Workspace handlers
pub async fn workspace_info_handler(_: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let workspace = WorkspaceInfo {
        id: "cloudflare-workspace".to_string(),
        name: "Taskdown Cloudflare Workspace".to_string(),
        description: Some("A Cloudflare Workers-based workspace for Taskdown".to_string()),
        server_version: "0.1.0".to_string(),
        capabilities: vec![
            "sync".to_string(),
            "auth".to_string(),
            "tasks".to_string(),
            "analytics".to_string(),
        ],
        last_updated: Utc::now(),
        owner: WorkspaceOwner {
            id: "admin".to_string(),
            username: "admin".to_string(),
            display_name: "Administrator".to_string(),
            email: Some("admin@example.com".to_string()),
        },
        permissions: WorkspacePermissions {
            can_read: true,
            can_write: true,
            can_delete: true,
            can_admin: true,
        },
    };

    Response::from_json(&ApiResponse::success(workspace))
}

// Task handlers
pub async fn tasks_list_handler(req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Authenticate request
    let claims = match authenticate_request(&req) {
        Ok(claims) => claims,
        Err(_) => {
            return Response::from_json(&ApiResponse::<()>::error(
                "UNAUTHORIZED".to_string(),
                "Authentication required".to_string(),
            ));
        }
    };

    // Check read permission
    if let Err(_) = require_permission(&claims, "read") {
        return Response::from_json(&ApiResponse::<()>::error(
            "FORBIDDEN".to_string(),
            "Read permission required".to_string(),
        ));
    }

    let url = req.url()?;
    let query_params = url.query_pairs().collect::<std::collections::HashMap<_, _>>();
    
    let query = TaskListQuery {
        status: query_params.get("status").map(|s| s.to_string()),
        priority: query_params.get("priority").map(|s| s.to_string()),
        task_type: query_params.get("type").map(|s| s.to_string()),
        assignee: query_params.get("assignee").map(|s| s.to_string()),
        sprint: query_params.get("sprint").map(|s| s.to_string()),
        epic: query_params.get("epic").map(|s| s.to_string()),
        page: query_params.get("page").and_then(|s| s.parse().ok()),
        limit: query_params.get("limit").and_then(|s| s.parse().ok()),
    };

    let db = get_database(&ctx)?;
    match db.list_tasks(&query).await {
        Ok(tasks) => Response::from_json(&ApiResponse::success(tasks)),
        Err(e) => Response::from_json(&ApiResponse::<()>::error(
            "DATABASE_ERROR".to_string(),
            e.to_string(),
        )),
    }
}

pub async fn tasks_create_handler(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    // Authenticate request
    let claims = match authenticate_request(&req) {
        Ok(claims) => claims,
        Err(_) => {
            return Response::from_json(&ApiResponse::<()>::error(
                "UNAUTHORIZED".to_string(),
                "Authentication required".to_string(),
            ));
        }
    };

    // Check write permission
    if let Err(_) = require_permission(&claims, "write") {
        return Response::from_json(&ApiResponse::<()>::error(
            "FORBIDDEN".to_string(),
            "Write permission required".to_string(),
        ));
    }

    let create_request: CreateTaskRequest = match req.json().await {
        Ok(req) => req,
        Err(e) => {
            return Response::from_json(&ApiResponse::<()>::error(
                "INVALID_REQUEST".to_string(),
                format!("Invalid JSON: {}", e),
            ));
        }
    };

    let db = get_database(&ctx)?;
    match db.create_task(create_request).await {
        Ok(task) => Response::from_json(&ApiResponse::success(task)),
        Err(e) => Response::from_json(&ApiResponse::<()>::error(
            "DATABASE_ERROR".to_string(),
            e.to_string(),
        )),
    }
}

pub async fn tasks_get_handler(_req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let id = match ctx.param("id") {
        Some(id) => id,
        None => {
            return Response::from_json(&ApiResponse::<()>::error(
                "MISSING_PARAMETER".to_string(),
                "Task ID is required".to_string(),
            ));
        }
    };

    let db = get_database(&ctx)?;
    match db.get_task(id).await {
        Ok(task) => Response::from_json(&ApiResponse::success(task)),
        Err(e) => Response::from_json(&ApiResponse::<()>::error(
            "NOT_FOUND".to_string(),
            format!("Task not found: {}", e),
        )),
    }
}

pub async fn tasks_update_handler(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let id = match ctx.param("id") {
        Some(id) => id,
        None => {
            return Response::from_json(&ApiResponse::<()>::error(
                "MISSING_PARAMETER".to_string(),
                "Task ID is required".to_string(),
            ));
        }
    };

    let update_request: UpdateTaskRequest = match req.json().await {
        Ok(req) => req,
        Err(e) => {
            return Response::from_json(&ApiResponse::<()>::error(
                "INVALID_REQUEST".to_string(),
                format!("Invalid JSON: {}", e),
            ));
        }
    };

    let db = get_database(&ctx)?;
    match db.update_task(id, update_request).await {
        Ok(task) => Response::from_json(&ApiResponse::success(task)),
        Err(e) => Response::from_json(&ApiResponse::<()>::error(
            "DATABASE_ERROR".to_string(),
            e.to_string(),
        )),
    }
}

pub async fn tasks_delete_handler(_req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let id = match ctx.param("id") {
        Some(id) => id,
        None => {
            return Response::from_json(&ApiResponse::<()>::error(
                "MISSING_PARAMETER".to_string(),
                "Task ID is required".to_string(),
            ));
        }
    };

    let db = get_database(&ctx)?;
    match db.delete_task(id).await {
        Ok(_) => Response::from_json(&ApiResponse::success(())),
        Err(e) => Response::from_json(&ApiResponse::<()>::error(
            "DATABASE_ERROR".to_string(),
            e.to_string(),
        )),
    }
}

pub async fn tasks_bulk_handler(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let _bulk_request: BulkOperationRequest = match req.json().await {
        Ok(req) => req,
        Err(e) => {
            return Response::from_json(&ApiResponse::<()>::error(
                "INVALID_REQUEST".to_string(),
                format!("Invalid JSON: {}", e),
            ));
        }
    };

    // For now, return a simple response
    let response = BulkOperationResponse {
        operation: "bulk".to_string(),
        successful_count: 0,
        failed_count: 0,
        errors: vec!["Bulk operations not yet implemented".to_string()],
    };

    Response::from_json(&ApiResponse::success(response))
}

// Import/Export handlers
pub async fn import_markdown_handler(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let _import_request: ImportRequest = match req.json().await {
        Ok(req) => req,
        Err(e) => {
            return Response::from_json(&ApiResponse::<()>::error(
                "INVALID_REQUEST".to_string(),
                format!("Invalid JSON: {}", e),
            ));
        }
    };

    // For now, return a simple response
    let response = ImportResponse {
        tasks_imported: 0,
        tasks_updated: 0,
        errors: vec!["Import not yet implemented".to_string()],
    };

    Response::from_json(&ApiResponse::success(response))
}

pub async fn export_markdown_handler(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let response = ExportResponse {
        content: "# Taskdown Export\n\n*Export functionality not yet implemented*".to_string(),
        format: "markdown".to_string(),
        exported_at: Utc::now(),
    };

    Response::from_json(&ApiResponse::success(response))
}

// Analytics handlers
pub async fn analytics_summary_handler(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let summary = AnalyticsSummary {
        total_tasks: 0,
        completed_tasks: 0,
        in_progress_tasks: 0,
        total_story_points: 0,
        completed_story_points: 0,
        tasks_by_status: std::collections::HashMap::new(),
        tasks_by_priority: std::collections::HashMap::new(),
        tasks_by_type: std::collections::HashMap::new(),
    };

    Response::from_json(&ApiResponse::success(summary))
}

pub async fn analytics_burndown_handler(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let burndown = BurndownData {
        dates: vec![],
        remaining_points: vec![],
        completed_points: vec![],
    };

    Response::from_json(&ApiResponse::success(burndown))
}

// User management handlers
pub async fn users_list_handler(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let users: Vec<User> = vec![];
    Response::from_json(&ApiResponse::success(users))
}

pub async fn users_create_handler(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let _create_request: CreateUserRequest = match req.json().await {
        Ok(req) => req,
        Err(e) => {
            return Response::from_json(&ApiResponse::<()>::error(
                "INVALID_REQUEST".to_string(),
                format!("Invalid JSON: {}", e),
            ));
        }
    };

    Response::from_json(&ApiResponse::<()>::error(
        "NOT_IMPLEMENTED".to_string(),
        "User creation not yet implemented".to_string(),
    ))
}

pub async fn users_update_handler(mut req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let _id = ctx.param("id");
    let _update_request: UpdateUserRequest = match req.json().await {
        Ok(req) => req,
        Err(e) => {
            return Response::from_json(&ApiResponse::<()>::error(
                "INVALID_REQUEST".to_string(),
                format!("Invalid JSON: {}", e),
            ));
        }
    };

    Response::from_json(&ApiResponse::<()>::error(
        "NOT_IMPLEMENTED".to_string(),
        "User update not yet implemented".to_string(),
    ))
}

pub async fn users_delete_handler(_req: Request, ctx: RouteContext<()>) -> Result<Response> {
    let _id = ctx.param("id");

    Response::from_json(&ApiResponse::<()>::error(
        "NOT_IMPLEMENTED".to_string(),
        "User deletion not yet implemented".to_string(),
    ))
}

// Activity handler
pub async fn activity_handler(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let activities: Vec<ActivityLog> = vec![];
    Response::from_json(&ApiResponse::success(activities))
}

// Configuration handlers
pub async fn config_get_handler(_req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let config = WorkspaceConfig {
        name: "Taskdown Cloudflare Workspace".to_string(),
        description: Some("A Cloudflare Workers-based workspace".to_string()),
        default_task_type: TaskType::Task,
        available_statuses: vec![
            TaskStatus::Todo,
            TaskStatus::InProgress,
            TaskStatus::InReview,
            TaskStatus::Done,
        ],
        available_priorities: vec![
            Priority::Critical,
            Priority::High,
            Priority::Medium,
            Priority::Low,
        ],
        enable_story_points: true,
        enable_sprints: true,
        enable_epics: true,
        theme: "default".to_string(),
    };

    Response::from_json(&ApiResponse::success(config))
}

pub async fn config_update_handler(mut req: Request, _ctx: RouteContext<()>) -> Result<Response> {
    let _config: WorkspaceConfig = match req.json().await {
        Ok(config) => config,
        Err(e) => {
            return Response::from_json(&ApiResponse::<()>::error(
                "INVALID_REQUEST".to_string(),
                format!("Invalid JSON: {}", e),
            ));
        }
    };

    Response::from_json(&ApiResponse::<()>::error(
        "NOT_IMPLEMENTED".to_string(),
        "Configuration update not yet implemented".to_string(),
    ))
}

// Helper function to get database from context
fn get_database(_ctx: &RouteContext<()>) -> Result<Database> {
    // For now, return a simple database instance
    // In a real implementation, you would get the D1 database from context
    Ok(Database::new())
}

// Helper function to authenticate request
fn authenticate_request(req: &Request) -> std::result::Result<Claims, String> {
    let auth_config = get_auth_config();
    let auth_service = AuthService::new(auth_config);
    
    if let Some(token) = auth_service.extract_auth_header(req) {
        auth_service.verify_session_token(&token)
    } else {
        Err("No authorization header found".to_string())
    }
}

// Helper function to check permissions
fn require_permission(claims: &Claims, permission: &str) -> std::result::Result<(), String> {
    let auth_config = get_auth_config();
    let auth_service = AuthService::new(auth_config);
    
    if auth_service.require_permission(claims, permission) {
        Ok(())
    } else {
        Err(format!("Permission '{}' required", permission))
    }
}