# Authentication and Configuration Guide

## Authentication System

The Cloudflare Workers backend now implements a comprehensive authentication system with support for multiple authentication methods and proper session management.

### Supported Authentication Methods

1. **Username/Password Authentication**
   ```json
   {
     "credentials": {
       "type": "password",
       "username": "admin",
       "password": "admin123"
     }
   }
   ```

2. **API Key Authentication**
   ```json
   {
     "credentials": {
       "type": "api_key",
       "token": "your-api-key-here"
     }
   }
   ```

### Default User Accounts

For development purposes, the following accounts are available:
- **admin** / **admin123** (permissions: read, write, admin)
- **user** / **user123** (permissions: read, write)

### Session Management

- Sessions are valid for 24 hours by default
- Session tokens are returned upon successful authentication
- All API endpoints (except health and auth) require authentication
- Include session token in `Authorization: Bearer <token>` header

### Permission System

Three permission levels:
- **read**: View tasks and workspace information
- **write**: Create and modify tasks
- **admin**: Full administrative access

## CORS Origins Configuration

Origins are now managed through a configuration file system instead of allowing all origins.

### Configuration File

Located at `config/cors-origins.json`:

```json
{
  "development": [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080"
  ],
  "staging": [
    "https://taskdown-staging.example.com",
    "https://staging.taskdown.dev"
  ],
  "production": [
    "https://taskdown.example.com",
    "https://app.taskdown.dev"
  ]
}
```

### Environment-Based Origins

The system automatically selects appropriate origins based on the `ENVIRONMENT` variable:
- `development` (default): Uses localhost URLs
- `staging`: Uses staging domain URLs
- `production`: Uses production domain URLs

### Updating Origins

To add new allowed origins:

1. Edit `config/cors-origins.json`
2. Add your domain to the appropriate environment section
3. Redeploy the worker

## API Endpoints

All endpoints now require authentication except:
- `GET /api/health`
- `POST /api/auth/verify`
- `GET /api/auth/status`

### Authentication Flow

1. **Login**: POST to `/api/auth/verify` with credentials
2. **Get Session Info**: GET `/api/auth/status` with Bearer token
3. **Use APIs**: Include `Authorization: Bearer <token>` in all requests

### Example API Usage

```bash
# Login
curl -X POST https://your-worker.workers.dev/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "credentials": {
      "type": "password",
      "username": "admin",
      "password": "admin123"
    }
  }'

# Use returned token for API calls
curl -X GET https://your-worker.workers.dev/api/tasks \
  -H "Authorization: Bearer session_user_admin_1234567890"
```

## Security Considerations

### Production Setup

1. **Change Default Passwords**: Update the `verify_credentials` function with real user database
2. **Use Real JWT**: Replace simple token format with proper JWT implementation
3. **Secure Storage**: Store authentication secrets in Cloudflare environment variables
4. **API Keys**: Configure actual API keys in environment variables
5. **Database Integration**: Connect to real user database for credential verification

### Environment Variables

Set these in your Cloudflare Workers environment:

```bash
wrangler secret put JWT_SECRET
wrangler secret put API_KEYS
```

### Rate Limiting

Consider implementing rate limiting for authentication endpoints to prevent brute force attacks.

## Database Integration

The authentication system is designed to work with real database backends:

1. Replace hardcoded user verification with database queries
2. Store user permissions in database
3. Implement proper session storage
4. Add user management endpoints

## Migration from Previous Version

If upgrading from the previous version:

1. Update client applications to use new authentication format
2. Configure CORS origins for your domains
3. Test authentication flow with your frontend
4. Update any API integration to include Authorization headers

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check that your domain is listed in cors-origins.json
2. **Authentication Failures**: Verify credentials format matches expected structure
3. **Permission Denied**: Ensure user has required permissions for endpoint
4. **Token Expired**: Re-authenticate when session expires

### Debug Mode

Set `ENVIRONMENT=development` for verbose logging and relaxed CORS policies.