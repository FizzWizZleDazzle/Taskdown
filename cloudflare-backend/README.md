# Taskdown Cloudflare Backend

A Cloudflare Workers implementation of the Taskdown backend API, built with Rust using the `worker` crate. This provides the same Remote Workspace API as the main backend but runs on Cloudflare's edge computing platform.

## Features

- **Serverless**: Runs on Cloudflare Workers for global distribution and zero-downtime
- **Fast**: Deployed to Cloudflare's edge network for low-latency responses
- **Scalable**: Automatically scales based on demand
- **Database**: Uses Cloudflare D1 (SQLite-compatible) for data storage
- **API Compatible**: Implements the same Remote Workspace API as the main backend
- **Real Authentication**: JWT-based session management with multiple auth methods
- **Secure CORS**: Environment-based origins configuration from file
- **Permission System**: Role-based access control for API endpoints

## Architecture

- **Runtime**: Cloudflare Workers (V8 isolates)
- **Language**: Rust with `worker` crate
- **Database**: Cloudflare D1 (SQLite)
- **Deployment**: Wrangler CLI
- **API**: RESTful JSON API matching the Remote Workspace specification

## Prerequisites

- Rust 1.70+ (install from [rustup.rs](https://rustup.rs/))
- Node.js 16+ (for Wrangler CLI)
- Cloudflare account with Workers and D1 enabled
- Wrangler CLI: `npm install -g wrangler`

## Quick Start

### 1. Setup Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Create a D1 database
wrangler d1 create taskdown-db
```

### 2. Configure Database

Update `wrangler.toml` with your database ID from the previous step:

```toml
[[d1_databases]]
binding = "DB"
database_name = "taskdown-db"
database_id = "your-database-id-here"  # Replace with actual ID
```

### 3. Deploy

```bash
cd cloudflare-backend

# Install worker-build if not already installed
cargo install worker-build

# Deploy to Cloudflare
wrangler deploy
```

### 4. Test

```bash
# Test health endpoint
curl https://your-worker.your-subdomain.workers.dev/api/health

# Test workspace info
curl https://your-worker.your-subdomain.workers.dev/api/workspace
```

## Development

### Local Development

```bash
# Install dependencies
npm install -g wrangler

# Start local development server
wrangler dev
```

The worker will be available at `http://localhost:8787`.

### Building

```bash
# Build the worker
wrangler build

# Or use cargo directly
cargo build --target wasm32-unknown-unknown
```

### Database Management

```bash
# Execute SQL against your D1 database
wrangler d1 execute taskdown-db --command "SELECT * FROM tasks;"

# Run migrations (if you have SQL files)
wrangler d1 execute taskdown-db --file schema.sql
```

## API Endpoints

The Cloudflare backend implements all endpoints from the Remote Workspace API with authentication required for most endpoints.

### Authentication Required

All endpoints except health check and authentication endpoints require a valid session token in the `Authorization: Bearer <token>` header.

**See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed authentication setup and usage.**

### Core Endpoints
- `GET /api/health` - Health check (no auth required)
- `POST /api/auth/verify` - Authentication verification (no auth required)
- `GET /api/auth/status` - Authentication status (no auth required)
- `GET /api/workspace` - Workspace information (requires: read)

### Task Management
- `GET /api/tasks` - List tasks with filtering (requires: read)
- `POST /api/tasks` - Create new task (requires: write)
- `GET /api/tasks/:id` - Get specific task (requires: read)
- `PUT /api/tasks/:id` - Update task (requires: write)
- `DELETE /api/tasks/:id` - Delete task (requires: write)
- `POST /api/tasks/bulk` - Bulk operations (requires: write)

### Import/Export
- `POST /api/import/markdown` - Import from Markdown (requires: write)
- `GET /api/export/markdown` - Export to Markdown (requires: read)

### Analytics
- `GET /api/analytics/summary` - Analytics summary (requires: read)
- `GET /api/analytics/burndown` - Burndown chart data (requires: read)

### User Management
- `GET /api/users` - List users (requires: admin)
- `POST /api/users` - Create user (requires: admin)
- `PUT /api/users/:id` - Update user (requires: admin)
- `DELETE /api/users/:id` - Delete user (requires: admin)

### Configuration
- `GET /api/config` - Get workspace configuration (requires: read)
- `PUT /api/config` - Update configuration (requires: admin)

### Activity Logging
- `GET /api/activity` - Get activity log (requires: read)

## Database Schema

The D1 database uses the following tables:

- `tasks` - Main task information
- `checklist_items` - Acceptance criteria and technical tasks
- `task_dependencies` - Task dependency relationships
- `task_blocks` - Task blocking relationships
- `users` - User accounts
- `activities` - Activity/audit log
- `workspace_config` - Workspace configuration

Tables are automatically created when the worker starts.

## Configuration

### Environment Variables

Configure in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"
LOG_LEVEL = "info"
```

### Database Binding

```toml
[[d1_databases]]
binding = "DB"
database_name = "taskdown-db"
database_id = "your-database-id"
```

### Multiple Environments

```toml
[env.staging]
vars = { ENVIRONMENT = "staging" }

[[env.staging.d1_databases]]
binding = "DB"
database_name = "taskdown-db-staging"
database_id = "your-staging-db-id"

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "taskdown-db-prod"
database_id = "your-prod-db-id"
```

Deploy to specific environments:

```bash
wrangler deploy --env staging
wrangler deploy --env production
```

## Integration with Frontend

Configure the Taskdown React frontend to use the Cloudflare backend:

```typescript
// In your frontend configuration
const client = new HttpRemoteWorkspaceClient('https://your-worker.your-subdomain.workers.dev');
```

## Performance

- **Cold Start**: ~10-50ms (V8 isolate startup)
- **Warm Requests**: ~1-5ms (sub-millisecond in many cases)
- **Global Distribution**: Runs on 200+ Cloudflare edge locations
- **Concurrency**: Handles thousands of concurrent requests per worker
- **Database**: D1 provides single-digit millisecond query performance

## Monitoring

Monitor your worker through:

- **Cloudflare Dashboard**: Real-time metrics and logs
- **Wrangler**: `wrangler tail` for live logs
- **Analytics**: Built-in Cloudflare Workers Analytics

```bash
# View live logs
wrangler tail

# View analytics
wrangler analytics
```

## Continuous Integration

This backend includes comprehensive CI workflow checks that run automatically on pull requests and commits. The CI pipeline ensures code quality, security, and deployment readiness.

### CI Workflow Features

The GitHub Actions workflow (`.github/workflows/cloudflare-worker-ci.yml`) includes:

- **Code Quality Checks**:
  - Rust formatting verification (`cargo fmt`)
  - Linting with Clippy (`cargo clippy`)
  - Compilation validation (`cargo check`)

- **Security Auditing**:
  - Dependency vulnerability scanning (`cargo audit`)
  - Security best practices validation

- **Configuration Validation**:
  - Wrangler.toml structure verification
  - Project structure and API endpoint validation
  - Build process verification

### Running CI Checks Locally

```bash
# Format code
cargo fmt

# Check formatting
cargo fmt --check

# Run linting
cargo clippy --all-targets --all-features

# Check compilation
cargo check

# Security audit
cargo install cargo-audit
cargo audit

# Full project validation
./validate.sh
```

For detailed CI workflow documentation, see [CI_WORKFLOW.md](./CI_WORKFLOW.md).

## Deployment

### Production Deployment

1. **Configure Custom Domain** (optional):
   ```bash
   wrangler route add "api.yourdomain.com/*" your-worker
   ```

2. **Set Production Environment**:
   ```bash
   wrangler deploy --env production
   ```

3. **Monitor Deployment**:
   ```bash
   wrangler tail --env production
   ```

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Deploy Cloudflare Worker

on:
  push:
    branches: [main]
    paths: ['cloudflare-backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Wrangler
        run: npm install -g wrangler
      - name: Deploy
        run: wrangler deploy --env production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Ensure D1 database is created and ID is correct in `wrangler.toml`
   - Check that database binding name matches (`DB`)

2. **CORS Issues**:
   - Verify CORS headers are properly set in the worker
   - Check that origin is allowed in CORS configuration

3. **Build Errors**:
   - Ensure `worker-build` is installed: `cargo install worker-build`
   - Check Rust version compatibility

4. **Deployment Failures**:
   - Verify Wrangler authentication: `wrangler whoami`
   - Check account permissions for Workers and D1

### Debugging

```bash
# View worker logs
wrangler tail

# Test locally
wrangler dev

# Check configuration
wrangler config

# Validate wrangler.toml
wrangler validate
```

## Security and Configuration

### Authentication and CORS

- **Real Authentication**: JWT-based session management with username/password and API key support
- **Permission System**: Role-based access control (read, write, admin)
- **Secure CORS**: Environment-based origins loaded from configuration file
- **Session Management**: 24-hour session expiration with proper token validation

For detailed authentication setup, see [AUTHENTICATION.md](./AUTHENTICATION.md).

### Production Security

- **Authentication**: Implement proper auth verification for production
- **Rate Limiting**: Consider adding rate limiting for public APIs  
- **Input Validation**: All inputs are validated and sanitized
- **SQL Injection**: Uses parameterized queries to prevent SQL injection
- **CORS**: Configured for secure cross-origin requests with file-based origins
- **Environment Variables**: Store secrets in Cloudflare environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the `cloudflare-backend` directory
4. Test locally with `wrangler dev`
5. Format code with `cargo fmt`
6. Run tests with `cargo test`
7. Submit a pull request

## License

This project follows the same license as the main Taskdown project.

## Support

- **Documentation**: [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- **D1 Documentation**: [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- **Worker Rust**: [workers-rs](https://github.com/cloudflare/workers-rs)
- **Issues**: Report issues in the main Taskdown repository