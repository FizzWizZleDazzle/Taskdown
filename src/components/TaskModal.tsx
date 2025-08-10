import React, { useState, useEffect, useCallback } from 'react';
import { Task, TaskType, Priority, TaskStatus, ChecklistItem, Workspace } from '../types';
import { TASK_TYPES, PRIORITIES, TASK_STATUSES, DEFAULT_FORM_DATA } from '../constants';
import { useAIService } from '../hooks/useAIService';
import { IRemoteWorkspaceClient } from '../remoteClient';
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
  remoteClient?: IRemoteWorkspaceClient;
  aiEnabled?: boolean;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  task, 
  isOpen, 
  onClose, 
  onSave, 
  isCreating,
  existingEpics = [],
  existingTaskIds = [],
  currentWorkspace,
  remoteClient,
  aiEnabled = false
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

  // AI Service
  const aiService = useAIService(remoteClient);

  // AI assistance functions
  const handleAIGenerateTask = useCallback(async () => {
    if (!formData.title.trim()) {
      alert('Please enter a task title first');
      return;
    }

    const result = await aiService.generateTaskDetails({
      title: formData.title,
      type: formData.type,
      context: formData.description,
      epic: formData.epic
    });

    if (result) {
      if (result.description) {
        setFormData(prev => ({ ...prev, description: result.description }));
      }
      if (result.suggestedTitle && result.suggestedTitle !== formData.title) {
        setFormData(prev => ({ ...prev, title: result.suggestedTitle }));
      }
      if (result.suggestedType) {
        setFormData(prev => ({ ...prev, type: result.suggestedType }));
      }
      if (result.suggestedPriority) {
        setFormData(prev => ({ ...prev, priority: result.suggestedPriority }));
      }
      if (result.estimatedStoryPoints !== undefined) {
        setFormData(prev => ({ ...prev, storyPoints: result.estimatedStoryPoints }));
      }
      if (result.acceptanceCriteria.length > 0) {
        const newCriteria = result.acceptanceCriteria.map(text => ({ 
          text, 
          completed: false,
          id: `ai-ac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        setAcceptanceCriteria(prev => [...prev, ...newCriteria]);
      }
      if (result.technicalTasks.length > 0) {
        const newTasks = result.technicalTasks.map(text => ({ 
          text, 
          completed: false,
          id: `ai-tt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));
        setTechnicalTasks(prev => [...prev, ...newTasks]);
      }
    }
  }, [formData.title, formData.type, formData.description, formData.epic, aiService]);

  const handleAIGenerateAcceptanceCriteria = useCallback(async () => {
    if (!formData.title.trim()) {
      alert('Please enter a task title first');
      return;
    }

    const result = await aiService.generateAcceptanceCriteria({
      title: formData.title,
      description: formData.description,
      type: formData.type,
      existingCriteria: acceptanceCriteria.map(item => item.text)
    });

    if (result && result.length > 0) {
      const newCriteria = result.map(text => ({ 
        text, 
        completed: false,
        id: `ai-ac-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));
      setAcceptanceCriteria(prev => [...prev, ...newCriteria]);
    }
  }, [formData.title, formData.description, formData.type, acceptanceCriteria, aiService]);

  const handleAIEstimateStoryPoints = useCallback(async () => {
    if (!formData.title.trim()) {
      alert('Please enter a task title first');
      return;
    }

    const result = await aiService.estimateStoryPoints({
      title: formData.title,
      description: formData.description,
      acceptanceCriteria: acceptanceCriteria.map(item => item.text),
      technicalTasks: technicalTasks.map(item => item.text),
      type: formData.type
    });

    if (result !== null) {
      setFormData(prev => ({ ...prev, storyPoints: result }));
    }
  }, [formData.title, formData.description, formData.type, acceptanceCriteria, technicalTasks, aiService]);

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
      // Reset form for new task with crypto-generated ID
      const newId = `TASK-${crypto.randomUUID()}`;
      
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

        {aiService.state.error && (
          <div className="ai-error-message">
            <span>AI Error: {aiService.state.error}</span>
            <button type="button" onClick={aiService.clearError}>×</button>
          </div>
        )}

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
              <div className="field-with-ai">
                <label htmlFor="storyPoints">Story Points</label>
                {aiEnabled && (
                  <button 
                    type="button" 
                    className="ai-assist-btn small"
                    onClick={handleAIEstimateStoryPoints}
                    disabled={aiService.state.loading}
                    title="Estimate story points with AI"
                  >
                    {aiService.state.loading ? '⏳' : '🤖'} AI Estimate
                  </button>
                )}
              </div>
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
            <div className="field-with-ai">
              <label htmlFor="description">Description</label>
              {aiEnabled && (
                <button 
                  type="button" 
                  className="ai-assist-btn"
                  onClick={handleAIGenerateTask}
                  disabled={aiService.state.loading}
                  title="Generate task details with AI"
                >
                  {aiService.state.loading ? '⏳' : '🤖'} AI Generate
                </button>
              )}
            </div>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              placeholder="Describe the task..."
            />
          </div>

          <div className="checklist-section">
            <div className="field-with-ai">
              <h3>Acceptance Criteria</h3>
              {aiEnabled && (
                <button 
                  type="button" 
                  className="ai-assist-btn small"
                  onClick={handleAIGenerateAcceptanceCriteria}
                  disabled={aiService.state.loading}
                  title="Generate acceptance criteria with AI"
                >
                  {aiService.state.loading ? '⏳' : '🤖'} AI Suggest
                </button>
              )}
            </div>
            <Checklist
              title=""
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