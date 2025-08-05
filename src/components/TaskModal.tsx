import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskType, Priority, TaskStatus, ChecklistItem } from '../types';
import { TASK_TYPES, PRIORITIES, TASK_STATUSES, DEFAULT_FORM_DATA } from '../constants';
import Checklist from './Checklist';
import './TaskModal.css';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  isCreating: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onSave, 
  isCreating 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    type: TASK_TYPES.STORY as TaskType,
    priority: PRIORITIES.MEDIUM as Priority,
    status: TASK_STATUSES.TODO as TaskStatus,
    storyPoints: 0,
    sprint: '',
    epic: '',
    description: '',
    assignee: '',
    dependencies: [] as string[],
    blocks: [] as string[]
  });

  const [acceptanceCriteria, setAcceptanceCriteria] = useState<ChecklistItem[]>([]);
  const [technicalTasks, setTechnicalTasks] = useState<ChecklistItem[]>([]);
  const [dependencyInput, setDependencyInput] = useState('');
  const [blockInput, setBlockInput] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        type: task.type,
        priority: task.priority,
        status: task.status,
        storyPoints: task.storyPoints || 0,
        sprint: task.sprint || '',
        epic: task.epic || '',
        description: task.description,
        assignee: task.assignee || '',
        dependencies: [...task.dependencies],
        blocks: [...task.blocks]
      });
      setAcceptanceCriteria([...task.acceptanceCriteria]);
      setTechnicalTasks([...task.technicalTasks]);
    } else {
      // Reset form for new task
      setFormData({ ...DEFAULT_FORM_DATA });
      setAcceptanceCriteria([]);
      setTechnicalTasks([]);
    }
    setDependencyInput('');
    setBlockInput('');
  }, [task, isOpen]);

  const handleInputChange = (field: keyof typeof formData, value: string | number | TaskType | Priority | TaskStatus) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddDependency = () => {
    if (dependencyInput.trim() && !formData.dependencies.includes(dependencyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        dependencies: [...prev.dependencies, dependencyInput.trim()]
      }));
      setDependencyInput('');
    }
  };

  const handleRemoveDependency = (dep: string) => {
    setFormData(prev => ({
      ...prev,
      dependencies: prev.dependencies.filter(d => d !== dep)
    }));
  };

  const handleAddBlock = () => {
    if (blockInput.trim() && !formData.blocks.includes(blockInput.trim())) {
      setFormData(prev => ({
        ...prev,
        blocks: [...prev.blocks, blockInput.trim()]
      }));
      setBlockInput('');
    }
  };

  const handleRemoveBlock = (block: string) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b !== block)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      ...formData,
      acceptanceCriteria,
      technicalTasks,
      ...(task && { 
        id: task.id, 
        createdAt: task.createdAt, 
        updatedAt: new Date() 
      }),
      ...(isCreating && { updatedAt: new Date() })
    };

    onSave(taskData);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="modal-header">
          <h2 id="modal-title">{isCreating ? 'Create New Task' : 'Edit Task'}</h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
              >
                <option value={TASK_TYPES.EPIC}>Epic</option>
                <option value={TASK_TYPES.STORY}>Story</option>
                <option value={TASK_TYPES.TASK}>Task</option>
                <option value={TASK_TYPES.BUG}>Bug</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => handleInputChange('priority', e.target.value)}
              >
                <option value={PRIORITIES.CRITICAL}>Critical</option>
                <option value={PRIORITIES.HIGH}>High</option>
                <option value={PRIORITIES.MEDIUM}>Medium</option>
                <option value={PRIORITIES.LOW}>Low</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value={TASK_STATUSES.TODO}>Todo</option>
                <option value={TASK_STATUSES.IN_PROGRESS}>In Progress</option>
                <option value={TASK_STATUSES.IN_REVIEW}>In Review</option>
                <option value={TASK_STATUSES.DONE}>Done</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="storyPoints">Story Points</label>
              <input
                id="storyPoints"
                type="number"
                min="0"
                max="100"
                value={formData.storyPoints}
                onChange={(e) => handleInputChange('storyPoints', Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="sprint">Sprint</label>
              <input
                id="sprint"
                type="text"
                value={formData.sprint}
                onChange={(e) => handleInputChange('sprint', e.target.value)}
                placeholder="e.g., Sprint 1-2"
              />
            </div>

            <div className="form-group">
              <label htmlFor="epic">Epic</label>
              <input
                id="epic"
                type="text"
                value={formData.epic}
                onChange={(e) => handleInputChange('epic', e.target.value)}
                placeholder="e.g., Launcher Core Functionality"
              />
            </div>

            <div className="form-group">
              <label htmlFor="assignee">Assignee</label>
              <input
                id="assignee"
                type="text"
                value={formData.assignee}
                onChange={(e) => handleInputChange('assignee', e.target.value)}
                placeholder="e.g., john.doe@example.com"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              placeholder="Describe the task..."
            />
          </div>

          <div className="checklist-section">
            <Checklist
              title="Acceptance Criteria"
              items={acceptanceCriteria}
              onChange={setAcceptanceCriteria}
            />
          </div>

          <div className="checklist-section">
            <Checklist
              title="Technical Tasks"
              items={technicalTasks}
              onChange={setTechnicalTasks}
            />
          </div>

          <div className="dependencies-section">
            <div className="form-group">
              <label>Dependencies</label>
              <div className="input-with-add">
                <input
                  type="text"
                  value={dependencyInput}
                  onChange={(e) => setDependencyInput(e.target.value)}
                  placeholder="Enter task ID"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDependency())}
                />
                <button type="button" onClick={handleAddDependency}>Add</button>
              </div>
              <div className="tags">
                {formData.dependencies.map(dep => (
                  <span key={dep} className="tag">
                    {dep}
                    <button type="button" onClick={() => handleRemoveDependency(dep)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Blocks</label>
              <div className="input-with-add">
                <input
                  type="text"
                  value={blockInput}
                  onChange={(e) => setBlockInput(e.target.value)}
                  placeholder="Enter task ID"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBlock())}
                />
                <button type="button" onClick={handleAddBlock}>Add</button>
              </div>
              <div className="tags">
                {formData.blocks.map(block => (
                  <span key={block} className="tag">
                    {block}
                    <button type="button" onClick={() => handleRemoveBlock(block)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {isCreating ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;