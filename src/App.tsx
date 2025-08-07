import React, { useState, useEffect } from 'react';
import { Task, Workspace } from './types';
import { STORAGE_KEYS, DEFAULT_WORKSPACE } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MarkdownParser } from './parser';
import { MarkdownSerializer } from './serializer';
import { tasksToBoard, boardToTasks } from './converters';
import { createWorkspaceDataService, IWorkspaceDataService } from './workspaceService';
import Board from './components/Board';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import { Dashboard } from './components/Dashboard';
import './App.css';

const App: React.FC = () => {
  // Settings panel management
  const [showSettings, setShowSettings] = useState(false);
  
  // Workspace management
  const [workspaces, setWorkspaces] = useLocalStorage<Workspace[]>(
    STORAGE_KEYS.WORKSPACES,
    [DEFAULT_WORKSPACE]
  );
  
  const [currentWorkspaceId, setCurrentWorkspaceId] = useLocalStorage<string>(
    STORAGE_KEYS.CURRENT_WORKSPACE,
    DEFAULT_WORKSPACE.id
  );
  
  // Ensure workspace has type field (migration for old data)
  const validatedWorkspaces = workspaces.map(w => ({
    ...w,
    type: w.type || 'local' as const,
    createdAt: w.createdAt instanceof Date ? w.createdAt : new Date(w.createdAt),
    updatedAt: w.updatedAt instanceof Date ? w.updatedAt : new Date(w.updatedAt)
  }));
  
  const currentWorkspace = validatedWorkspaces.find(w => w.id === currentWorkspaceId) || validatedWorkspaces[0];
  
  // Data service for current workspace
  const [dataService, setDataService] = useState<IWorkspaceDataService | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // State for board-level editing state
  const [editingState, setEditingState] = useState({
    isModalOpen: false,
    selectedTaskId: null as string | null,
    isCreating: false
  });

  // Initialize data service when workspace changes
  useEffect(() => {
    const initializeWorkspace = async () => {
      setIsLoading(true);
      setConnectionError(null);
      
      try {
        const service = createWorkspaceDataService(currentWorkspace);
        setDataService(service);
        
        // Connect to workspace (for remote workspaces)
        if (service.isRemote()) {
          await service.connect();
        }
        
        // Load tasks
        const workspaceTasks = await service.getTasks();
        setTasks(workspaceTasks);
        
        // Update workspace connection status if it's remote
        if (service.isRemote()) {
          const status = service.getConnectionStatus();
          setWorkspaces(prev => prev.map(w => 
            w.id === currentWorkspace.id 
              ? { ...w, connectionStatus: status }
              : w
          ));
        }
      } catch (error) {
        console.error('Error initializing workspace:', error);
        setConnectionError((error as Error).message);
        
        // Update connection status for remote workspaces
        if (currentWorkspace.type === 'remote') {
          setWorkspaces(prev => prev.map(w => 
            w.id === currentWorkspace.id 
              ? { 
                  ...w, 
                  connectionStatus: { 
                    connected: false, 
                    authenticated: false, 
                    error: (error as Error).message 
                  } 
                }
              : w
          ));
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeWorkspace();
  }, [currentWorkspace.id]);

  // Cleanup data service on unmount
  useEffect(() => {
    return () => {
      if (dataService?.isRemote()) {
        dataService.disconnect();
      }
    };
  }, [dataService]);

  const generateId = () => {
    // Get the highest number for current workspace
    const workspaceTasks = tasks.filter(t => t.id.startsWith(`${currentWorkspace.id}-`));
    const numbers = workspaceTasks.map(t => {
      const match = t.id.match(new RegExp(`^${currentWorkspace.id}-(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    });
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
    return `${currentWorkspace.id}-${nextNumber}`;
  };

  const handleTaskUpdate = async (updatedTask: Task, originalId?: string) => {
    if (!dataService) return;
    
    try {
      const taskId = originalId || updatedTask.id;
      const result = await dataService.updateTask(taskId, updatedTask);
      
      setTasks(prevTasks => 
        prevTasks.map(task =>
          task.id === taskId ? result : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
      alert(`Failed to update task: ${(error as Error).message}`);
    }
  };

  const handleTaskCreate = async (taskData: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!dataService) return;
    
    try {
      const newTask = await dataService.createTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
      setTasks(prevTasks => [...prevTasks, newTask]);
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Failed to create task: ${(error as Error).message}`);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!dataService) return;
    
    try {
      await dataService.deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert(`Failed to delete task: ${(error as Error).message}`);
    }
  };

  // Auto-save indicator with debounced updates for better UX
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Debounced auto-save indicator to prevent too frequent updates
  useEffect(() => {
    setIsSaving(true);
    const saveTimer = setTimeout(() => {
      setLastSaved(new Date());
      setIsSaving(false);
    }, 500); // Half second delay to show saving state

    return () => clearTimeout(saveTimer);
  }, [tasks]);

  const handleFileImport = async (file: File) => {
    if (!dataService) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const markdown = e.target?.result as string;
        
        // Basic validation of markdown content
        if (!markdown || markdown.trim().length === 0) {
          alert('The file appears to be empty. Please select a file with valid Markdown content.');
          return;
        }
        
        // Use remote import if available, otherwise parse and set locally
        if (dataService.isRemote() && dataService.importMarkdown) {
          await dataService.importMarkdown(markdown);
          // Reload tasks after import
          const updatedTasks = await dataService.getTasks();
          setTasks(updatedTasks);
        } else {
          const parser = new MarkdownParser();
          const boardData = parser.parse(markdown);
          
          // Validate that we got some useful data
          if (!boardData.epics || boardData.epics.length === 0) {
            alert('No valid epics or cards found in the markdown file. Please check the format and try again.');
            return;
          }
          
          const importedTasks = boardToTasks(boardData);
          await dataService.setTasks(importedTasks);
          setTasks(importedTasks);
        }
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error importing file. Please check that the file contains valid Jira-style Markdown format.');
      }
    };
    
    reader.onerror = () => {
      alert('Error reading file. Please try again or check if the file is corrupted.');
    };
    
    reader.readAsText(file);
  };

  const handleExport = async () => {
    if (!dataService) return;
    
    try {
      // Use remote export if available, otherwise serialize locally
      if (dataService.isRemote() && dataService.exportMarkdown) {
        const result = await dataService.exportMarkdown();
        
        // Create and trigger download
        const blob = new Blob([result.markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const boardData = tasksToBoard(tasks, `${currentWorkspace.name} - Taskdown Board`);
        const serializer = new MarkdownSerializer();
        const markdown = serializer.serialize(boardData);
        
        // Create and trigger download
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taskdown-${currentWorkspace.id.toLowerCase()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting file:', error);
      alert('Error exporting file. Please try again.');
    }
  };

  // Workspace management functions
  const handleWorkspaceChange = (workspace: Workspace) => {
    setCurrentWorkspaceId(workspace.id);
    // Data service and tasks will automatically reload due to the useEffect hook
  };

  const handleWorkspaceCreate = (workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Generate a short, readable ID
    const id = workspaceData.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6) || 'WS' + Date.now().toString().slice(-4);
    
    const newWorkspace: Workspace = {
      ...workspaceData,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setWorkspaces([...validatedWorkspaces, newWorkspace]);
    handleWorkspaceChange(newWorkspace);
  };

  const handleWorkspaceDelete = (workspaceId: string) => {
    if (validatedWorkspaces.length <= 1) return;
    
    // Remove workspace
    const updatedWorkspaces = validatedWorkspaces.filter(w => w.id !== workspaceId);
    setWorkspaces(updatedWorkspaces);
    
    // Clear local tasks for deleted workspace (only affects local workspaces)
    localStorage.removeItem(STORAGE_KEYS.WORKSPACE_TASKS(workspaceId));
    
    // Switch to first available workspace if current was deleted
    if (currentWorkspaceId === workspaceId) {
      handleWorkspaceChange(updatedWorkspaces[0]);
    }
  };

  const handleWorkspaceEdit = (updatedWorkspace: Workspace) => {
    setWorkspaces(validatedWorkspaces.map(w => 
      w.id === updatedWorkspace.id 
        ? { ...updatedWorkspace, updatedAt: new Date() }
        : w
    ));
    
    // If editing current workspace, reload it
    if (updatedWorkspace.id === currentWorkspaceId) {
      // The useEffect will handle reloading the workspace
      setCurrentWorkspaceId(updatedWorkspace.id);
    }
  };

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Connecting to workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <WorkspaceSwitcher
        workspaces={validatedWorkspaces}
        currentWorkspace={currentWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
        onWorkspaceCreate={handleWorkspaceCreate}
        onWorkspaceDelete={handleWorkspaceDelete}
        onWorkspaceEdit={handleWorkspaceEdit}
      />
      
      {connectionError && (
        <div className="connection-error">
          <span>⚠️ Connection Error: {connectionError}</span>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <Board
        tasks={tasks}
        onTaskUpdate={handleTaskUpdate}
        onTaskCreate={handleTaskCreate}
        onTaskDelete={handleTaskDelete}
        editingState={editingState}
        onEditingStateChange={setEditingState}
        onFileImport={handleFileImport}
        onExport={handleExport}
        currentWorkspace={currentWorkspace}
        onShowSettings={() => setShowSettings(true)}
      />
      
      {/* Settings Modal for Remote Workspaces */}
      {showSettings && currentWorkspace.type === 'remote' && (
        <Dashboard
          remoteClient={dataService?.getRemoteClient?.()}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {/* Auto-save indicator with accessibility and UX improvements */}
      <div 
        className="auto-save-indicator"
        role="status"
        aria-live="polite"
        aria-label={isSaving ? "Saving changes" : `Last saved at ${lastSaved.toLocaleTimeString()}`}
      >
        {isSaving ? (
          <span>Saving...</span>
        ) : (
          <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
        )}
      </div>
    </div>
  );
};

export default App;