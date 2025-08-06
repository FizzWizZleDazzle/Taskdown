import { Task, AuthConfig, ConnectionStatus } from './types';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface WorkspaceInfo {
  id: string;
  name: string;
  description?: string;
  serverVersion: string;
  capabilities: string[];
  lastUpdated: string;
}

export interface AuthVerificationResult {
  authenticated: boolean;
  sessionToken?: string;
  expiresAt?: string;
  permissions: string[];
}

export interface TaskSyncResult {
  tasks: Task[];
  lastSync: string;
}

export interface BulkOperation {
  type: 'create' | 'update' | 'delete';
  taskId?: string;
  data?: Partial<Task>;
}

export interface BulkOperationResult {
  operation: 'create' | 'update' | 'delete';
  taskId: string;
  success: boolean;
  error?: string;
}

/**
 * Interface for remote workspace API client
 */
export interface IRemoteWorkspaceClient {
  // Connection management
  connect(): Promise<ConnectionStatus>;
  disconnect(): void;
  getConnectionStatus(): ConnectionStatus;
  
  // Authentication
  authenticate(authConfig: AuthConfig): Promise<AuthVerificationResult>;
  checkAuthStatus(): Promise<AuthVerificationResult>;
  
  // Workspace info
  getWorkspaceInfo(): Promise<WorkspaceInfo>;
  
  // Task operations
  getTasks(lastSync?: Date): Promise<TaskSyncResult>;
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  updateTask(taskId: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  
  // Bulk operations
  bulkOperations(operations: BulkOperation[]): Promise<BulkOperationResult[]>;
  
  // Import/Export
  importMarkdown(markdown: string, options?: { overwrite?: boolean; preserveIds?: boolean }): Promise<{ imported: number; updated: number; errors: string[] }>;
  exportMarkdown(): Promise<{ markdown: string; filename: string }>;
  
  // Health check
  checkHealth(): Promise<{ status: string; version: string; uptime: number; connections: number }>;
}

/**
 * HTTP-based implementation of the remote workspace client
 */
export class HttpRemoteWorkspaceClient implements IRemoteWorkspaceClient {
  private baseUrl: string;
  private authConfig?: AuthConfig;
  private sessionToken?: string;
  private connectionStatus: ConnectionStatus;
  private timeout: number;
  private retryAttempts: number;

  constructor(baseUrl: string, authConfig?: AuthConfig, options?: { timeout?: number; retryAttempts?: number }) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.authConfig = authConfig;
    this.timeout = options?.timeout || 10000; // 10 second default
    this.retryAttempts = options?.retryAttempts || 3;
    this.connectionStatus = {
      connected: false,
      authenticated: false
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    } else if (this.authConfig) {
      switch (this.authConfig.type) {
        case 'api-key':
        case 'bearer':
          if (this.authConfig.token) {
            headers['Authorization'] = `Bearer ${this.authConfig.token}`;
          }
          break;
        case 'basic':
          if (this.authConfig.username && this.authConfig.password) {
            const credentials = btoa(`${this.authConfig.username}:${this.authConfig.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'custom':
          if (this.authConfig.customHeaders) {
            Object.assign(headers, this.authConfig.customHeaders);
          }
          break;
      }
    }
    
    return headers;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...(options.headers || {})
    };

    const requestOptions: RequestInit = {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout)
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
          if (response.status === 401) {
            this.connectionStatus.authenticated = false;
            this.connectionStatus.error = 'Authentication failed';
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Update connection status on successful request
        this.connectionStatus.connected = true;
        this.connectionStatus.lastSync = new Date();
        this.connectionStatus.error = undefined;
        
        return data;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === this.retryAttempts) {
          this.connectionStatus.connected = false;
          this.connectionStatus.error = lastError.message;
          break;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    throw lastError!;
  }

  async connect(): Promise<ConnectionStatus> {
    try {
      const healthResponse = await this.makeRequest<any>('/api/health');
      
      if (healthResponse.success) {
        this.connectionStatus.connected = true;
        this.connectionStatus.serverVersion = healthResponse.data?.version;
        this.connectionStatus.error = undefined;
        
        // If auth config is provided, attempt authentication
        if (this.authConfig) {
          await this.authenticate(this.authConfig);
        }
      }
    } catch (error) {
      this.connectionStatus.connected = false;
      this.connectionStatus.authenticated = false;
      this.connectionStatus.error = (error as Error).message;
    }
    
    return this.connectionStatus;
  }

  disconnect(): void {
    this.connectionStatus.connected = false;
    this.connectionStatus.authenticated = false;
    this.sessionToken = undefined;
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  async authenticate(authConfig: AuthConfig): Promise<AuthVerificationResult> {
    this.authConfig = authConfig;
    
    const response = await this.makeRequest<AuthVerificationResult>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ credentials: authConfig })
    });

    if (response.success && response.data) {
      this.connectionStatus.authenticated = response.data.authenticated;
      if (response.data.sessionToken) {
        this.sessionToken = response.data.sessionToken;
      }
      return response.data;
    }

    throw new Error(response.error?.message || 'Authentication failed');
  }

  async checkAuthStatus(): Promise<AuthVerificationResult> {
    const response = await this.makeRequest<AuthVerificationResult>('/api/auth/status');
    
    if (response.success && response.data) {
      this.connectionStatus.authenticated = response.data.authenticated;
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to check auth status');
  }

  async getWorkspaceInfo(): Promise<WorkspaceInfo> {
    const response = await this.makeRequest<WorkspaceInfo>('/api/workspace');
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get workspace info');
  }

  async getTasks(lastSync?: Date): Promise<TaskSyncResult> {
    const params = new URLSearchParams();
    if (lastSync) {
      params.set('lastSync', lastSync.toISOString());
    }
    
    const endpoint = `/api/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.makeRequest<TaskSyncResult>(endpoint);
    
    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get tasks');
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const response = await this.makeRequest<{ id: string; createdAt: string; updatedAt: string }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(task)
    });

    if (response.success && response.data) {
      return {
        ...task,
        id: response.data.id,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt)
      };
    }

    throw new Error(response.error?.message || 'Failed to create task');
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const response = await this.makeRequest<{ updatedAt: string }>(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });

    if (response.success && response.data) {
      return {
        ...updates,
        id: taskId,
        updatedAt: new Date(response.data.updatedAt)
      } as Task;
    }

    throw new Error(response.error?.message || 'Failed to update task');
  }

  async deleteTask(taskId: string): Promise<void> {
    const response = await this.makeRequest(`/api/tasks/${taskId}`, {
      method: 'DELETE'
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete task');
    }
  }

  async bulkOperations(operations: BulkOperation[]): Promise<BulkOperationResult[]> {
    const response = await this.makeRequest<{ results: BulkOperationResult[] }>('/api/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ operations })
    });

    if (response.success && response.data) {
      return response.data.results;
    }

    throw new Error(response.error?.message || 'Failed to perform bulk operations');
  }

  async importMarkdown(
    markdown: string, 
    options?: { overwrite?: boolean; preserveIds?: boolean }
  ): Promise<{ imported: number; updated: number; errors: string[] }> {
    const response = await this.makeRequest<{ imported: number; updated: number; errors: string[] }>('/api/import/markdown', {
      method: 'POST',
      body: JSON.stringify({ markdown, options })
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to import markdown');
  }

  async exportMarkdown(): Promise<{ markdown: string; filename: string }> {
    const response = await this.makeRequest<{ markdown: string; filename: string }>('/api/export/markdown');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to export markdown');
  }

  async checkHealth(): Promise<{ status: string; version: string; uptime: number; connections: number }> {
    const response = await this.makeRequest<{ status: string; version: string; uptime: number; connections: number }>('/api/health');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to check health');
  }
}