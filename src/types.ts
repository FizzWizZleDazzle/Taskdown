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