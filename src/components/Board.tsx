import React, { useState, useMemo } from 'react';
import { Task, ColumnType } from '../types';
import Card from './Card';
import TaskModal from './TaskModal';
import './Board.css';

interface BoardProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const Board: React.FC<BoardProps> = ({ tasks, onTaskUpdate, onTaskCreate }) => {
  const [columnType, setColumnType] = useState<ColumnType>('status');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const columns = useMemo(() => {
    switch (columnType) {
      case 'status':
        return {
          'Todo': tasks.filter(task => task.status === 'Todo'),
          'In Progress': tasks.filter(task => task.status === 'In Progress'),
          'In Review': tasks.filter(task => task.status === 'In Review'),
          'Done': tasks.filter(task => task.status === 'Done'),
        };
      case 'epic':
        const epicGroups: Record<string, Task[]> = {};
        tasks.forEach(task => {
          const epic = task.epic || 'No Epic';
          if (!epicGroups[epic]) {
            epicGroups[epic] = [];
          }
          epicGroups[epic].push(task);
        });
        return epicGroups;
      case 'sprint':
        const sprintGroups: Record<string, Task[]> = {};
        tasks.forEach(task => {
          const sprint = task.sprint || 'No Sprint';
          if (!sprintGroups[sprint]) {
            sprintGroups[sprint] = [];
          }
          sprintGroups[sprint].push(task);
        });
        return sprintGroups;
      default:
        return {};
    }
  }, [tasks, columnType]);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsCreating(false);
    setIsModalOpen(true);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsCreating(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setIsCreating(false);
  };

  const handleTaskSave = (task: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isCreating) {
      onTaskCreate(task as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
    } else {
      onTaskUpdate(task as Task);
    }
    handleModalClose();
  };

  const getColumnColor = (columnName: string) => {
    if (columnType === 'status') {
      switch (columnName) {
        case 'Todo': return '#6b7280';
        case 'In Progress': return '#f59e0b';
        case 'In Review': return '#8b5cf6';
        case 'Done': return '#10b981';
        default: return '#6b7280';
      }
    }
    return '#6b7280';
  };

  return (
    <div className="board">
      <div className="board-header">
        <h1>Taskdown Board</h1>
        <div className="board-controls">
          <div className="view-selector">
            <label>Group by:</label>
            <select 
              value={columnType} 
              onChange={(e) => setColumnType(e.target.value as ColumnType)}
            >
              <option value="status">Status</option>
              <option value="epic">Epic</option>
              <option value="sprint">Sprint</option>
            </select>
          </div>
          <button className="add-task-btn" onClick={handleCreateTask}>
            + Add Task
          </button>
        </div>
      </div>

      <div className="board-columns">
        {Object.entries(columns).map(([columnName, columnTasks]) => (
          <div key={columnName} className="column">
            <div 
              className="column-header"
              style={{ borderTopColor: getColumnColor(columnName) }}
            >
              <h3>{columnName}</h3>
              <span className="task-count">{columnTasks.length}</span>
            </div>
            <div className="column-content">
              {columnTasks.map(task => (
                <Card 
                  key={task.id} 
                  task={task} 
                  onEdit={handleEditTask}
                />
              ))}
              {columnTasks.length === 0 && (
                <div className="empty-column">
                  No tasks in this column
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSave={handleTaskSave}
          isCreating={isCreating}
        />
      )}
    </div>
  );
};

export default Board;