-- Database schema for Cloudflare D1
-- This file can be executed with: wrangler d1 execute taskdown-db --file schema.sql

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    task_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    story_points INTEGER,
    sprint TEXT,
    epic TEXT,
    description TEXT NOT NULL,
    assignee TEXT,
    is_favorite BOOLEAN,
    thumbnail TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Checklist items (acceptance criteria and technical tasks)
CREATE TABLE IF NOT EXISTS checklist_items (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    item_type TEXT NOT NULL, -- 'acceptance_criteria' or 'technical_tasks'
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

-- Task dependencies
CREATE TABLE IF NOT EXISTS task_dependencies (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    depends_on_task_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

-- Task blocks
CREATE TABLE IF NOT EXISTS task_blocks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    blocks_task_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks (id) ON DELETE CASCADE,
    FOREIGN KEY (blocks_task_id) REFERENCES tasks (id) ON DELETE CASCADE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Activity log
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    details TEXT NOT NULL, -- JSON string
    timestamp TEXT NOT NULL
);

-- Workspace configuration
CREATE TABLE IF NOT EXISTS workspace_config (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    default_task_type TEXT NOT NULL,
    available_statuses TEXT NOT NULL, -- JSON array
    available_priorities TEXT NOT NULL, -- JSON array
    enable_story_points BOOLEAN NOT NULL DEFAULT TRUE,
    enable_sprints BOOLEAN NOT NULL DEFAULT TRUE,
    enable_epics BOOLEAN NOT NULL DEFAULT TRUE,
    theme TEXT NOT NULL DEFAULT 'default',
    updated_at TEXT NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint ON tasks(sprint);
CREATE INDEX IF NOT EXISTS idx_tasks_epic ON tasks(epic);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_checklist_items_task_id ON checklist_items(task_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_type ON checklist_items(item_type);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);

CREATE INDEX IF NOT EXISTS idx_task_blocks_task_id ON task_blocks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_blocks_blocks ON task_blocks(blocks_task_id);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_resource ON activities(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);

-- Insert default workspace configuration
INSERT OR IGNORE INTO workspace_config (
    id,
    name,
    description,
    default_task_type,
    available_statuses,
    available_priorities,
    enable_story_points,
    enable_sprints,
    enable_epics,
    theme,
    updated_at
) VALUES (
    'default',
    'Taskdown Cloudflare Workspace',
    'A Cloudflare Workers-based workspace for Taskdown',
    'Task',
    '["Todo", "InProgress", "InReview", "Done"]',
    '["Critical", "High", "Medium", "Low"]',
    TRUE,
    TRUE,
    TRUE,
    'default',
    datetime('now')
);

-- Insert default admin user
INSERT OR IGNORE INTO users (
    id,
    username,
    display_name,
    email,
    role,
    active,
    created_at,
    updated_at
) VALUES (
    'admin',
    'admin',
    'Administrator',
    'admin@example.com',
    'admin',
    TRUE,
    datetime('now'),
    datetime('now')
);