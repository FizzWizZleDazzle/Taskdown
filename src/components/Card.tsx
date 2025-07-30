import React from 'react';
import { Task, ChecklistItem } from '../types';
import './Card.css';

interface CardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

const Card: React.FC<CardProps> = ({ task, onEdit }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Epic': return '#8B5CF6';
      case 'Story': return '#06B6D4';
      case 'Task': return '#10B981';
      case 'Bug': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return '#DC2626';
      case 'High': return '#EA580C';
      case 'Medium': return '#D97706';
      case 'Low': return '#65A30D';
      default: return '#6B7280';
    }
  };

  const getCompletedCount = (items: ChecklistItem[]) => {
    return items.filter(item => item.completed).length;
  };

  const getProgressPercentage = (items: ChecklistItem[]) => {
    if (items.length === 0) return 0;
    return Math.round((getCompletedCount(items) / items.length) * 100);
  };

  return (
    <div className="card" data-status={task.status} onClick={() => onEdit(task)}>
      <div className="card-header">
        <div className="card-id">{task.id}</div>
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
  );
};

export default Card;