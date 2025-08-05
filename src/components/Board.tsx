import React, { useState, useMemo, useCallback } from 'react';
import { Task, ColumnType } from '../types';
import { TASK_STATUSES, COLUMN_TYPES, COLORS } from '../constants';
import Card from './Card';
import TaskModal from './TaskModal';
import './Board.css';

interface BoardProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const Board: React.FC<BoardProps> = ({ tasks, onTaskUpdate, onTaskCreate }) => {
  const [columnType, setColumnType] = useState<ColumnType>(COLUMN_TYPES.STATUS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const columns = useMemo(() => {
    switch (columnType) {
      case COLUMN_TYPES.STATUS:
        return {
          [TASK_STATUSES.TODO]: tasks.filter(task => task.status === TASK_STATUSES.TODO),
          [TASK_STATUSES.IN_PROGRESS]: tasks.filter(task => task.status === TASK_STATUSES.IN_PROGRESS),
          [TASK_STATUSES.IN_REVIEW]: tasks.filter(task => task.status === TASK_STATUSES.IN_REVIEW),
          [TASK_STATUSES.DONE]: tasks.filter(task => task.status === TASK_STATUSES.DONE),
        };
      case COLUMN_TYPES.EPIC:
        const epicGroups: Record<string, Task[]> = {};
        tasks.forEach(task => {
          const epic = task.epic || 'No Epic';
          if (!epicGroups[epic]) {
            epicGroups[epic] = [];
          }
          epicGroups[epic].push(task);
        });
        return epicGroups;
      case COLUMN_TYPES.SPRINT:
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

  const handleEditTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsCreating(false);
    setIsModalOpen(true);
  }, []);

  const handleCreateTask = useCallback(() => {
    setSelectedTask(null);
    setIsCreating(true);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setIsCreating(false);
  }, []);

  const handleTaskSave = useCallback((task: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isCreating) {
      onTaskCreate(task as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
    } else {
      onTaskUpdate(task as Task);
    }
    handleModalClose();
  }, [isCreating, onTaskCreate, onTaskUpdate, handleModalClose]);

  const getColumnColor = useCallback((columnName: string) => {
    if (columnType === COLUMN_TYPES.STATUS) {
      return COLORS.STATUS[columnName as keyof typeof COLORS.STATUS] || COLORS.STATUS.DEFAULT;
    }
    return COLORS.STATUS.DEFAULT;
  }, [columnType]);

  return (
    <div className="board">
      <div className="board-header">
        <h1>Taskdown Board</h1>
        <div className="board-controls">
          <div className="view-selector">
            <label htmlFor="column-type-select">Group by:</label>
            <select 
              id="column-type-select"
              value={columnType} 
              onChange={(e) => setColumnType(e.target.value as ColumnType)}
              aria-label="Select column grouping method"
            >
              <option value={COLUMN_TYPES.STATUS}>Status</option>
              <option value={COLUMN_TYPES.EPIC}>Epic</option>
              <option value={COLUMN_TYPES.SPRINT}>Sprint</option>
            </select>
          </div>
          <button 
            className="add-task-btn" 
            onClick={handleCreateTask}
            aria-label="Add new task"
          >
            + Add Task
          </button>
        </div>
      </div>

      <div className="board-columns">
        {Object.entries(columns).map(([columnName, columnTasks]) => (
          <div key={columnName} className="column" role="region" aria-label={`${columnName} tasks`}>
            <div 
              className="column-header"
              style={{ borderTopColor: getColumnColor(columnName) }}
            >
              <h3>{columnName}</h3>
              <span className="task-count" aria-label={`${columnTasks.length} tasks`}>
                {columnTasks.length}
              </span>
            </div>
            <div className="column-content" role="list">
              {columnTasks.map(task => (
                <div key={task.id} role="listitem">
                  <Card 
                    task={task} 
                    onEdit={handleEditTask}
                  />
                </div>
              ))}
              {columnTasks.length === 0 && (
                <div className="empty-column" role="status" aria-live="polite">
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