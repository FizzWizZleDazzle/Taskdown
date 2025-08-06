import { HttpRemoteWorkspaceClient } from '../remoteClient';
import { createWorkspaceDataService } from '../workspaceService';
import { Workspace, Task, AuthConfig } from '../types';

// Mock fetch and AbortSignal for testing
global.fetch = jest.fn();

// Mock AbortSignal.timeout to prevent actual timeouts in tests
if (!global.AbortSignal.timeout) {
  global.AbortSignal.timeout = jest.fn().mockReturnValue({
    aborted: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  });
}

const mockBaseUrl = 'https://api.test.com';
const mockAuthConfig: AuthConfig = {
  type: 'api-key',
  token: 'test-token'
};

describe('Remote Workspace Client', () => {
  let client: HttpRemoteWorkspaceClient;

  beforeEach(() => {
    client = new HttpRemoteWorkspaceClient(mockBaseUrl, mockAuthConfig, { timeout: 1000, retryAttempts: 1 });
    jest.clearAllMocks();
  });

  it('should create client with correct configuration', () => {
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(HttpRemoteWorkspaceClient);
  });

  it('should handle connection status', () => {
    const status = client.getConnectionStatus();
    expect(status).toEqual({
      connected: false,
      authenticated: false
    });
  });

  it('should make authenticated requests with API key', async () => {
    const mockResponse = {
      success: true,
      data: { status: 'healthy', version: '1.0.0' }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    await client.checkHealth();

    expect(fetch).toHaveBeenCalledWith(
      `${mockBaseUrl}/api/health`,
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('should handle basic auth configuration', () => {
    const basicAuthConfig: AuthConfig = {
      type: 'basic',
      username: 'user',
      password: 'pass'
    };

    const basicClient = new HttpRemoteWorkspaceClient(mockBaseUrl, basicAuthConfig);
    expect(basicClient).toBeDefined();
  });

  it('should handle custom headers configuration', () => {
    const customAuthConfig: AuthConfig = {
      type: 'custom',
      customHeaders: {
        'X-API-Key': 'custom-key',
        'X-User-ID': '123'
      }
    };

    const customClient = new HttpRemoteWorkspaceClient(mockBaseUrl, customAuthConfig);
    expect(customClient).toBeDefined();
  });
});

describe('Workspace Data Service', () => {
  it('should create local workspace service', () => {
    const localWorkspace: Workspace = {
      id: 'LOCAL',
      name: 'Local Test',
      type: 'local',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const service = createWorkspaceDataService(localWorkspace);
    expect(service).toBeDefined();
    expect(service.isRemote()).toBe(false);
  });

  it('should create remote workspace service', () => {
    const remoteWorkspace: Workspace = {
      id: 'REMOTE',
      name: 'Remote Test',
      type: 'remote',
      remoteConfig: {
        baseUrl: 'https://api.test.com',
        authConfig: {
          type: 'api-key',
          token: 'test-token'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const service = createWorkspaceDataService(remoteWorkspace);
    expect(service).toBeDefined();
    expect(service.isRemote()).toBe(true);
  });

  it('should throw error for remote workspace without config', () => {
    const invalidRemoteWorkspace: Workspace = {
      id: 'INVALID',
      name: 'Invalid Remote',
      type: 'remote',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(() => createWorkspaceDataService(invalidRemoteWorkspace))
      .toThrow('Remote workspace must have remoteConfig');
  });
});

describe('Workspace Type Validation', () => {
  it('should properly handle workspace type transitions', () => {
    // Test local workspace
    const localWorkspace: Workspace = {
      id: 'LOCAL',
      name: 'Local Workspace',
      type: 'local',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(localWorkspace.type).toBe('local');
    expect(localWorkspace.remoteConfig).toBeUndefined();

    // Test remote workspace
    const remoteWorkspace: Workspace = {
      id: 'REMOTE',
      name: 'Remote Workspace',
      type: 'remote',
      remoteConfig: {
        baseUrl: 'https://api.example.com',
        authConfig: {
          type: 'bearer',
          token: 'jwt-token'
        },
        timeout: 15000,
        retryAttempts: 5
      },
      connectionStatus: {
        connected: true,
        authenticated: true,
        lastSync: new Date(),
        serverVersion: '2.1.0'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    expect(remoteWorkspace.type).toBe('remote');
    expect(remoteWorkspace.remoteConfig).toBeDefined();
    expect(remoteWorkspace.remoteConfig?.baseUrl).toBe('https://api.example.com');
    expect(remoteWorkspace.connectionStatus?.connected).toBe(true);
  });
});

describe('Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    const client = new HttpRemoteWorkspaceClient(mockBaseUrl, mockAuthConfig, { retryAttempts: 1 });

    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(client.checkHealth()).rejects.toThrow('Network error');

    const status = client.getConnectionStatus();
    expect(status.connected).toBe(false);
    expect(status.error).toBe('Network error');
  });

  it('should handle HTTP errors properly', async () => {
    const client = new HttpRemoteWorkspaceClient(mockBaseUrl, mockAuthConfig, { retryAttempts: 1 });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    await expect(client.checkHealth()).rejects.toThrow('HTTP 401: Unauthorized');

    const status = client.getConnectionStatus();
    expect(status.connected).toBe(false);
    expect(status.authenticated).toBe(false);
  });
});