use worker::*;

mod ai;
mod auth;
mod config;
mod database;
mod handlers;
mod models;

use config::load_cors_origins;
use handlers::*;

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();

    let router = Router::new();

    router
        // Health endpoint
        .get_async("/api/health", health_handler)
        // Authentication endpoints
        .post_async("/api/auth/verify", auth_verify_handler)
        .get_async("/api/auth/status", auth_status_handler)
        .post_async("/api/auth/register", auth_register_handler)
        // Registration page
        .get_async("/register", registration_page_handler)
        // Workspace endpoints
        .get_async("/api/workspace", workspace_info_handler)
        // Task endpoints
        .get_async("/api/tasks", tasks_list_handler)
        .post_async("/api/tasks", tasks_create_handler)
        .get_async("/api/tasks/:id", tasks_get_handler)
        .put_async("/api/tasks/:id", tasks_update_handler)
        .delete_async("/api/tasks/:id", tasks_delete_handler)
        .post_async("/api/tasks/bulk", tasks_bulk_handler)
        // Import/Export endpoints
        .post_async("/api/import/markdown", import_markdown_handler)
        .get_async("/api/export/markdown", export_markdown_handler)
        // Analytics endpoints
        .get_async("/api/analytics/summary", analytics_summary_handler)
        .get_async("/api/analytics/burndown", analytics_burndown_handler)
        // User management endpoints
        .get_async("/api/users", users_list_handler)
        .post_async("/api/users", users_create_handler)
        .put_async("/api/users/:id", users_update_handler)
        .delete_async("/api/users/:id", users_delete_handler)
        // Activity endpoint
        .get_async("/api/activity", activity_handler)
        // Configuration endpoints
        .get_async("/api/config", config_get_handler)
        .put_async("/api/config", config_update_handler)
        // AI endpoints
        .post_async("/api/ai/generate-task", ai_generate_task_handler)
        .post_async(
            "/api/ai/acceptance-criteria",
            ai_acceptance_criteria_handler,
        )
        .post_async(
            "/api/ai/estimate-story-points",
            ai_estimate_story_points_handler,
        )
        .post_async(
            "/api/ai/analyze-dependencies",
            ai_analyze_dependencies_handler,
        )
        .post_async("/api/ai/plan-sprint", ai_plan_sprint_handler)
        // Handle CORS preflight requests
        .options("/*", |_req, ctx| {
            Response::empty()
                .unwrap()
                .with_cors(&cors_headers(&ctx.env))
        })
        // Default handler
        .run(req, env.clone())
        .await?
        .with_cors(&cors_headers(&env))
}

fn cors_headers(env: &Env) -> Cors {
    let environment = env
        .var("ENVIRONMENT")
        .map(|v| v.to_string())
        .unwrap_or_else(|_| "development".to_string());

    let origins = load_cors_origins();
    let allowed_origins = origins.get_origins_for_env(&environment);

    Cors::new()
        .with_origins(allowed_origins)
        .with_methods(vec![
            Method::Get,
            Method::Post,
            Method::Put,
            Method::Delete,
            Method::Options,
        ])
        .with_allowed_headers(vec!["Content-Type", "Authorization"])
}
