use axum::{
    extract::Query,
    http::{header, Method, StatusCode},
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tower::ServiceBuilder;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber;

mod models;
mod handlers;
mod database;

use models::*;
use handlers::*;

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Initialize database
    let db_pool = database::init_db().await.expect("Failed to initialize database");

    // Build our application with routes
    let app = Router::new()
        // Health endpoint
        .route("/api/health", get(health_handler))
        
        // Authentication endpoints
        .route("/api/auth/verify", post(auth_verify_handler))
        .route("/api/auth/status", get(auth_status_handler))
        
        // Workspace endpoints
        .route("/api/workspace", get(workspace_info_handler))
        
        // Task endpoints
        .route("/api/tasks", get(tasks_list_handler).post(tasks_create_handler))
        .route("/api/tasks/:id", get(tasks_get_handler).put(tasks_update_handler).delete(tasks_delete_handler))
        .route("/api/tasks/bulk", post(tasks_bulk_handler))
        
        // Import/Export endpoints
        .route("/api/import/markdown", post(import_markdown_handler))
        .route("/api/export/markdown", get(export_markdown_handler))
        
        // Analytics endpoints
        .route("/api/analytics/summary", get(analytics_summary_handler))
        .route("/api/analytics/burndown", get(analytics_burndown_handler))
        
        // User management endpoints
        .route("/api/users", get(users_list_handler).post(users_create_handler))
        .route("/api/users/:id", put(users_update_handler).delete(users_delete_handler))
        
        // Activity endpoint
        .route("/api/activity", get(activity_handler))
        
        // Configuration endpoints
        .route("/api/config", get(config_get_handler).put(config_update_handler))
        
        // Add CORS layer
        .layer(
            ServiceBuilder::new()
                .layer(
                    CorsLayer::new()
                        .allow_origin(Any)
                        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
                        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION])
                )
        )
        .with_state(db_pool);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    tracing::info!("Server running on http://0.0.0.0:3001");
    
    axum::serve(listener, app).await.unwrap();
}
