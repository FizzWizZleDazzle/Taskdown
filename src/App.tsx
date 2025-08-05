import React, { useState, useEffect } from 'react';
import { Task } from './types';
import { sampleTasks } from './sampleData';
import { STORAGE_KEYS } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
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
    const prefix = 'TASK';
    const number = Math.floor(Math.random() * 900) + 100;
    return `${prefix}-${number}`;
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

  // Auto-save indicator (optional - could be used for UI feedback)
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  
  // Update last saved timestamp when tasks change
  useEffect(() => {
    setLastSaved(new Date());
  }, [tasks]);

  return (
    <div className="app">
      <Board
        tasks={tasks}
        onTaskUpdate={handleTaskUpdate}
        onTaskCreate={handleTaskCreate}
        editingState={editingState}
        onEditingStateChange={setEditingState}
      />
      {/* Optional: Auto-save indicator */}
      <div className="auto-save-indicator" style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        fontSize: '12px', 
        color: '#666',
        opacity: 0.7
      }}>
        Last saved: {lastSaved.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default App;