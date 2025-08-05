import React, { useState, useEffect } from 'react';
import { Task } from './types';
import { sampleTasks } from './sampleData';
import { STORAGE_KEYS } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { MarkdownParser } from './parser';
import { MarkdownSerializer } from './serializer';
import { tasksToBoard, boardToTasks } from './converters';
import Board from './components/Board';
import './App.css';

const App: React.FC = () => {
  // Use localStorage hook for persistent task storage
  // Initialize with sample data if no saved data exists
  const [tasks, setTasks] = useLocalStorage<Task[]>(STORAGE_KEYS.BOARD_TASKS, sampleTasks);
  
  // State for board-level editing state
  const [editingState, setEditingState] = useState({
    isModalOpen: false,
    selectedTaskId: null as string | null,
    isCreating: false
  });

  const generateId = () => {
    return `TASK-${crypto.randomUUID()}`;
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === updatedTask.id ? { ...updatedTask, updatedAt: new Date() } : task
      );
      return updatedTasks;
    });
  };

  const handleTaskCreate = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateId(),
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
      const boardData = tasksToBoard(tasks, 'Taskdown Board');
      const serializer = new MarkdownSerializer();
      const markdown = serializer.serialize(boardData);
      
      // Create and trigger download
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'taskdown-board.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting file:', error);
      alert('Error exporting file. Please try again.');
    }
  };

  return (
    <div className="app">
      <Board
        tasks={tasks}
        onTaskUpdate={handleTaskUpdate}
        onTaskCreate={handleTaskCreate}
        onTaskDelete={handleTaskDelete}
        editingState={editingState}
        onEditingStateChange={setEditingState}
        onFileImport={handleFileImport}
        onExport={handleExport}

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