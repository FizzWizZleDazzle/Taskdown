export type TaskType = 'Epic' | 'Story' | 'Task' | 'Bug';
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Todo' | 'In Progress' | 'In Review' | 'Done';

export interface ChecklistItem {
  id?: string;  // Optional for parser compatibility
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
  storyPoints?: number;
  sprint?: string;
  epic?: string;
  description: string;
  acceptanceCriteria: ChecklistItem[];
  technicalTasks: ChecklistItem[];
  dependencies: string[];
  blocks: string[];
  assignee?: string;
  isFavorite?: boolean;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ColumnType = 'epic' | 'sprint' | 'status';

export type WorkspaceType = 'local' | 'remote';

export interface AuthConfig {
  type: 'api-key' | 'basic' | 'bearer' | 'custom';
  token?: string;
  username?: string;
  password?: string;
  customHeaders?: Record<string, string>;
}

export interface RemoteConfig {
  baseUrl: string;
  authConfig?: AuthConfig;
  timeout?: number;
  retryAttempts?: number;
}

export interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  lastSync?: Date;
  error?: string;
  serverVersion?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  type: WorkspaceType;
  remoteConfig?: RemoteConfig;
  connectionStatus?: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Search and Filter types
export interface SearchAndFilterState {
  searchText: string;
  filterPriority: Priority | 'All';
  filterType: TaskType | 'All';
  filterStatus: TaskStatus | 'All';
  filterEpic: string | 'All';
  filterSprint: string | 'All';
}

export const defaultSearchAndFilterState: SearchAndFilterState = {
  searchText: '',
  filterPriority: 'All',
  filterType: 'All',
  filterStatus: 'All',
  filterEpic: 'All',
  filterSprint: 'All'
};

// Parser-specific types for Markdown conversion
/**
 * Represents a Jira-style card with all metadata for parser
 */
export interface Card {
  id: string;
  title: string;
  type?: string;
  priority?: string;
  storyPoints?: number;
  sprint?: string;
  description?: string;
  acceptanceCriteria: ChecklistItem[];
  technicalTasks: ChecklistItem[];
  dependencies?: string[];
  blocks?: string[];
}

/**
 * Represents an Epic containing multiple cards
 */
export interface Epic {
  id: string;
  title: string;
  cards: Card[];
}

/**
 * Represents the complete board data structure
 */
export interface BoardData {
  title?: string;
  epics: Epic[];
}

/**
 * Configuration options for the parser
 */
export interface ParserOptions {
  strictMode?: boolean;
  allowUnknownFields?: boolean;
}

/**
 * Configuration options for the serializer
 */
export interface SerializerOptions {
  includeEmptyFields?: boolean;
  indentSize?: number;
  separateCardsWithHr?: boolean;
}

// Analytics and Reporting types
export interface AnalyticsSummary {
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByType: Record<TaskType, number>;
  tasksByPriority: Record<Priority, number>;
  averageStoryPoints: number;
  completionRate: number;
  activeSprints: string[];
  lastUpdated: string;
}

export interface BurndownDataPoint {
  date: string;
  remainingPoints: number;
  completedPoints: number;
  idealRemaining: number;
}

export interface BurndownData {
  sprint: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  dailyData: BurndownDataPoint[];
}

// User Management types
export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  isActive: boolean;
  lastSeen: string;
}

export interface CreateUserRequest {
  username: string;
  displayName: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  password: string;
}

// Activity and Audit Log types
export interface Activity {
  id: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'deleted' | 'moved' | 'assigned';
  targetType: 'task' | 'user' | 'workspace';
  targetId: string;
  targetName: string;
  details?: {
    field?: string;
    oldValue?: any;
    newValue?: any;
  };
  timestamp: string;
}

export interface ActivityResponse {
  activities: Activity[];
  totalCount: number;
  hasMore: boolean;
}

// Configuration types
export interface WorkspaceFeatures {
  realtime: boolean;
  analytics: boolean;
  webhooks: boolean;
  customFields: boolean;
}

export interface WorkspaceLimits {
  maxTasks: number;
  maxUsers: number;
  apiRateLimit: number;
}

export interface WorkspaceConfig {
  workspaceName: string;
  timezone: string;
  dateFormat: string;
  features: WorkspaceFeatures;
  limits: WorkspaceLimits;
}

// Enhanced Health Monitoring types
export interface DatabaseStatus {
  status: 'connected' | 'disconnected';
  responseTime: number;
}

export interface MemoryStatus {
  used: number;
  total: number;
  percentage: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  connections: number;
  database: DatabaseStatus;
  memory: MemoryStatus;
}

// Enhanced Task Query Parameters
export interface TaskQueryParams {
  lastSync?: string;
  epic?: string;
  status?: TaskStatus;
  assignee?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  search?: string;
}

// Pagination support
export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  hasMore: boolean;
  limit?: number;
  offset?: number;
}