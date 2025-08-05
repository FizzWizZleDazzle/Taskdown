import React, { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import { Task, ColumnType, TaskStatus } from '../types';
import { TASK_STATUSES, COLUMN_TYPES, COLORS } from '../constants';
import Card from './Card';
import TaskModal from './TaskModal';
import './Board.css';

// Type guard function for TaskStatus validation
const isValidTaskStatus = (status: string): status is TaskStatus => {
  return Object.values(TASK_STATUSES).includes(status as TaskStatus);
};

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
  onFileImport: (file: File) => void;
  onExport: () => void;
}

interface DroppableColumnProps {
  columnName: string;
  columnTasks: Task[];
  getColumnColor: (columnName: string) => string;
  handleEditTask: (task: Task) => void;
  activeTask: Task | null;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  columnName,
  columnTasks,
  getColumnColor,
  handleEditTask,
  activeTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: columnName,
  });

  return (
    <div className="column" role="region" aria-label={`${columnName} tasks`}>
      <div
        className="column-header"
        style={{ borderTopColor: getColumnColor(columnName) }}
      >
        <h3>{columnName}</h3>
        <span className="task-count" aria-label={`${columnTasks.length} tasks`}>
          {columnTasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`column-content ${isOver ? 'column-content--over' : ''}`}
        role="list"
        data-column-id={columnName}
        style={{ minHeight: '200px' }} // Ensure droppable area even when empty
      >
        {columnTasks.map(task => (
          <div key={task.id} role="listitem">
            <Card
              task={task}
              onEdit={handleEditTask}
              isDragging={activeTask?.id === task.id}
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
  );
};

// Start of the Board component, combining props from `main`
const Board: React.FC<BoardProps> = ({
  tasks,
  onTaskUpdate,
  onTaskCreate,
  editingState: externalEditingState,
  onEditingStateChange,
  onFileImport,
  onExport
}) => {
  const [columnType, setColumnType] = useState<ColumnType>(COLUMN_TYPES.STATUS);

  // From copilot/fix: Add state for drag & drop
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // From main: Use controlled component logic for editing state
  const [internalEditingState, setInternalEditingState] = useState({
    isModalOpen: false,
    selectedTaskId: null as string | null,
    isCreating: false
  });

  const editingState = externalEditingState || internalEditingState;
  const setEditingState = onEditingStateChange || setInternalEditingState;

  // From main: Logic to derive the selected task
  const selectedTask = editingState.selectedTaskId
    ? tasks.find(task => task.id === editingState.selectedTaskId) || null
    : null;

  // From copilot/fix: Configure sensors for drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require mouse to move 8px to start dragging
      },
    })
  );
  
  const [isDragOver, setIsDragOver] = useState(false);

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

  // Drag & Drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  }, [tasks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Handle moving between columns (status change)
    if (columnType === COLUMN_TYPES.STATUS) {
      const overColumnId = over.id as string;
      
      // Check if we're dropping on a column (status)
      if (isValidTaskStatus(overColumnId)) {
        if (activeTask.status !== overColumnId) {
          const updatedTask = { ...activeTask, status: overColumnId, updatedAt: new Date() };
          onTaskUpdate(updatedTask);
        }
        return;
      }

      // Handle reordering within the same column
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask && activeTask.status === overTask.status) {
        // Find tasks in the same column
        const columnTasks = tasks.filter(t => t.status === activeTask.status);
        const oldIndex = columnTasks.findIndex(t => t.id === active.id);
        const newIndex = columnTasks.findIndex(t => t.id === over.id);

        if (oldIndex !== newIndex) {
          // Note: Visual reordering is handled by @dnd-kit automatically
          // In a real app, you'd want to persist the order by adding an 'order' field to Task
          // For now, this provides visual feedback without persistence
        }
      }
    }
  }, [tasks, columnType, onTaskUpdate]);

  // File drag & drop handlers
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/markdown') {
      onFileImport(file);
    } else if (file) {
      alert('Please select a valid Markdown (.md) file.');
    }
    // Reset input value to allow re-importing the same file
    event.target.value = '';
  }, [onFileImport]);

  const handleFileDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleFileDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'text/markdown') {
      onFileImport(file);
    } else if (file) {
      alert('Please drop a valid Markdown (.md) file.');
    }
  }, [onFileImport]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div 
        className={`board ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
      >
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

            <div className="file-controls">
              <input
                type="file"
                id="file-input"
                accept=".md,text/markdown"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              <button 
                className="import-btn" 
                onClick={() => document.getElementById('file-input')?.click()}
                aria-label="Import markdown file"
              >
                📁 Import
              </button>
              <button 
                className="export-btn" 
                onClick={onExport}
                aria-label="Export to markdown file"
              >
                💾 Export
              </button>
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
          {isDragOver && (
            <div className="drag-overlay">
              <div className="drag-message">
                <span>📁</span>
                <p>Drop your Markdown file here to import</p>
              </div>
            </div>
          )}
          {Object.entries(columns).map(([columnName, columnTasks]) => (
            <DroppableColumn
              key={columnName}
              columnName={columnName}
              columnTasks={columnTasks}
              getColumnColor={getColumnColor}
              handleEditTask={handleEditTask}
              activeTask={activeTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <Card 
              task={activeTask} 
              onEdit={undefined} 
              isDragging={true}
            />
          ) : null}
        </DragOverlay>

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
    </DndContext>
  );
};

export default Board;