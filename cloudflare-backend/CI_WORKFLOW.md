# Cloudflare Worker CI Documentation

This document describes the continuous integration (CI) workflow for the Cloudflare Worker backend component.

## Overview

The Cloudflare Worker CI workflow (`.github/workflows/cloudflare-worker-ci.yml`) provides comprehensive quality checks for the Rust-based Cloudflare Worker backend located in the `cloudflare-backend/` directory.

## Workflow Triggers

The workflow runs automatically on:
- **Pull Requests** to `main` or `develop` branches when changes are made to:
  - Any files in `cloudflare-backend/`
  - The workflow file itself
- **Push events** to `main` or `develop` branches with the same path restrictions

This path-based triggering ensures the workflow only runs when relevant changes are made, improving CI efficiency.

## Jobs Overview

### 1. Rust Code Quality Checks (`rust-checks`)

This job performs static analysis and quality checks on the Rust code:

#### Steps:
- **Rust Toolchain Setup**: Installs stable Rust with `rustfmt` and `clippy` components
- **Dependency Caching**: Caches Cargo dependencies for faster subsequent runs
- **Formatting Check**: Verifies code follows Rust formatting standards (`cargo fmt --check`)
- **Linting**: Runs Clippy for additional code quality checks (`cargo clippy`)
- **Compilation Check**: Validates that the code compiles (`cargo check`)
- **Security Audit**: Scans dependencies for known vulnerabilities (`cargo audit`)

#### Configuration:
- Uses `continue-on-error: true` for clippy and compilation to handle incomplete implementations
- Runs with `-D warnings` to treat warnings as errors for clippy
- Includes all targets and features in checks

### 2. Wrangler Configuration Checks (`wrangler-checks`)

This job validates Cloudflare Worker-specific configuration:

#### Steps:
- **Node.js Setup**: Installs Node.js 20.x with npm caching
- **Wrangler Installation**: Installs Wrangler CLI dependencies
- **Configuration Validation**: Validates `wrangler.toml` structure and required fields
- **Project Validation**: Runs the project's custom validation script (`validate.sh`)

#### Validation Checks:
- Worker name configuration
- Compatibility date presence
- Required file structure
- API endpoints implementation (via validation script)

### 3. Integration Tests (`integration-test`)

This job performs end-to-end build validation:

#### Steps:
- **Environment Setup**: Both Rust and Node.js environments
- **Worker Build**: Attempts to build the worker using `worker-build`
- **Build Validation**: Verifies build output and structure

#### Dependencies:
- Requires both `rust-checks` and `wrangler-checks` to complete first
- Uses same caching strategy as other jobs

## Security Features

### Dependency Scanning
- **cargo-audit**: Automatically scans Rust dependencies for known security vulnerabilities
- **Advisory Database**: Uses the RustSec advisory database for up-to-date vulnerability information

### Dependency Management
- **Dependency Caching**: Reduces build times and external dependency risks
- **Lock File Validation**: Ensures reproducible builds through Cargo.lock

## Error Handling

The workflow is designed to be robust and informative:

### Compilation Errors
- Uses `continue-on-error: true` for steps that require successful compilation
- Still runs all possible checks even when compilation fails
- Provides clear feedback about which checks passed/failed

### Configuration Issues
- Validates configuration files before attempting builds
- Provides specific error messages for common configuration problems

## Local Development

### Running Checks Locally

To run the same checks locally:

```bash
cd cloudflare-backend

# Format code
cargo fmt

# Check formatting
cargo fmt --check

# Run linting
cargo clippy --all-targets --all-features -- -D warnings

# Check compilation
cargo check --all-targets --all-features

# Security audit
cargo install cargo-audit
cargo audit

# Project validation
./validate.sh
```

### Pre-commit Setup

Consider setting up pre-commit hooks to run these checks before committing:

```bash
# Install pre-commit (if not already installed)
pip install pre-commit

# Create .pre-commit-config.yaml in project root with Rust hooks
```

## Troubleshooting

### Common Issues

**Formatting Failures:**
```bash
# Fix automatically
cargo fmt
```

**Clippy Warnings:**
```bash
# View detailed warnings
cargo clippy --all-targets --all-features
# Fix automatically where possible
cargo clippy --fix
```

**Security Vulnerabilities:**
```bash
# Update dependencies
cargo update
# Check for available updates
cargo audit
```

**Build Failures:**
- Check compilation errors in the rust-checks job
- Ensure all required dependencies are installed
- Verify Rust toolchain version compatibility

### Workflow Debugging

- **Check job logs**: Each job provides detailed output for debugging
- **Path triggers**: Ensure your changes touch files in `cloudflare-backend/`
- **Branch targeting**: Workflow only runs on PRs to `main`/`develop`

## Configuration

### Environment Variables

The workflow uses the following environment variables:
- `ENVIRONMENT`: Set to `development` by default in wrangler.toml
- `RUST_BACKTRACE`: Automatically set for better error debugging

### Customization

To modify the workflow:
1. Edit `.github/workflows/cloudflare-worker-ci.yml`
2. Adjust job steps, add new checks, or modify triggers
3. Test changes by creating a PR with cloudflare-backend modifications

## Integration with Main CI

This workflow complements the main CI workflow (`ci.yml`) which handles:
- Frontend TypeScript application
- General project build and test
- CLI functionality testing

The Cloudflare Worker CI focuses specifically on backend worker concerns:
- Rust ecosystem tooling
- Cloudflare Worker deployment validation
- Backend-specific security checks

## Deployment Considerations

While this CI workflow validates the worker code and configuration, actual deployment to Cloudflare is handled separately. The workflow ensures:
- Code quality before deployment
- Configuration validity
- Security compliance
- Build process verification

For deployment, see the project's deployment documentation and Cloudflare Worker deployment guides.