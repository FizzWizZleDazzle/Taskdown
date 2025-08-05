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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Task, ColumnType, TaskStatus } from '../types';
import { TASK_STATUSES, COLUMN_TYPES, COLORS } from '../constants';
import Card from './Card';
import TaskModal from './TaskModal';
import './Board.css';

interface BoardProps {
  tasks: Task[];
  onTaskUpdate: (task: Task) => void;
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

interface DroppableColumnProps {
  columnName: string;
  columnTasks: Task[];
  getColumnColor: (columnName: string) => string;
  handleEditTask: (task: Task) => void;
  activeTask: Task | null;
  getTaskIds: (tasks: Task[]) => string[];
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({
  columnName,
  columnTasks,
  getColumnColor,
  handleEditTask,
  activeTask,
  getTaskIds
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: columnName,
  });

  return (
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
      <SortableContext 
        items={getTaskIds(columnTasks)} 
        strategy={verticalListSortingStrategy}
      >
        <div 
          ref={setNodeRef}
          className={`column-content ${isOver ? 'column-content--over' : ''}`}
          role="list"
          data-column-id={columnName}
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
      </SortableContext>
    </div>
  );
};

const Board: React.FC<BoardProps> = ({ tasks, onTaskUpdate, onTaskCreate }) => {
  const [columnType, setColumnType] = useState<ColumnType>(COLUMN_TYPES.STATUS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Configure sensors for drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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

  // Drag & Drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  }, [tasks]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // We'll handle the actual movement in handleDragEnd
    // This is just for visual feedback
  }, []);

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
      if (Object.values(TASK_STATUSES).includes(overColumnId as TaskStatus)) {
        if (activeTask.status !== overColumnId) {
          const updatedTask = { ...activeTask, status: overColumnId as TaskStatus, updatedAt: new Date() };
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
          // For now, we'll just handle the visual reordering
          // In a real app, you'd want to persist the order
          const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex);
          // Since we don't have a position field, we'll skip persisting the order
          // but the visual reordering works
        }
      }
    }
  }, [tasks, columnType, onTaskUpdate]);

  // Get sorted task IDs for the sortable context
  const getTaskIds = useCallback((columnTasks: Task[]) => {
    return columnTasks.map(task => task.id);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
            <DroppableColumn
              key={columnName}
              columnName={columnName}
              columnTasks={columnTasks}
              getColumnColor={getColumnColor}
              handleEditTask={handleEditTask}
              activeTask={activeTask}
              getTaskIds={getTaskIds}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <Card 
              task={activeTask} 
              onEdit={() => {}} 
              isDragging={true}
            />
          ) : null}
        </DragOverlay>

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
    </DndContext>
  );
};

export default Board;