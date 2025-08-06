# Taskdown Backend

A Rust-based backend server for the Taskdown task management application, implementing the Remote Workspace API specification.

## Features

- RESTful API matching the [Remote Workspace API specification](../REMOTE_WORKSPACE_API.md)
- SQLite database with proper relationships and migrations
- CORS support for frontend integration
- Comprehensive task management (CRUD operations)
- User management and authentication
- Analytics and reporting endpoints
- Import/export functionality
- Activity logging and audit trails
- Bulk operations support

## Prerequisites

- Rust 1.70+ (install from [rustup.rs](https://rustup.rs/))
- SQLite (usually pre-installed on most systems)

## Quick Start

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies and run:**
   ```bash
   cargo run
   ```

3. **The server will start on port 3001:**
   ```
   Server running on http://0.0.0.0:3001
   ```

## API Endpoints

The backend implements all endpoints specified in the Remote Workspace API:

### Core Endpoints
- `GET /api/health` - Health check
- `POST /api/auth/verify` - Authentication verification
- `GET /api/auth/status` - Authentication status
- `GET /api/workspace` - Workspace information

### Task Management
- `GET /api/tasks` - List tasks (with filtering)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/bulk` - Bulk operations

### Import/Export
- `POST /api/import/markdown` - Import from Markdown
- `GET /api/export/markdown` - Export to Markdown

### Analytics
- `GET /api/analytics/summary` - Analytics summary
- `GET /api/analytics/burndown` - Burndown chart data

### User Management
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Configuration
- `GET /api/config` - Get workspace configuration
- `PUT /api/config` - Update configuration

### Activity Logging
- `GET /api/activity` - Get activity log

## Database

The backend uses SQLite for data storage with the following main tables:

- `tasks` - Task information and metadata
- `checklist_items` - Acceptance criteria and technical tasks
- `task_dependencies` - Task dependency relationships
- `task_blocks` - Task blocking relationships
- `users` - User accounts and profiles
- `activities` - Audit log of user actions
- `workspace_config` - Workspace configuration settings

The database is automatically created and migrated on first run.

## Development

### Project Structure
```
backend/
├── src/
│   ├── main.rs         # Server setup and routing
│   ├── models.rs       # Data structures and types
│   ├── handlers.rs     # HTTP request handlers
│   └── database.rs     # Database operations
├── Cargo.toml          # Dependencies and metadata
└── README.md          # This file
```

### Building for Production
```bash
cargo build --release
```

### Running Tests
```bash
cargo test
```

### Environment Variables
- `DATABASE_URL` - Database connection string (defaults to `sqlite:taskdown.db`)

## Integration with Frontend

The backend is designed to work seamlessly with the Taskdown React frontend. The frontend's `remoteClient.ts` can connect to this backend by configuring the base URL to `http://localhost:3001`.

Example frontend configuration:
```typescript
const client = new HttpRemoteWorkspaceClient('http://localhost:3001');
```

## API Response Format

All API responses follow a consistent format:
```json
{
  "success": boolean,
  "data": any,           // Present on success
  "error": {            // Present on failure
    "code": "string",
    "message": "string"
  }
}
```

## Authentication

The backend supports multiple authentication methods:
- API Key authentication
- Basic authentication  
- Bearer token authentication
- Custom header authentication

Currently implements a simple authentication system for development. In production, integrate with your preferred authentication provider.

## CORS Configuration

The backend includes CORS middleware configured to allow:
- All origins (customize for production)
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Content-Type and Authorization headers

## Error Handling

The API returns appropriate HTTP status codes:
- 200 OK - Successful requests
- 201 Created - Resource creation
- 400 Bad Request - Invalid request data
- 401 Unauthorized - Authentication required
- 404 Not Found - Resource not found
- 500 Internal Server Error - Server errors

## Performance

- SQLite database with proper indexing
- Connection pooling with sqlx
- Efficient query patterns
- Minimal memory overhead

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `cargo fmt` and `cargo clippy`
6. Submit a pull request

## License

This project follows the same license as the main Taskdown project.