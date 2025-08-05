import React, { useState, useMemo, useCallback } from 'react';
import { Task, ColumnType } from '../types';
import { TASK_STATUSES, COLUMN_TYPES, COLORS } from '../constants';
import Card from './Card';
import TaskModal from './TaskModal';
import './Board.css';

interface EditingState {
  isModalOpen: boolean;
  selectedTaskId: string | null;
  isCreating: boolean;
}

interface BoardProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingState?: EditingState;
  onEditingStateChange?: (state: EditingState) => void;
}

const Board: React.FC<BoardProps> = ({ 
  tasks, 
  onTaskUpdate, 
  onTaskCreate,
  editingState: externalEditingState,
  onEditingStateChange 
}) => {
  const [columnType, setColumnType] = useState<ColumnType>(COLUMN_TYPES.STATUS);
  
  // Use external editing state if provided, otherwise use internal state
  const [internalEditingState, setInternalEditingState] = useState({
    isModalOpen: false,
    selectedTaskId: null as string | null,
    isCreating: false
  });
  
  const editingState = externalEditingState || internalEditingState;
  const setEditingState = onEditingStateChange || setInternalEditingState;
  
  // Get selected task from tasks array
  const selectedTask = editingState.selectedTaskId 
    ? tasks.find(task => task.id === editingState.selectedTaskId) || null
    : null;

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
    setEditingState({
      isModalOpen: true,
      selectedTaskId: task.id,
      isCreating: false
    });
  }, [setEditingState]);

  const handleCreateTask = useCallback(() => {
    setEditingState({
      isModalOpen: true,
      selectedTaskId: null,
      isCreating: true
    });
  }, [setEditingState]);

  const handleModalClose = useCallback(() => {
    setEditingState({
      isModalOpen: false,
      selectedTaskId: null,
      isCreating: false
    });
  }, [setEditingState]);

  const handleTaskSave = useCallback((task: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingState.isCreating) {
      onTaskCreate(task as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
    } else {
      onTaskUpdate(task as Task);
    }
    handleModalClose();
  }, [editingState.isCreating, onTaskCreate, onTaskUpdate, handleModalClose]);

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

      {editingState.isModalOpen && (
        <TaskModal
          task={selectedTask}
          isOpen={editingState.isModalOpen}
          onClose={handleModalClose}
          onSave={handleTaskSave}
          isCreating={editingState.isCreating}
        />
      )}
    </div>
  );
};

export default Board;