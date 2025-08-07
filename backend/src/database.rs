use sqlx::{Row, SqlitePool, migrate::MigrateDatabase, Sqlite};
use anyhow::Result;
use chrono::{DateTime, Utc};

use crate::models::*;

pub type DbPool = SqlitePool;

impl From<TaskRow> for Task {
    fn from(row: TaskRow) -> Self {
        let task_type = match row.task_type.as_str() {
            "Epic" => TaskType::Epic,
            "Story" => TaskType::Story,
            "Bug" => TaskType::Bug,
            _ => TaskType::Task,
        };

        let priority = match row.priority.as_str() {
            "Critical" => Priority::Critical,
            "High" => Priority::High,
            "Low" => Priority::Low,
            _ => Priority::Medium,
        };

        let status = match row.status.as_str() {
            "Todo" => TaskStatus::Todo,
            "InProgress" => TaskStatus::InProgress,
            "InReview" => TaskStatus::InReview,
            _ => TaskStatus::Done,
        };

        Task {
            id: row.id,
            title: row.title,
            r#type: task_type,
            priority,
            status,
            story_points: row.story_points,
            sprint: row.sprint,
            epic: row.epic,
            description: row.description,
            acceptance_criteria: vec![], // Will be populated separately
            technical_tasks: vec![], // Will be populated separately
            dependencies: vec![], // Will be populated separately
            blocks: vec![], // Will be populated separately
            assignee: row.assignee,
            is_favorite: row.is_favorite,
            thumbnail: row.thumbnail,
            created_at: DateTime::parse_from_rfc3339(&row.created_at).unwrap().with_timezone(&Utc),
            updated_at: DateTime::parse_from_rfc3339(&row.updated_at).unwrap().with_timezone(&Utc),
        }
    }
}

pub async fn init_db() -> Result<DbPool> {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:taskdown.db".to_string());

    // Create database if it doesn't exist
    if !Sqlite::database_exists(&database_url).await.unwrap_or(false) {
        println!("Creating database {}", database_url);
        match Sqlite::create_database(&database_url).await {
            Ok(_) => println!("Create db success"),
            Err(error) => panic!("error: {}", error),
        }
    } else {
        println!("Database already exists");
    }

    let pool = SqlitePool::connect(&database_url).await?;
    
    // Run migrations
    create_tables(&pool).await?;
    
    Ok(pool)
}

async fn create_tables(pool: &SqlitePool) -> Result<()> {
    // Create tasks table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            task_type TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT NOT NULL,
            story_points INTEGER,
            sprint TEXT,
            epic TEXT,
            description TEXT NOT NULL DEFAULT '',
            assignee TEXT,
            is_favorite BOOLEAN DEFAULT FALSE,
            thumbnail TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        "#,
    ).execute(pool).await?;

    // Create checklist_items table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS checklist_items (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            item_type TEXT NOT NULL CHECK (item_type IN ('acceptance_criteria', 'technical_tasks')),
            text TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
        )
        "#,
    ).execute(pool).await?;

    // Create task_dependencies table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS task_dependencies (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            depends_on_task_id TEXT NOT NULL,
            FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
            FOREIGN KEY (depends_on_task_id) REFERENCES tasks (id) ON DELETE CASCADE,
            UNIQUE(task_id, depends_on_task_id)
        )
        "#,
    ).execute(pool).await?;

    // Create task_blocks table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS task_blocks (
            id TEXT PRIMARY KEY,
            task_id TEXT NOT NULL,
            blocks_task_id TEXT NOT NULL,
            FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
            FOREIGN KEY (blocks_task_id) REFERENCES tasks (id) ON DELETE CASCADE,
            UNIQUE(task_id, blocks_task_id)
        )
        "#,
    ).execute(pool).await?;

    // Create users table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            avatar TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            last_seen TEXT NOT NULL,
            password_hash TEXT NOT NULL
        )
        "#,
    ).execute(pool).await?;

    // Create activities table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            action TEXT NOT NULL,
            target_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            target_name TEXT NOT NULL,
            details TEXT, -- JSON string
            timestamp TEXT NOT NULL
        )
        "#,
    ).execute(pool).await?;

    // Create workspace_config table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS workspace_config (
            id INTEGER PRIMARY KEY DEFAULT 1,
            workspace_name TEXT NOT NULL DEFAULT 'Taskdown Workspace',
            timezone TEXT NOT NULL DEFAULT 'UTC',
            date_format TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
            features TEXT NOT NULL DEFAULT '{}', -- JSON string
            limits TEXT NOT NULL DEFAULT '{}', -- JSON string
            CHECK (id = 1)
        )
        "#,
    ).execute(pool).await?;

    // Insert default config if not exists
    sqlx::query(
        r#"
        INSERT OR IGNORE INTO workspace_config (id, workspace_name, features, limits)
        VALUES (1, 'Taskdown Workspace', 
               '{"realtime": false, "analytics": true, "webhooks": false, "custom_fields": false}',
               '{"max_tasks": 10000, "max_users": 100, "api_rate_limit": 1000}')
        "#,
    ).execute(pool).await?;

    // Create indexes
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)")
        .execute(pool).await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_epic ON tasks(epic)")
        .execute(pool).await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint)")
        .execute(pool).await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee)")
        .execute(pool).await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_checklist_items_task_id ON checklist_items(task_id)")
        .execute(pool).await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)")
        .execute(pool).await?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_activities_target_id ON activities(target_id)")
        .execute(pool).await?;

    Ok(())
}

// Task database operations
pub async fn get_tasks(pool: &DbPool, params: &TaskQueryParams) -> Result<Vec<Task>> {
    let mut query = "SELECT id, title, task_type, priority, status, story_points, sprint, epic, 
                           description, assignee, is_favorite, thumbnail, created_at, updated_at
                     FROM tasks WHERE 1=1".to_string();
    let mut conditions = Vec::new();
    let mut bind_values: Vec<String> = Vec::new();

    // Add filtering conditions
    if let Some(epic) = &params.epic {
        conditions.push("epic = ?");
        bind_values.push(epic.clone());
    }

    if let Some(status) = &params.status {
        conditions.push("status = ?");
        bind_values.push(status.clone());
    }

    if let Some(assignee) = &params.assignee {
        conditions.push("assignee = ?");
        bind_values.push(assignee.clone());
    }

    if let Some(search) = &params.search {
        conditions.push("(title LIKE ? OR description LIKE ?)");
        let search_pattern = format!("%{}%", search);
        bind_values.push(search_pattern.clone());
        bind_values.push(search_pattern);
    }

    // Add conditions to query
    for condition in conditions {
        query.push_str(" AND ");
        query.push_str(condition);
    }

    // Add sorting
    let sort_column = params.sort.as_ref()
        .and_then(|s| s.split(':').next())
        .unwrap_or("updated_at");
    let sort_direction = params.sort.as_ref()
        .and_then(|s| s.split(':').nth(1))
        .unwrap_or("desc");
    
    query.push_str(&format!(" ORDER BY {} {}", sort_column, sort_direction));

    // Add pagination
    if let Some(limit) = params.limit {
        query.push_str(&format!(" LIMIT {}", limit));
        if let Some(offset) = params.offset {
            query.push_str(&format!(" OFFSET {}", offset));
        }
    }

    // Execute query with bindings
    let mut sqlx_query = sqlx::query_as::<_, TaskRow>(&query);
    for value in bind_values {
        sqlx_query = sqlx_query.bind(value);
    }

    let rows = sqlx_query.fetch_all(pool).await?;

    let mut tasks = Vec::new();
    for row in rows {
        let mut task = Task::from(row);
        
        // Load checklist items
        task.acceptance_criteria = get_checklist_items(pool, &task.id, "acceptance_criteria").await?;
        task.technical_tasks = get_checklist_items(pool, &task.id, "technical_tasks").await?;
        
        // Load dependencies and blocks
        task.dependencies = get_task_relationships(pool, &task.id, "task_dependencies", "depends_on_task_id").await?;
        task.blocks = get_task_relationships(pool, &task.id, "task_blocks", "blocks_task_id").await?;
        
        tasks.push(task);
    }

    Ok(tasks)
}

pub async fn get_task_by_id(pool: &DbPool, task_id: &str) -> Result<Option<Task>> {
    let row = sqlx::query_as::<_, TaskRow>(
        "SELECT id, title, task_type, priority, status, story_points, sprint, epic, 
                description, assignee, is_favorite, thumbnail, created_at, updated_at
         FROM tasks WHERE id = ?"
    )
    .bind(task_id)
    .fetch_optional(pool)
    .await?;

    if let Some(row) = row {
        let mut task = Task::from(row);
        
        // Load checklist items
        task.acceptance_criteria = get_checklist_items(pool, &task.id, "acceptance_criteria").await?;
        task.technical_tasks = get_checklist_items(pool, &task.id, "technical_tasks").await?;
        
        // Load dependencies and blocks
        task.dependencies = get_task_relationships(pool, &task.id, "task_dependencies", "depends_on_task_id").await?;
        task.blocks = get_task_relationships(pool, &task.id, "task_blocks", "blocks_task_id").await?;
        
        Ok(Some(task))
    } else {
        Ok(None)
    }
}

pub async fn create_task(pool: &DbPool, request: &CreateTaskRequest) -> Result<Task> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO tasks (id, title, task_type, priority, status, story_points, sprint, epic, 
                           description, assignee, is_favorite, thumbnail, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&request.title)
    .bind(format!("{:?}", request.r#type))
    .bind(format!("{:?}", request.priority))
    .bind(format!("{:?}", request.status))
    .bind(request.story_points)
    .bind(&request.sprint)
    .bind(&request.epic)
    .bind(&request.description)
    .bind(&request.assignee)
    .bind(request.is_favorite.unwrap_or(false))
    .bind(&request.thumbnail)
    .bind(now.to_rfc3339())
    .bind(now.to_rfc3339())
    .execute(pool)
    .await?;

    // Save checklist items
    save_checklist_items(pool, &id, &request.acceptance_criteria, "acceptance_criteria").await?;
    save_checklist_items(pool, &id, &request.technical_tasks, "technical_tasks").await?;

    // Save dependencies and blocks
    save_task_relationships(pool, &id, &request.dependencies, "task_dependencies", "depends_on_task_id").await?;
    save_task_relationships(pool, &id, &request.blocks, "task_blocks", "blocks_task_id").await?;

    // Fetch and return the created task
    let task = get_task_by_id(pool, &id).await?.unwrap();
    Ok(task)
}

pub async fn update_task(pool: &DbPool, task_id: &str, request: &UpdateTaskRequest) -> Result<()> {
    let now = Utc::now();
    
    let mut update_fields = Vec::new();
    let mut params: Vec<Box<dyn sqlx::Encode<'_, Sqlite> + Send + 'static>> = Vec::new();

    if let Some(title) = &request.title {
        update_fields.push("title = ?");
        params.push(Box::new(title.clone()));
    }

    if let Some(task_type) = &request.r#type {
        update_fields.push("task_type = ?");
        params.push(Box::new(format!("{:?}", task_type)));
    }

    if let Some(priority) = &request.priority {
        update_fields.push("priority = ?");
        params.push(Box::new(format!("{:?}", priority)));
    }

    if let Some(status) = &request.status {
        update_fields.push("status = ?");
        params.push(Box::new(format!("{:?}", status)));
    }

    if let Some(story_points) = &request.story_points {
        update_fields.push("story_points = ?");
        params.push(Box::new(*story_points));
    }

    if let Some(description) = &request.description {
        update_fields.push("description = ?");
        params.push(Box::new(description.clone()));
    }

    update_fields.push("updated_at = ?");
    params.push(Box::new(now.to_rfc3339()));

    if !update_fields.is_empty() {
        // Simple update - in real implementation you'd build the query dynamically
        sqlx::query(
            "UPDATE tasks SET updated_at = ? WHERE id = ?"
        )
        .bind(now.to_rfc3339())
        .bind(task_id)
        .execute(pool)
        .await?;
    }

    Ok(())
}

pub async fn delete_task(pool: &DbPool, task_id: &str) -> Result<()> {
    sqlx::query("DELETE FROM tasks WHERE id = ?")
        .bind(task_id)
        .execute(pool)
        .await?;
    
    Ok(())
}

async fn get_checklist_items(
    pool: &DbPool,
    task_id: &str,
    item_type: &str,
) -> Result<Vec<ChecklistItem>> {
    let rows = sqlx::query(
        "SELECT id, text, completed FROM checklist_items 
         WHERE task_id = ? AND item_type = ? ORDER BY sort_order"
    )
    .bind(task_id)
    .bind(item_type)
    .fetch_all(pool)
    .await?;

    let mut items = Vec::new();
    for row in rows {
        items.push(ChecklistItem {
            id: Some(row.get::<String, _>("id")),
            text: row.get::<String, _>("text"),
            completed: row.get::<bool, _>("completed"),
        });
    }

    Ok(items)
}

async fn get_task_relationships(
    pool: &DbPool,
    task_id: &str,
    table_name: &str,
    column_name: &str,
) -> Result<Vec<String>> {
    let query = format!(
        "SELECT {} FROM {} WHERE task_id = ?",
        column_name, table_name
    );
    
    let rows = sqlx::query(&query)
        .bind(task_id)
        .fetch_all(pool)
        .await?;

    let mut relationships = Vec::new();
    for row in rows {
        relationships.push(row.get::<String, _>(column_name));
    }

    Ok(relationships)
}

async fn save_checklist_items(
    pool: &DbPool,
    task_id: &str,
    items: &[ChecklistItem],
    item_type: &str,
) -> Result<()> {
    // Delete existing items
    sqlx::query("DELETE FROM checklist_items WHERE task_id = ? AND item_type = ?")
        .bind(task_id)
        .bind(item_type)
        .execute(pool)
        .await?;

    // Insert new items
    for (index, item) in items.iter().enumerate() {
        let id = item.id.clone().unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        sqlx::query(
            "INSERT INTO checklist_items (id, task_id, item_type, text, completed, sort_order)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(id)
        .bind(task_id)
        .bind(item_type)
        .bind(&item.text)
        .bind(item.completed)
        .bind(index as i32)
        .execute(pool)
        .await?;
    }

    Ok(())
}

async fn save_task_relationships(
    pool: &DbPool,
    task_id: &str,
    related_ids: &[String],
    table_name: &str,
    column_name: &str,
) -> Result<()> {
    // Delete existing relationships
    let delete_query = format!("DELETE FROM {} WHERE task_id = ?", table_name);
    sqlx::query(&delete_query)
        .bind(task_id)
        .execute(pool)
        .await?;

    // Insert new relationships
    for related_id in related_ids {
        let id = uuid::Uuid::new_v4().to_string();
        let insert_query = format!(
            "INSERT INTO {} (id, task_id, {}) VALUES (?, ?, ?)",
            table_name, column_name
        );
        sqlx::query(&insert_query)
            .bind(&id)
            .bind(task_id)
            .bind(related_id)
            .execute(pool)
            .await?;
    }

    Ok(())
}

pub async fn get_task_count(pool: &DbPool) -> Result<u32> {
    let row = sqlx::query("SELECT COUNT(*) as count FROM tasks")
        .fetch_one(pool)
        .await?;
    
    Ok(row.get::<i64, _>("count") as u32)
}

pub async fn get_workspace_config(pool: &DbPool) -> Result<WorkspaceConfig> {
    let row = sqlx::query(
        "SELECT workspace_name, timezone, date_format, features, limits FROM workspace_config WHERE id = 1"
    )
    .fetch_one(pool)
    .await?;

    let features_json: String = row.get("features");
    let limits_json: String = row.get("limits");

    let features: WorkspaceFeatures = serde_json::from_str(&features_json)?;
    let limits: WorkspaceLimits = serde_json::from_str(&limits_json)?;

    Ok(WorkspaceConfig {
        workspace_name: row.get("workspace_name"),
        timezone: row.get("timezone"),
        date_format: row.get("date_format"),
        features,
        limits,
    })
}

// Analytics functions
pub async fn get_tasks_by_status(pool: &DbPool) -> Result<std::collections::HashMap<String, u32>> {
    let rows = sqlx::query("SELECT status, COUNT(*) as count FROM tasks GROUP BY status")
        .fetch_all(pool)
        .await?;
    
    let mut result = std::collections::HashMap::new();
    for row in rows {
        let status: String = row.get("status");
        let count: i64 = row.get("count");
        result.insert(status, count as u32);
    }
    
    Ok(result)
}

pub async fn get_tasks_by_type(pool: &DbPool) -> Result<std::collections::HashMap<String, u32>> {
    let rows = sqlx::query("SELECT task_type, COUNT(*) as count FROM tasks GROUP BY task_type")
        .fetch_all(pool)
        .await?;
    
    let mut result = std::collections::HashMap::new();
    for row in rows {
        let task_type: String = row.get("task_type");
        let count: i64 = row.get("count");
        result.insert(task_type, count as u32);
    }
    
    Ok(result)
}

pub async fn get_tasks_by_priority(pool: &DbPool) -> Result<std::collections::HashMap<String, u32>> {
    let rows = sqlx::query("SELECT priority, COUNT(*) as count FROM tasks GROUP BY priority")
        .fetch_all(pool)
        .await?;
    
    let mut result = std::collections::HashMap::new();
    for row in rows {
        let priority: String = row.get("priority");
        let count: i64 = row.get("count");
        result.insert(priority, count as u32);
    }
    
    Ok(result)
}

pub async fn get_average_story_points(pool: &DbPool) -> Result<f32> {
    let row = sqlx::query("SELECT AVG(CAST(story_points as REAL)) as avg_points FROM tasks WHERE story_points IS NOT NULL")
        .fetch_one(pool)
        .await?;
    
    Ok(row.get::<Option<f64>, _>("avg_points").unwrap_or(0.0) as f32)
}

pub async fn get_completion_rate(pool: &DbPool) -> Result<f32> {
    let total_row = sqlx::query("SELECT COUNT(*) as total FROM tasks")
        .fetch_one(pool)
        .await?;
    let total: i64 = total_row.get("total");
    
    if total == 0 {
        return Ok(0.0);
    }
    
    let completed_row = sqlx::query("SELECT COUNT(*) as completed FROM tasks WHERE status = 'Done'")
        .fetch_one(pool)
        .await?;
    let completed: i64 = completed_row.get("completed");
    
    Ok((completed as f32 / total as f32) * 100.0)
}

pub async fn get_active_sprints(pool: &DbPool) -> Result<Vec<String>> {
    let rows = sqlx::query("SELECT DISTINCT sprint FROM tasks WHERE sprint IS NOT NULL AND sprint != '' AND status != 'Done'")
        .fetch_all(pool)
        .await?;
    
    let mut sprints = Vec::new();
    for row in rows {
        let sprint: String = row.get("sprint");
        sprints.push(sprint);
    }
    
    Ok(sprints)
}

// Import/Export functions
pub async fn clear_all_tasks(pool: &DbPool) -> Result<()> {
    // Delete in correct order due to foreign key constraints
    sqlx::query("DELETE FROM task_dependencies").execute(pool).await?;
    sqlx::query("DELETE FROM task_blocks").execute(pool).await?;
    sqlx::query("DELETE FROM checklist_items").execute(pool).await?;
    sqlx::query("DELETE FROM tasks").execute(pool).await?;
    Ok(())
}

pub async fn get_all_tasks_for_export(pool: &DbPool) -> Result<Vec<Task>> {
    let params = TaskQueryParams::default();
    get_tasks(pool, &params).await
}