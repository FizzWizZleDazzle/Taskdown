#!/bin/bash

# Simple validation script for the Cloudflare backend
# This script validates the project structure and basic configuration

echo "🔍 Validating Cloudflare Backend Implementation..."

# Check if all required files exist
files=(
    "Cargo.toml"
    "wrangler.toml"
    "src/lib.rs"
    "src/models.rs"
    "src/handlers.rs"
    "src/database.rs"
    "README.md"
    "schema.sql"
    "package.json"
)

echo "📁 Checking required files..."
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        exit 1
    fi
done

echo ""
echo "🦀 Checking Rust compilation..."
if cargo check --quiet; then
    echo "✅ Rust code compiles successfully"
else
    echo "❌ Rust compilation failed"
    exit 1
fi

echo ""
echo "📦 Checking Cargo.toml configuration..."
if grep -q "worker = " Cargo.toml; then
    echo "✅ Worker dependency found"
else
    echo "❌ Worker dependency missing"
    exit 1
fi

echo ""
echo "☁️ Checking wrangler.toml configuration..."
if grep -q "name = \"taskdown-cloudflare-backend\"" wrangler.toml; then
    echo "✅ Worker name configured"
else
    echo "❌ Worker name not configured"
    exit 1
fi

if grep -q "d1_databases" wrangler.toml; then
    echo "✅ D1 database binding configured"
else
    echo "❌ D1 database binding missing"
    exit 1
fi

echo ""
echo "🎯 Checking API endpoints in handlers..."
required_handlers=(
    "health_handler"
    "auth_verify_handler"
    "workspace_info_handler"
    "tasks_list_handler"
    "tasks_create_handler"
    "tasks_get_handler"
    "tasks_update_handler"
    "tasks_delete_handler"
)

for handler in "${required_handlers[@]}"; do
    if grep -q "$handler" src/handlers.rs; then
        echo "✅ $handler implemented"
    else
        echo "❌ $handler missing"
        exit 1
    fi
done

echo ""
echo "🗄️ Checking database schema..."
if grep -q "CREATE TABLE.*tasks" schema.sql; then
    echo "✅ Tasks table schema found"
else
    echo "❌ Tasks table schema missing"
    exit 1
fi

echo ""
echo "📋 Checking data models..."
required_models=(
    "struct Task"
    "struct ApiResponse"
    "enum TaskType"
    "enum Priority"
    "enum TaskStatus"
)

for model in "${required_models[@]}"; do
    if grep -q "$model" src/models.rs; then
        echo "✅ $model defined"
    else
        echo "❌ $model missing"
        exit 1
    fi
done

echo ""
echo "🎉 All validations passed! Cloudflare backend is properly implemented."
echo ""
echo "🚀 To deploy:"
echo "   wrangler login"
echo "   wrangler d1 create taskdown-db"
echo "   # Update wrangler.toml with your database ID"
echo "   wrangler deploy"