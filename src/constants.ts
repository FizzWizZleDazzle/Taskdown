// Constants for task management
export const TASK_STATUSES = {
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done'
} as const;

export const TASK_TYPES = {
  EPIC: 'Epic',
  STORY: 'Story',
  TASK: 'Task',
  BUG: 'Bug'
} as const;

export const PRIORITIES = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
} as const;

export const COLUMN_TYPES = {
  STATUS: 'status',
  EPIC: 'epic',
  SPRINT: 'sprint'
} as const;

export const COLORS = {
  TYPE: {
    [TASK_TYPES.EPIC]: '#8B5CF6',
    [TASK_TYPES.STORY]: '#06B6D4',
    [TASK_TYPES.TASK]: '#10B981',
    [TASK_TYPES.BUG]: '#EF4444',
    DEFAULT: '#6B7280'
  },
  PRIORITY: {
    [PRIORITIES.CRITICAL]: '#DC2626',
    [PRIORITIES.HIGH]: '#EA580C',
    [PRIORITIES.MEDIUM]: '#D97706',
    [PRIORITIES.LOW]: '#65A30D',
    DEFAULT: '#6B7280'
  },
  STATUS: {
    [TASK_STATUSES.TODO]: '#6b7280',
    [TASK_STATUSES.IN_PROGRESS]: '#f59e0b',
    [TASK_STATUSES.IN_REVIEW]: '#8b5cf6',
    [TASK_STATUSES.DONE]: '#10b981',
    DEFAULT: '#6b7280'
  }
} as const;

export const DEFAULT_FORM_DATA = {
  title: '',
  type: TASK_TYPES.STORY,
  priority: PRIORITIES.MEDIUM,
  status: TASK_STATUSES.TODO,
  storyPoints: 0,
  sprint: '',
  epic: '',
  description: '',
  assignee: '',
  dependencies: [] as string[],
  blocks: [] as string[],
  isFavorite: false,
  thumbnail: ''
};

// LocalStorage keys
export const STORAGE_KEYS = {
  BOARD_TASKS: 'taskdown_board_tasks',
  BOARD_STATE: 'taskdown_board_state',
  USER_PREFERENCES: 'taskdown_user_preferences',
  WORKSPACES: 'taskdown_workspaces',
  CURRENT_WORKSPACE: 'taskdown_current_workspace',
  WORKSPACE_TASKS: (workspaceId: string) => `taskdown_tasks_${workspaceId}`
} as const;

// Default workspace
export const DEFAULT_WORKSPACE = {
  id: 'DEFAULT',
  name: 'Default Workspace',
  description: 'Your default workspace',
  createdAt: new Date(),
  updatedAt: new Date()
};