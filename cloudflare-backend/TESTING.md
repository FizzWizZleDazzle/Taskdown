# Cloudflare Worker Backend Testing

This document describes the testing infrastructure for the Taskdown Cloudflare Worker backend.

## Test Types

### Unit Tests
- **Location**: `tests/` directory
- **Framework**: Rust built-in testing with `cargo test`
- **Coverage**: Core logic, models, authentication, AI functionality
- **Status**: ⚠️ Tests written but pending compilation fixes

### Integration Tests  
- **Location**: CI workflow and test scripts
- **Framework**: Wrangler + HTTP requests
- **Coverage**: HTTP endpoints, worker routes, end-to-end workflows
- **Status**: 🔧 Framework in place, tests to be implemented

### Linting & Formatting
- **Tools**: `cargo clippy`, `cargo fmt`
- **Coverage**: Code quality, style consistency
- **Status**: ✅ Configured and working

## Running Tests

### Local Development
```bash
cd cloudflare-backend

# Run all tests
npm test

# Run specific test types
npm run test:unit      # Unit tests
npm run test:check     # Compilation check
npm run test:format    # Format checking
npm run test:lint      # Linting
npm run validate       # Worker config validation
```

### CI/CD Pipeline
Tests automatically run on:
- Every push to `main` or `develop` branches
- Every pull request to `main` or `develop` branches

The CI pipeline includes:
1. **Frontend Tests** - TypeScript/React tests
2. **Backend Tests** - Rust unit tests
3. **Integration Tests** - Worker endpoint tests
4. **Linting** - Code quality checks

## Test Structure

### Unit Tests
```
tests/
├── models_test.rs        # API response models
├── auth_test.rs          # Authentication logic  
└── ai_test.rs           # AI request/response handling
```

### Test Dependencies
```toml
[dev-dependencies]
tokio-test = "0.4"        # Async testing utilities
mockall = "0.12"          # Mocking framework
wasm-bindgen-test = "0.3" # WASM testing support
```

## Current Status

### ✅ Completed
- Test infrastructure setup
- CI workflow integration
- Unit test framework
- Linting and formatting
- Test running scripts

### ⚠️ In Progress  
- Fixing compilation errors in main codebase
- Unit test execution (pending compilation fixes)

### 🔧 Planned
- HTTP endpoint integration tests
- Test coverage reporting
- Performance benchmarking
- Error handling validation

## Key Endpoints Tested

### Health & Status
- `GET /api/health` - Health check endpoint
- `GET /api/workspace` - Workspace information

### Authentication
- `POST /api/auth/verify` - Credential verification
- `GET /api/auth/status` - Session status check  
- `POST /api/auth/register` - User registration

### Task Management
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get specific task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### AI Features
- `POST /api/ai/generate-task` - AI task generation
- `POST /api/ai/acceptance-criteria` - AI acceptance criteria
- `POST /api/ai/estimate-story-points` - AI story point estimation

## Coverage Goals

- **Unit Tests**: >80% coverage of core logic
- **Integration Tests**: All major API endpoints
- **Error Handling**: Common error scenarios
- **Authentication**: All auth flows
- **AI Features**: Request/response validation

## Contributing

When adding new functionality:

1. **Write unit tests** for core logic
2. **Add integration tests** for new endpoints  
3. **Update CI pipeline** if needed
4. **Run full test suite** before submitting PR
5. **Ensure tests pass** in CI/CD

## Troubleshooting

### Compilation Errors
If tests fail to compile:
```bash
cd cloudflare-backend
cargo check  # See detailed error messages
cargo clippy # Get suggestions for fixes
```

### Test Failures
```bash
# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_name

# Run tests in single thread
cargo test -- --test-threads=1
```

### CI Failures
Check the GitHub Actions logs for:
- Compilation errors
- Test failures  
- Linting issues
- Configuration problems