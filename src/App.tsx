import React, { useState, useEffect } from 'react';
import { Task, Workspace } from './types';
import { STORAGE_KEYS, DEFAULT_WORKSPACE } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MarkdownParser } from './parser';
import { MarkdownSerializer } from './serializer';
import { tasksToBoard, boardToTasks } from './converters';
import Board from './components/Board';
import WorkspaceSwitcher from './components/WorkspaceSwitcher';
import './App.css';

const App: React.FC = () => {
  // Workspace management
  const [workspaces, setWorkspaces] = useLocalStorage<Workspace[]>(
    STORAGE_KEYS.WORKSPACES,
    [DEFAULT_WORKSPACE]
  );
  
  const [currentWorkspaceId, setCurrentWorkspaceId] = useLocalStorage<string>(
    STORAGE_KEYS.CURRENT_WORKSPACE,
    DEFAULT_WORKSPACE.id
  );
  
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];
  
  // Use workspace-specific storage for tasks
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    STORAGE_KEYS.WORKSPACE_TASKS(currentWorkspace.id),
    [] // Start with empty tasks for all workspaces
  );
  
  // State for board-level editing state
  const [editingState, setEditingState] = useState({
    isModalOpen: false,
    selectedTaskId: null as string | null,
    isCreating: false
  });

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

  const handleTaskUpdate = (updatedTask: Task, originalId?: string) => {
    setTasks(prevTasks => {
      const idToUpdate = originalId || updatedTask.id;
      const updatedTasks = prevTasks.map(task =>
        task.id === idToUpdate ? { ...updatedTask, updatedAt: new Date() } : task
      );
      return updatedTasks;
    });
  };

  const handleTaskCreate = (taskData: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: 'id' in taskData ? taskData.id : generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
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

  const handleFileImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const markdown = e.target?.result as string;
        const parser = new MarkdownParser();
        const boardData = parser.parse(markdown);
        const importedTasks = boardToTasks(boardData);
        setTasks(importedTasks);
      } catch (error) {
        console.error('Error importing file:', error);
        alert('Error importing file. Please check that the file is valid Markdown.');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    try {
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
    } catch (error) {
      console.error('Error exporting file:', error);
      alert('Error exporting file. Please try again.');
    }
  };

  // Workspace management functions
  const handleWorkspaceChange = (workspace: Workspace) => {
    setCurrentWorkspaceId(workspace.id);
    // Tasks will automatically reload due to the useLocalStorage hook with new key
    window.location.reload(); // Reload to ensure clean state switch
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
    
    setWorkspaces([...workspaces, newWorkspace]);
    handleWorkspaceChange(newWorkspace);
  };

  const handleWorkspaceDelete = (workspaceId: string) => {
    if (workspaces.length <= 1) return;
    
    // Remove workspace
    const updatedWorkspaces = workspaces.filter(w => w.id !== workspaceId);
    setWorkspaces(updatedWorkspaces);
    
    // Clear tasks for deleted workspace
    localStorage.removeItem(STORAGE_KEYS.WORKSPACE_TASKS(workspaceId));
    
    // Switch to first available workspace if current was deleted
    if (currentWorkspaceId === workspaceId) {
      handleWorkspaceChange(updatedWorkspaces[0]);
    }
  };

  const handleWorkspaceEdit = (updatedWorkspace: Workspace) => {
    setWorkspaces(workspaces.map(w => 
      w.id === updatedWorkspace.id 
        ? { ...updatedWorkspace, updatedAt: new Date() }
        : w
    ));
  };

  return (
    <div className="app">
      <WorkspaceSwitcher
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        onWorkspaceChange={handleWorkspaceChange}
        onWorkspaceCreate={handleWorkspaceCreate}
        onWorkspaceDelete={handleWorkspaceDelete}
        onWorkspaceEdit={handleWorkspaceEdit}
      />
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
      />
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