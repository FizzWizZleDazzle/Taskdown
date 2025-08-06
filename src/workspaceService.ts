import { Task, Workspace, WorkspaceType } from './types';
import { IRemoteWorkspaceClient, HttpRemoteWorkspaceClient } from './remoteClient';
import { STORAGE_KEYS } from './constants';

export interface IWorkspaceDataService {
  // Workspace management
  isRemote(): boolean;
  getConnectionStatus(): any;
  connect(): Promise<void>;
  disconnect(): void;
  
  // Task operations
  getTasks(): Promise<Task[]>;
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  updateTask(taskId: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  
  // Bulk operations
  setTasks(tasks: Task[]): Promise<void>;
  
  // Import/Export
  importMarkdown?(markdown: string, options?: any): Promise<any>;
  exportMarkdown?(): Promise<{ markdown: string; filename: string }>;
}

/**
 * Local workspace data service using localStorage
 */
export class LocalWorkspaceDataService implements IWorkspaceDataService {
  private workspace: Workspace;
  private storageKey: string;

  constructor(workspace: Workspace) {
    this.workspace = workspace;
    this.storageKey = STORAGE_KEYS.WORKSPACE_TASKS(workspace.id);
  }

  isRemote(): boolean {
    return false;
  }

  getConnectionStatus() {
    return {
      connected: true,
      authenticated: true,
      error: undefined
    };
  }

  async connect(): Promise<void> {
    // Local workspaces are always "connected"
  }

  disconnect(): void {
    // Nothing to disconnect for local workspaces
  }

  async getTasks(): Promise<Task[]> {
    try {
      const tasksJson = localStorage.getItem(this.storageKey);
      if (!tasksJson) return [];
      
      const tasks = JSON.parse(tasksJson);
      
      // Convert date strings back to Date objects
      return tasks.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading local tasks:', error);
      return [];
    }
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const tasks = await this.getTasks();
    
    // Generate ID for local tasks
    const workspaceTasks = tasks.filter(t => t.id.startsWith(`${this.workspace.id}-`));
    const numbers = workspaceTasks.map(t => {
      const match = t.id.match(new RegExp(`^${this.workspace.id}-(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    const id = `${this.workspace.id}-${nextNumber}`;

    const newTask: Task = {
      ...task,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedTasks = [...tasks, newTask];
    await this.setTasks(updatedTasks);
    
    return newTask;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const tasks = await this.getTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    const updatedTask = {
      ...tasks[taskIndex],
      ...updates,
      id: taskId, // Preserve original ID
      updatedAt: new Date()
    };

    tasks[taskIndex] = updatedTask;
    await this.setTasks(tasks);
    
    return updatedTask;
  }

  async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.getTasks();
    const filteredTasks = tasks.filter(t => t.id !== taskId);
    await this.setTasks(filteredTasks);
  }

  async setTasks(tasks: Task[]): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving local tasks:', error);
      throw new Error('Failed to save tasks to local storage');
    }
  }
}

/**
 * Remote workspace data service using API client
 */
export class RemoteWorkspaceDataService implements IWorkspaceDataService {
  private workspace: Workspace;
  private client: IRemoteWorkspaceClient;
  private cachedTasks: Task[] = [];
  private lastSync?: Date;

  constructor(workspace: Workspace) {
    this.workspace = workspace;
    
    if (!workspace.remoteConfig) {
      throw new Error('Remote workspace must have remoteConfig');
    }

    this.client = new HttpRemoteWorkspaceClient(
      workspace.remoteConfig.baseUrl,
      workspace.remoteConfig.authConfig,
      {
        timeout: workspace.remoteConfig.timeout,
        retryAttempts: workspace.remoteConfig.retryAttempts
      }
    );
  }

  isRemote(): boolean {
    return true;
  }

  getConnectionStatus() {
    return this.client.getConnectionStatus();
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  disconnect(): void {
    this.client.disconnect();
  }

  async getTasks(): Promise<Task[]> {
    try {
      const result = await this.client.getTasks(this.lastSync);
      
      // Convert date strings to Date objects
      const tasks = result.tasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt)
      }));

      this.cachedTasks = tasks;
      this.lastSync = new Date(result.lastSync);
      
      return tasks;
    } catch (error) {
      console.error('Error fetching remote tasks:', error);
      
      // Return cached tasks if available
      if (this.cachedTasks.length > 0) {
        console.warn('Using cached tasks due to connection error');
        return this.cachedTasks;
      }
      
      throw error;
    }
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const createdTask = await this.client.createTask(task);
    
    // Update cache
    this.cachedTasks.push(createdTask);
    
    return createdTask;
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    const updatedTask = await this.client.updateTask(taskId, updates);
    
    // Update cache
    const index = this.cachedTasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.cachedTasks[index] = { ...this.cachedTasks[index], ...updatedTask };
    }
    
    return updatedTask;
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.client.deleteTask(taskId);
    
    // Update cache
    this.cachedTasks = this.cachedTasks.filter(t => t.id !== taskId);
  }

  async setTasks(tasks: Task[]): Promise<void> {
    // For remote workspaces, we need to sync all tasks
    // This is a complex operation that should handle creates, updates, and deletes
    
    const currentTasks = await this.getTasks();
    const operations = [];
    
    // Find tasks to create (exist in new tasks but not in current)
    for (const task of tasks) {
      const existing = currentTasks.find(t => t.id === task.id);
      if (!existing) {
        operations.push({
          type: 'create' as const,
          data: task
        });
      } else if (existing.updatedAt < task.updatedAt) {
        operations.push({
          type: 'update' as const,
          taskId: task.id,
          data: task
        });
      }
    }
    
    // Find tasks to delete (exist in current but not in new tasks)
    for (const currentTask of currentTasks) {
      if (!tasks.find(t => t.id === currentTask.id)) {
        operations.push({
          type: 'delete' as const,
          taskId: currentTask.id
        });
      }
    }
    
    if (operations.length > 0) {
      await this.client.bulkOperations(operations);
      
      // Update cache
      this.cachedTasks = tasks;
    }
  }

  async importMarkdown(markdown: string, options?: any): Promise<any> {
    return await this.client.importMarkdown(markdown, options);
  }

  async exportMarkdown(): Promise<{ markdown: string; filename: string }> {
    return await this.client.exportMarkdown();
  }
}

/**
 * Factory function to create appropriate data service based on workspace type
 */
export function createWorkspaceDataService(workspace: Workspace): IWorkspaceDataService {
  switch (workspace.type) {
    case 'local':
      return new LocalWorkspaceDataService(workspace);
    case 'remote':
      return new RemoteWorkspaceDataService(workspace);
    default:
      throw new Error(`Unknown workspace type: ${(workspace as any).type}`);
  }
}