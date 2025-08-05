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
import { Task, ColumnType, TaskStatus, Workspace } from '../types';
import { TASK_STATUSES, COLUMN_TYPES, COLORS } from '../constants';
import { filterTasks, hasActiveSearchOrFilter } from '../filterUtils';
import Card from './Card';
import TaskModal from './TaskModal';
import SearchAndFilter from './SearchAndFilter';
import ConfirmDialog from './ConfirmDialog';
import { SearchAndFilterState, defaultSearchAndFilterState } from '../types';
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
  onTaskUpdate: (task: Task, originalId?: string) => void;
  onTaskCreate: (task: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTaskDelete?: (taskId: string) => void;
  editingState?: EditingState;
  onEditingStateChange?: (state: EditingState) => void;
  onFileImport: (file: File) => void;
  onExport: () => void;
  currentWorkspace?: Workspace;
}

interface DroppableColumnProps {
  columnName: string;
  columnTasks: Task[];
  getColumnColor: (columnName: string) => string;
  handleEditTask: (task: Task) => void;
  handleToggleFavorite: (taskId: string) => void;
  handleDeleteTask: (taskId: string) => void;
  activeTask: Task | null;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  columnName,
  columnTasks,
  getColumnColor,
  handleEditTask,
  handleToggleFavorite,
  handleDeleteTask,
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
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDeleteTask}
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
  onTaskDelete,
  editingState: externalEditingState,
  onEditingStateChange,
  onFileImport,
  onExport,
  currentWorkspace
}) => {
  const [columnType, setColumnType] = useState<ColumnType>(COLUMN_TYPES.STATUS);
  const [searchAndFilter, setSearchAndFilter] = useState<SearchAndFilterState>(defaultSearchAndFilterState);
  const [showSearchAndFilter, setShowSearchAndFilter] = useState(false);
  
  // Add state for drag & drop
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Add state for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    taskId: string | null;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: null,
    taskTitle: ''
  });
  
  // Use external editing state if provided, otherwise use internal state
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

  // Apply search and filter to tasks
  const filteredTasks = useMemo(() => {
    return filterTasks(tasks, searchAndFilter);
  }, [tasks, searchAndFilter]);

  const columns = useMemo(() => {
    switch (columnType) {
      case COLUMN_TYPES.STATUS:
        return {
          [TASK_STATUSES.TODO]: filteredTasks.filter(task => task.status === TASK_STATUSES.TODO),
          [TASK_STATUSES.IN_PROGRESS]: filteredTasks.filter(task => task.status === TASK_STATUSES.IN_PROGRESS),
          [TASK_STATUSES.IN_REVIEW]: filteredTasks.filter(task => task.status === TASK_STATUSES.IN_REVIEW),
          [TASK_STATUSES.DONE]: filteredTasks.filter(task => task.status === TASK_STATUSES.DONE),
        };
      case COLUMN_TYPES.EPIC:
        const epicGroups: Record<string, Task[]> = {};
        filteredTasks.forEach(task => {
          const epic = task.epic || 'No Epic';
          if (!epicGroups[epic]) {
            epicGroups[epic] = [];
          }
          epicGroups[epic].push(task);
        });
        return epicGroups;
      case COLUMN_TYPES.SPRINT:
        const sprintGroups: Record<string, Task[]> = {};
        filteredTasks.forEach(task => {
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
  }, [filteredTasks, columnType]);

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

  const handleTaskSave = useCallback((task: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, originalId?: string) => {
    if (editingState.isCreating) {
      onTaskCreate(task as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
    } else {
      // If originalId is provided, it means the ID was changed
      if (originalId) {
        onTaskUpdate(task as Task, originalId);
      } else {
        onTaskUpdate(task as Task);
      }
    }
    handleModalClose();
  }, [editingState.isCreating, onTaskCreate, onTaskUpdate, handleModalClose]);

  const handleToggleFavorite = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask = { ...task, isFavorite: !task.isFavorite, updatedAt: new Date() };
      onTaskUpdate(updatedTask);
    }
  }, [tasks, onTaskUpdate]);

  const handleDeleteTask = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setDeleteConfirmation({
        isOpen: true,
        taskId: taskId,
        taskTitle: task.title
      });
    }
  }, [tasks]);

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirmation.taskId && onTaskDelete) {
      onTaskDelete(deleteConfirmation.taskId);
    }
    setDeleteConfirmation({
      isOpen: false,
      taskId: null,
      taskTitle: ''
    });
  }, [deleteConfirmation.taskId, onTaskDelete]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmation({
      isOpen: false,
      taskId: null,
      taskTitle: ''
    });
  }, []);

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

  const toggleSearchAndFilter = useCallback(() => {
    setShowSearchAndFilter(prev => !prev);
  }, []);

  const totalTasksCount = tasks.length;
  const filteredTasksCount = filteredTasks.length;
  const hasActiveFilters = hasActiveSearchOrFilter(searchAndFilter);

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
            <button 
              className={`search-filter-toggle ${showSearchAndFilter ? 'active' : ''}`}
              onClick={toggleSearchAndFilter}
              aria-label="Toggle search and filter controls"
            >
              🔍 {showSearchAndFilter ? 'Hide' : 'Search'} & Filter
              {hasActiveFilters && <span className="active-indicator">●</span>}
            </button>
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
          {hasActiveFilters && (
            <div className="filter-status-bar">
              Showing {filteredTasksCount} of {totalTasksCount} tasks
            </div>
          )}
        </div>

        {showSearchAndFilter && (
          <SearchAndFilter
            tasks={tasks}
            searchAndFilter={searchAndFilter}
            onSearchAndFilterChange={setSearchAndFilter}
          />
        )}

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
              handleToggleFavorite={handleToggleFavorite}
              handleDeleteTask={handleDeleteTask}
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
            existingEpics={Array.from(new Set(tasks.map(t => t.epic).filter(Boolean)))}
            existingTaskIds={tasks.map(t => t.id)}
            currentWorkspace={currentWorkspace}
          />
        )}

        <ConfirmDialog
          isOpen={deleteConfirmation.isOpen}
          title="Delete Task"
          message={`Are you sure you want to delete "${deleteConfirmation.taskTitle}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </DndContext>
  );
};

export default Board;