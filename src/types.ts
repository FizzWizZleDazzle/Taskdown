export type TaskType = 'Epic' | 'Story' | 'Task' | 'Bug';
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Todo' | 'In Progress' | 'In Review' | 'Done';

export interface ChecklistItem {
  id: string;
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