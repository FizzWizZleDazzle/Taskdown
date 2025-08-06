# Remote Workspace API Specification

This document defines the API endpoints required to implement remote workspace functionality for Taskdown. These endpoints should be implemented by the remote server to enable full workspace synchronization.

## Base URL
All endpoints are relative to the configured workspace base URL (e.g., `https://api.taskdown.example.com` or `http://192.168.1.100:3000`)

## Authentication
The API supports custom verification mechanisms. Common patterns include:
- **API Key**: `Authorization: Bearer <api-key>`
- **Basic Auth**: `Authorization: Basic <base64-encoded-credentials>`
- **Custom Headers**: `X-Auth-Token: <token>` or custom header schemes
- **JWT**: `Authorization: Bearer <jwt-token>`

## Response Format
All responses should be in JSON format with consistent error handling:

```json
{
  "success": boolean,
  "data": any,
  "error": {
    "code": string,
    "message": string
  }
}
```

## Endpoints

### 1. Workspace Information

#### GET `/api/workspace`
Get workspace metadata and connection information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string", 
    "description": "string",
    "serverVersion": "string",
    "capabilities": ["sync", "realtime", "auth"],
    "lastUpdated": "ISO8601 datetime"
  }
}
```

### 2. Authentication & Connection

#### POST `/api/auth/verify`
Verify credentials and establish connection.

**Request:**
```json
{
  "credentials": {
    "type": "api-key" | "basic" | "custom",
    "token": "string",
    "username": "string", // for basic auth
    "password": "string", // for basic auth
    "customHeaders": { "key": "value" } // for custom auth
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "sessionToken": "string", // if session-based
    "expiresAt": "ISO8601 datetime",
    "permissions": ["read", "write", "admin"]
  }
}
```

#### GET `/api/auth/status`
Check authentication status and session validity.

**Response:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "expiresAt": "ISO8601 datetime",
    "permissions": ["read", "write", "admin"]
  }
}
```

### 3. Task Management

#### GET `/api/tasks`
Retrieve all tasks in the workspace.

**Query Parameters:**
- `lastSync`: ISO8601 datetime for incremental sync
- `epic`: Filter by epic ID
- `status`: Filter by status
- `assignee`: Filter by assignee

**Response:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "string",
        "title": "string",
        "type": "Epic" | "Story" | "Task" | "Bug",
        "priority": "Critical" | "High" | "Medium" | "Low", 
        "status": "Todo" | "In Progress" | "In Review" | "Done",
        "storyPoints": number,
        "sprint": "string",
        "epic": "string",
        "description": "string",
        "acceptanceCriteria": [
          {
            "id": "string",
            "text": "string",
            "completed": boolean
          }
        ],
        "technicalTasks": [
          {
            "id": "string", 
            "text": "string",
            "completed": boolean
          }
        ],
        "dependencies": ["string"],
        "blocks": ["string"],
        "assignee": "string",
        "isFavorite": boolean,
        "thumbnail": "string",
        "createdAt": "ISO8601 datetime",
        "updatedAt": "ISO8601 datetime"
      }
    ],
    "lastSync": "ISO8601 datetime"
  }
}
```

#### POST `/api/tasks`
Create a new task.

**Request:**
```json
{
  "title": "string",
  "type": "Epic" | "Story" | "Task" | "Bug",
  "priority": "Critical" | "High" | "Medium" | "Low",
  "status": "Todo" | "In Progress" | "In Review" | "Done",
  "storyPoints": number,
  "sprint": "string",
  "epic": "string", 
  "description": "string",
  "acceptanceCriteria": [
    {
      "text": "string",
      "completed": boolean
    }
  ],
  "technicalTasks": [
    {
      "text": "string",
      "completed": boolean
    }
  ],
  "dependencies": ["string"],
  "blocks": ["string"],
  "assignee": "string",
  "isFavorite": boolean,
  "thumbnail": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "createdAt": "ISO8601 datetime",
    "updatedAt": "ISO8601 datetime"
  }
}
```

#### PUT `/api/tasks/:id`
Update an existing task.

**Request:** Same as POST `/api/tasks` but all fields optional

**Response:**
```json
{
  "success": true,
  "data": {
    "updatedAt": "ISO8601 datetime"
  }
}
```

#### DELETE `/api/tasks/:id`
Delete a task.

**Response:**
```json
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

### 4. Bulk Operations

#### POST `/api/tasks/bulk`
Perform bulk operations on tasks.

**Request:**
```json
{
  "operations": [
    {
      "type": "create" | "update" | "delete",
      "taskId": "string", // for update/delete
      "data": {} // task data for create/update
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "operation": "create" | "update" | "delete",
        "taskId": "string",
        "success": boolean,
        "error": "string" // if success is false
      }
    ]
  }
}
```

### 5. Import/Export

#### POST `/api/import/markdown`
Import tasks from Markdown format.

**Request:**
```json
{
  "markdown": "string",
  "options": {
    "overwrite": boolean,
    "preserveIds": boolean
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "imported": number,
    "updated": number,
    "errors": ["string"]
  }
}
```

#### GET `/api/export/markdown`
Export all tasks to Markdown format.

**Response:**
```json
{
  "success": true,
  "data": {
    "markdown": "string",
    "filename": "string"
  }
}
```

### 6. Real-time Synchronization (Optional)

#### WebSocket `/ws/sync`
Real-time synchronization for collaborative editing.

**Connection:**
- URL: `ws://host:port/ws/sync` or `wss://host:port/ws/sync`
- Authentication: Via query parameter `?token=<auth-token>` or header

**Message Format:**
```json
{
  "type": "task-updated" | "task-created" | "task-deleted",
  "data": {
    "taskId": "string",
    "task": {}, // full task object for create/update
    "userId": "string",
    "timestamp": "ISO8601 datetime"
  }
}
```

### 7. Health & Status

#### GET `/api/health`
Check server health and status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy" | "degraded" | "unhealthy",
    "version": "string",
    "uptime": number,
    "connections": number
  }
}
```

## Error Codes

Common error codes that should be handled:

- `AUTH_REQUIRED`: Authentication required
- `AUTH_INVALID`: Invalid credentials
- `AUTH_EXPIRED`: Session expired
- `PERMISSION_DENIED`: Insufficient permissions
- `TASK_NOT_FOUND`: Task not found
- `VALIDATION_ERROR`: Invalid request data
- `SERVER_ERROR`: Internal server error
- `RATE_LIMITED`: Too many requests
- `WORKSPACE_UNAVAILABLE`: Workspace temporarily unavailable

## Implementation Notes

1. **Incremental Sync**: Use `lastSync` parameter to implement efficient incremental synchronization
2. **Conflict Resolution**: Server should handle conflicts using "last write wins" or implement custom conflict resolution
3. **Rate Limiting**: Implement appropriate rate limiting to prevent abuse
4. **Caching**: Client should cache responses and handle offline scenarios
5. **CORS**: Ensure proper CORS headers for browser-based clients
6. **Compression**: Support gzip compression for large responses
7. **Pagination**: For large datasets, implement pagination on GET endpoints

## Security Considerations

1. **HTTPS**: Use HTTPS in production environments
2. **Input Validation**: Validate all input data
3. **SQL Injection**: Use parameterized queries
4. **XSS Prevention**: Sanitize user input
5. **CSRF Protection**: Implement CSRF tokens if using cookie-based authentication
6. **Rate Limiting**: Prevent brute force and DoS attacks