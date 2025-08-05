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
  createdAt: Date;
  updatedAt: Date;
}

export type ColumnType = 'epic' | 'sprint' | 'status';

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