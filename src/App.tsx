import React, { useState } from 'react';
import { Task } from './types';
import { sampleTasks } from './sampleData';
import Board from './components/Board';
import './App.css';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);

  const generateId = () => {
    return `TASK-${crypto.randomUUID()}`;
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
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

  return (
    <div className="app">
      <Board
        tasks={tasks}
        onTaskUpdate={handleTaskUpdate}
        onTaskCreate={handleTaskCreate}
      />
    </div>
  );
};

export default App;