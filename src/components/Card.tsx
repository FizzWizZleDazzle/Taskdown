import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task, ChecklistItem } from '../types';
import { COLORS } from '../constants';
import './Card.css';

interface CardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onToggleFavorite?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  isDragging?: boolean;
}

const Card: React.FC<CardProps> = ({ task, onEdit, onToggleFavorite, onDelete, isDragging = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging: isDragActive,
  } = useDraggable({
    id: task.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging || isDragActive ? 0.5 : 1,
  };

  const getTypeColor = (type: string) => {
    return COLORS.TYPE[type as keyof typeof COLORS.TYPE] || COLORS.TYPE.DEFAULT;
  };

  const getPriorityColor = (priority: string) => {
    return COLORS.PRIORITY[priority as keyof typeof COLORS.PRIORITY] || COLORS.PRIORITY.DEFAULT;
  };

  const getCompletedCount = (items: ChecklistItem[]) => {
    return items.filter(item => item.completed).length;
  };

  const getProgressPercentage = (items: ChecklistItem[]) => {
    if (items.length === 0) return 0;
    return Math.round((getCompletedCount(items) / items.length) * 100);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only handle click if we're not dragging and onEdit is provided
    if (!isDragActive && !isDragging && onEdit) {
      e.stopPropagation();
      onEdit(task);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onEdit) {
      e.preventDefault();
      onEdit(task);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="card" 
      data-status={task.status} 
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onEdit ? 0 : -1}
      role={onEdit ? "button" : undefined}
      aria-label={onEdit ? `Edit task ${task.id}: ${task.title}` : undefined}
    >
      {/* Drag handle - top section */}
      <div {...listeners} className="card-drag-handle">
        <div className="card-header">
          <div className="card-header-left">
            {task.thumbnail && (
              <div className="card-thumbnail">
                <img src={task.thumbnail} alt={`${task.title} thumbnail`} />
              </div>
            )}
            <div className="card-id">{task.id}</div>
          </div>
          <div className="card-header-right">
            <div className="card-actions">
              {onToggleFavorite && (
                <button
                  className={`favorite-btn ${task.isFavorite ? 'favorited' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(task.id);
                  }}
                  aria-label={task.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  title={task.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {task.isFavorite ? '★' : '☆'}
                </button>
              )}
              {onDelete && (
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  aria-label="Delete task"
                  title="Delete task"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="card-badges">
          <span 
            className="badge type-badge" 
            style={{ backgroundColor: getTypeColor(task.type) }}
          >
            {task.type}
          </span>
          <span 
            className="badge priority-badge" 
            style={{ backgroundColor: getPriorityColor(task.priority) }}
          >
            {task.priority}
          </span>
        </div>
      </div>
      
      {/* Click to edit area - rest of the card */}
      <div className="card-content">
        <h3 className="card-title">{task.title}</h3>
        
        <div className="card-meta">
          {task.storyPoints && (
            <div className="meta-item">
              <span className="meta-label">Story Points:</span>
              <span className="story-points">{task.storyPoints}</span>
            </div>
          )}
          {task.sprint && (
            <div className="meta-item">
              <span className="meta-label">Sprint:</span>
              <span>{task.sprint}</span>
            </div>
          )}
          {task.epic && (
            <div className="meta-item">
              <span className="meta-label">Epic:</span>
              <span className="epic-name">{task.epic}</span>
            </div>
          )}
          {task.assignee && (
            <div className="meta-item">
              <span className="meta-label">Assignee:</span>
              <span>{task.assignee}</span>
            </div>
          )}
        </div>

        <p className="card-description">{task.description}</p>

        {task.acceptanceCriteria.length > 0 && (
          <div className="progress-section">
            <div className="progress-header">
              <span>Acceptance Criteria</span>
              <span className="progress-count">
                {getCompletedCount(task.acceptanceCriteria)}/{task.acceptanceCriteria.length}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgressPercentage(task.acceptanceCriteria)}%` }}
              />
            </div>
          </div>
        )}

        {task.technicalTasks.length > 0 && (
          <div className="progress-section">
            <div className="progress-header">
              <span>Technical Tasks</span>
              <span className="progress-count">
                {getCompletedCount(task.technicalTasks)}/{task.technicalTasks.length}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgressPercentage(task.technicalTasks)}%` }}
              />
            </div>
          </div>
        )}

        {(task.dependencies.length > 0 || task.blocks.length > 0) && (
          <div className="card-footer">
            {task.dependencies.length > 0 && (
              <div className="dependencies">
                <span className="deps-label">Depends on:</span>
                {task.dependencies.map(dep => (
                  <span key={dep} className="dep-tag">{dep}</span>
                ))}
              </div>
            )}
            {task.blocks.length > 0 && (
              <div className="dependencies">
                <span className="deps-label">Blocks:</span>
                {task.blocks.map(block => (
                  <span key={block} className="dep-tag">{block}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(Card);