import { 
  Task, 
  AuthConfig, 
  ConnectionStatus, 
  AnalyticsSummary, 
  BurndownData, 
  User, 
  CreateUserRequest, 
  Activity, 
  ActivityResponse, 
  WorkspaceConfig, 
  HealthStatus,
  TaskQueryParams,
  AITaskGenerationRequest,
  AITaskGenerationResponse,
  AIAcceptanceCriteriaRequest,
  AIStoryPointEstimationRequest,
  AIDependencyAnalysisRequest,
  AIDependencyAnalysisResponse,
  AISprintPlanningRequest,
  AISprintPlanningResponse
} from './types';

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
  totalCount?: number;
  hasMore?: boolean;
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
  getTasks(params?: TaskQueryParams): Promise<TaskSyncResult>;
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  updateTask(taskId: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  
  // Bulk operations
  bulkOperations(operations: BulkOperation[]): Promise<BulkOperationResult[]>;
  
  // Import/Export
  importMarkdown(markdown: string, options?: { overwrite?: boolean; preserveIds?: boolean }): Promise<{ imported: number; updated: number; errors: string[] }>;
  exportMarkdown(): Promise<{ markdown: string; filename: string }>;
  
  // Analytics and Reporting
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
  getBurndownData(sprint: string): Promise<BurndownData>;
  
  // User Management
  getUsers(): Promise<User[]>;
  createUser(user: CreateUserRequest): Promise<User>;
  
  // Activity and Audit Log
  getActivity(params?: { 
    limit?: number; 
    offset?: number; 
    userId?: string; 
    taskId?: string; 
    action?: string; 
  }): Promise<ActivityResponse>;
  
  // AI Services
  generateTaskDetails(request: AITaskGenerationRequest): Promise<AITaskGenerationResponse>;
  generateAcceptanceCriteria(request: AIAcceptanceCriteriaRequest): Promise<string[]>;
  estimateStoryPoints(request: AIStoryPointEstimationRequest): Promise<number>;
  analyzeDependencies(request: AIDependencyAnalysisRequest): Promise<AIDependencyAnalysisResponse>;
  planSprint(request: AISprintPlanningRequest): Promise<AISprintPlanningResponse>;
  
  // Configuration and Settings
  getConfig(): Promise<WorkspaceConfig>;
  updateConfig(config: Partial<WorkspaceConfig>): Promise<void>;
  
  // Enhanced Health check
  checkHealth(): Promise<HealthStatus>;
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

  async getTasks(params?: TaskQueryParams): Promise<TaskSyncResult> {
    const urlParams = new URLSearchParams();
    
    if (params) {
      if (params.lastSync) {
        urlParams.set('lastSync', params.lastSync);
      }
      if (params.epic) {
        urlParams.set('epic', params.epic);
      }
      if (params.status) {
        urlParams.set('status', params.status);
      }
      if (params.assignee) {
        urlParams.set('assignee', params.assignee);
      }
      if (params.limit) {
        urlParams.set('limit', params.limit.toString());
      }
      if (params.offset) {
        urlParams.set('offset', params.offset.toString());
      }
      if (params.sort) {
        urlParams.set('sort', params.sort);
      }
      if (params.search) {
        urlParams.set('search', params.search);
      }
    }
    
    const endpoint = `/api/tasks${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
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

  async checkHealth(): Promise<HealthStatus> {
    const response = await this.makeRequest<HealthStatus>('/api/health');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to check health');
  }

  // Analytics and Reporting
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const response = await this.makeRequest<AnalyticsSummary>('/api/analytics/summary');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get analytics summary');
  }

  async getBurndownData(sprint: string): Promise<BurndownData> {
    const params = new URLSearchParams({ sprint });
    const response = await this.makeRequest<BurndownData>(`/api/analytics/burndown?${params.toString()}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get burndown data');
  }

  // User Management
  async getUsers(): Promise<User[]> {
    const response = await this.makeRequest<{ users: User[] }>('/api/users');

    if (response.success && response.data) {
      return response.data.users;
    }

    throw new Error(response.error?.message || 'Failed to get users');
  }

  async createUser(user: CreateUserRequest): Promise<User> {
    const response = await this.makeRequest<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to create user');
  }

  // Activity and Audit Log
  async getActivity(params?: { 
    limit?: number; 
    offset?: number; 
    userId?: string; 
    taskId?: string; 
    action?: string; 
  }): Promise<ActivityResponse> {
    const urlParams = new URLSearchParams();
    
    if (params) {
      if (params.limit) {
        urlParams.set('limit', params.limit.toString());
      }
      if (params.offset) {
        urlParams.set('offset', params.offset.toString());
      }
      if (params.userId) {
        urlParams.set('userId', params.userId);
      }
      if (params.taskId) {
        urlParams.set('taskId', params.taskId);
      }
      if (params.action) {
        urlParams.set('action', params.action);
      }
    }

    const endpoint = `/api/activity${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
    const response = await this.makeRequest<ActivityResponse>(endpoint);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get activity');
  }

  // AI Services
  async generateTaskDetails(request: AITaskGenerationRequest): Promise<AITaskGenerationResponse> {
    const response = await this.makeRequest<AITaskGenerationResponse>('/api/ai/generate-task', {
      method: 'POST',
      body: JSON.stringify(request)
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to generate task details');
  }

  async generateAcceptanceCriteria(request: AIAcceptanceCriteriaRequest): Promise<string[]> {
    const response = await this.makeRequest<string[]>('/api/ai/acceptance-criteria', {
      method: 'POST',
      body: JSON.stringify(request)
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to generate acceptance criteria');
  }

  async estimateStoryPoints(request: AIStoryPointEstimationRequest): Promise<number> {
    const response = await this.makeRequest<number>('/api/ai/estimate-story-points', {
      method: 'POST',
      body: JSON.stringify(request)
    });

    if (response.success && response.data !== undefined) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to estimate story points');
  }

  async analyzeDependencies(request: AIDependencyAnalysisRequest): Promise<AIDependencyAnalysisResponse> {
    const response = await this.makeRequest<AIDependencyAnalysisResponse>('/api/ai/analyze-dependencies', {
      method: 'POST',
      body: JSON.stringify(request)
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to analyze dependencies');
  }

  async planSprint(request: AISprintPlanningRequest): Promise<AISprintPlanningResponse> {
    const response = await this.makeRequest<AISprintPlanningResponse>('/api/ai/plan-sprint', {
      method: 'POST',
      body: JSON.stringify(request)
    });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to plan sprint');
  }

  // Configuration and Settings
  async getConfig(): Promise<WorkspaceConfig> {
    const response = await this.makeRequest<WorkspaceConfig>('/api/config');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.error?.message || 'Failed to get config');
  }

  async updateConfig(config: Partial<WorkspaceConfig>): Promise<void> {
    const response = await this.makeRequest('/api/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update config');
    }
  }
}