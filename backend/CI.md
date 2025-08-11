# Backend CI Documentation

## Overview

The backend CI workflow (`backend-ci.yml`) provides comprehensive continuous integration checks for the Taskdown regular backend service (located in the `/backend` directory). This workflow ensures code quality, security, and reliability through automated checks.

## Workflow Triggers

The workflow runs on:
- **Push events** to `main` and `develop` branches (when backend files change)
- **Pull request events** targeting `main` and `develop` branches (when backend files change)

### Path Filtering

The workflow is optimized to only run when relevant files change:
- `backend/**` - Any file in the backend directory
- `.github/workflows/backend-ci.yml` - The workflow file itself

## Jobs

### 1. Check and Lint (`check`)

Performs static analysis and code quality checks:

- **Rust Compilation Check**: Verifies the code compiles without errors using `cargo check`
- **Code Formatting**: Ensures consistent code formatting with `cargo fmt --check`
- **Linting**: Runs Clippy static analysis with `cargo clippy` to catch common mistakes and improve code quality

**Allowed Warnings**: The workflow currently allows certain warnings to accommodate the developing codebase:
- `dead_code` - Unused code (common in development)
- `unused_variables` - Unused variables (temporary during development)
- `unused_imports` - Unused imports (temporary during development)

### 2. Test (`test`)

Executes the test suite:

- **Unit Tests**: Runs all unit and integration tests with `cargo test`
- **Documentation Tests**: Executes code examples in documentation with `cargo test --doc`

**Note**: The current backend doesn't have tests yet, so this job primarily validates the test infrastructure.

### 3. Security Audit (`security`)

Performs security vulnerability scanning:

- **Dependency Audit**: Uses `cargo audit` to check for known security vulnerabilities in dependencies
- **Advisory Database**: Automatically updates and checks against the RustSec Advisory Database

### 4. Build (`build`)

Validates production build:

- **Release Build**: Compiles the backend in release mode with optimizations
- **Artifact Upload**: Stores the compiled binary as a workflow artifact for 1 day
- **All Features**: Ensures all feature flags work correctly

## Performance Optimizations

### Caching Strategy

The workflow uses intelligent caching to reduce build times:

- **Cargo Registry Cache**: Caches downloaded crates and registry index
- **Build Cache**: Caches compiled dependencies in `target/` directory
- **Job-Specific Keys**: Different cache keys for different job types to optimize efficiency

### Parallel Execution

All jobs run in parallel when possible, reducing total workflow time.

## Prerequisites

### Rust Toolchain

The workflow uses the latest stable Rust toolchain with required components:
- `rustfmt` for code formatting
- `clippy` for linting

### Required Tools

- `cargo-audit` for security auditing (automatically installed during workflow)

## Usage

### Running Locally

You can run the same checks locally before pushing:

```bash
# Navigate to backend directory
cd backend

# Check compilation
cargo check --all-targets --all-features

# Check formatting
cargo fmt --all -- --check

# Run linting (with same settings as CI)
cargo clippy --all-targets --all-features -- -D warnings -A dead_code -A unused_variables -A unused_imports

# Run tests
cargo test --all-features --bins

# Run security audit (requires cargo-audit installation)
cargo audit

# Build release
cargo build --release --all-features
```

### Installing Tools Locally

```bash
# Install cargo-audit for security checking
cargo install cargo-audit
```

## Configuration

### Environment Variables

- `CARGO_TERM_COLOR=always`: Enables colored output in CI logs
- `RUST_BACKTRACE=1`: Provides detailed error backtraces for debugging

### Customization

To modify the workflow:

1. **Adjust Warning Levels**: Edit the clippy command in the `check` job
2. **Add New Checks**: Add additional steps to existing jobs
3. **Change Triggers**: Modify the `on` section to change when the workflow runs
4. **Update Rust Version**: Change the toolchain in the `rust-toolchain` action

## Troubleshooting

### Common Issues

1. **Formatting Failures**: Run `cargo fmt` locally to fix formatting issues
2. **Clippy Warnings**: Address linting issues or adjust allowed warnings
3. **Compilation Errors**: Ensure all dependencies are correctly specified in `Cargo.toml`
4. **Security Vulnerabilities**: Update dependencies or review security advisories

### Debugging Workflow Issues

- Check workflow logs in the GitHub Actions tab
- Run commands locally using the same parameters
- Verify cache keys if builds are unexpectedly slow

## Contributing

When contributing to the backend:

1. Ensure your code passes all CI checks locally before pushing
2. Write tests for new functionality (when test infrastructure is established)
3. Update documentation if you add new dependencies or change build requirements
4. Follow Rust coding conventions and respond to clippy suggestions

## Future Improvements

Planned enhancements:
- Add code coverage reporting
- Implement benchmark testing
- Add integration tests with database
- Enhanced security scanning with additional tools
- Performance regression testing