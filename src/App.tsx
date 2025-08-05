import React, { useState } from 'react';
import { Task } from './types';
import { sampleTasks } from './sampleData';
import { MarkdownParser } from './parser';
import { MarkdownSerializer } from './serializer';
import { tasksToBoard, boardToTasks } from './converters';
import Board from './components/Board';
import './App.css';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);

  const generateId = () => {
    const prefix = 'TASK';
    const number = Math.floor(Math.random() * 900) + 100;
    return `${prefix}-${number}`;
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
        onFileImport={handleFileImport}
        onExport={handleExport}
      />
    </div>
  );
};

export default App;