import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskType, Priority, TaskStatus, ChecklistItem, Workspace } from '../types';
import { TASK_TYPES, PRIORITIES, TASK_STATUSES, DEFAULT_FORM_DATA } from '../constants';
import Checklist from './Checklist';
import './TaskModal.css';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task | Omit<Task, 'id' | 'createdAt' | 'updatedAt'>, originalId?: string) => void;
  isCreating: boolean;
  existingEpics?: string[];
  existingTaskIds?: string[];
  currentWorkspace?: Workspace;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onSave, 
  isCreating,
  existingEpics = [],
  existingTaskIds = [],
  currentWorkspace
}) => {
  const [formData, setFormData] = useState({
    id: '',
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
    blocks: [] as string[],
    isFavorite: false,
    thumbnail: ''
  });

  const [acceptanceCriteria, setAcceptanceCriteria] = useState<ChecklistItem[]>([]);
  const [technicalTasks, setTechnicalTasks] = useState<ChecklistItem[]>([]);
  const [dependencyInput, setDependencyInput] = useState('');
  const [blockInput, setBlockInput] = useState('');
  const [idError, setIdError] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        id: task.id,
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
        blocks: [...task.blocks],
        isFavorite: task.isFavorite || false,
        thumbnail: task.thumbnail || ''
      });
      setAcceptanceCriteria([...task.acceptanceCriteria]);
      setTechnicalTasks([...task.technicalTasks]);
    } else {
      // Reset form for new task with workspace-based ID
      const workspaceId = currentWorkspace?.id || 'DEFAULT';
      const workspaceTasks = existingTaskIds.filter(id => id.startsWith(`${workspaceId}-`));
      const numbers = workspaceTasks.map(id => {
        const match = id.match(new RegExp(`^${workspaceId}-(\\d+)$`));
        return match ? parseInt(match[1], 10) : 0;
      });
      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
      const newId = `${workspaceId}-${nextNumber}`;
      
      setFormData({ ...DEFAULT_FORM_DATA, id: newId });
      setAcceptanceCriteria([]);
      setTechnicalTasks([]);
    }
    setDependencyInput('');
    setBlockInput('');
    setIdError('');
  }, [task, isOpen, currentWorkspace, existingTaskIds]);

  type FormDataType = typeof formData;
  
  const handleInputChange = <K extends keyof FormDataType>(field: K, value: FormDataType[K] | string | number) => {
    if (field === 'id') {
      const newId = value as string;
      // Check if ID already exists (only for new tasks or if changing existing ID)
      if (isCreating && existingTaskIds.includes(newId)) {
        setIdError('This ID already exists. Please choose a different one.');
      } else if (!isCreating && task?.id !== newId && existingTaskIds.includes(newId)) {
        setIdError('This ID already exists. Please choose a different one.');
      } else {
        setIdError('');
      }
    }
    setFormData(prev => ({ ...prev, [field]: value as FormDataType[K] }));
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
    
    // Don't submit if there's an ID error
    if (idError) {
      return;
    }
    
    const taskData = {
      ...formData,
      acceptanceCriteria,
      technicalTasks,
      ...(task && { 
        createdAt: task.createdAt, 
        updatedAt: new Date() 
      }),
      ...(isCreating && { 
        createdAt: new Date(),
        updatedAt: new Date() 
      })
    };

    // Pass original ID if we're editing and the ID has changed
    if (!isCreating && task && task.id !== formData.id) {
      onSave(taskData, task.id);
    } else {
      onSave(taskData);
    }
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
              <label htmlFor="taskId">Task ID *</label>
              <input
                id="taskId"
                type="text"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                required
                className={idError ? 'error' : ''}
              />
              {idError && <span className="error-message">{idError}</span>}
            </div>

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
                list="epic-options"
              />
              <datalist id="epic-options">
                {existingEpics.map(epic => (
                  <option key={epic} value={epic} />
                ))}
              </datalist>
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

            <div className="form-group">
              <label htmlFor="thumbnail">Thumbnail URL</label>
              <input
                id="thumbnail"
                type="url"
                value={formData.thumbnail}
                onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                placeholder="e.g., https://example.com/image.png or data:image/..."
              />
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="isFavorite" className="checkbox-label">
                <input
                  id="isFavorite"
                  type="checkbox"
                  checked={formData.isFavorite}
                  onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                />
                <span className="checkbox-text">Mark as favorite</span>
              </label>
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