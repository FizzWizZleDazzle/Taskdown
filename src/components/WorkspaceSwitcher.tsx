import React, { useState } from 'react';
import { Workspace } from '../types';
import './WorkspaceSwitcher.css';

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onWorkspaceChange: (workspace: Workspace) => void;
  onWorkspaceCreate: (workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onWorkspaceDelete: (workspaceId: string) => void;
  onWorkspaceEdit: (workspace: Workspace) => void;
}

const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  workspaces,
  currentWorkspace,
  onWorkspaceChange,
  onWorkspaceCreate,
  onWorkspaceDelete,
  onWorkspaceEdit
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleCreateWorkspace = () => {
    if (newWorkspaceName.trim()) {
      onWorkspaceCreate({
        name: newWorkspaceName.trim(),
        description: newWorkspaceDescription.trim() || undefined
      });
      setNewWorkspaceName('');
      setNewWorkspaceDescription('');
      setIsCreating(false);
    }
  };

  const handleEditWorkspace = (workspace: Workspace) => {
    onWorkspaceEdit({
      ...workspace,
      name: editName.trim(),
      description: editDescription.trim() || undefined
    });
    setEditingId(null);
  };

  const startEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setEditName(workspace.name);
    setEditDescription(workspace.description || '');
  };

  const handleDeleteWorkspace = (workspaceId: string) => {
    if (workspaces.length > 1) {
      if (confirm('Are you sure you want to delete this workspace? All tasks will be lost.')) {
        onWorkspaceDelete(workspaceId);
      }
    } else {
      alert('You cannot delete the last workspace.');
    }
  };

  return (
    <div className="workspace-switcher">
      <button 
        className="workspace-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch workspace"
      >
        <span className="workspace-icon">📁</span>
        <span className="workspace-name">{currentWorkspace.name}</span>
        <span className="workspace-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="workspace-dropdown">
          <div className="workspace-list">
            {workspaces.map(workspace => (
              <div key={workspace.id} className="workspace-item">
                {editingId === workspace.id ? (
                  <div className="workspace-edit-form">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Workspace name"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                    />
                    <div className="workspace-edit-actions">
                      <button onClick={() => handleEditWorkspace(workspace)}>Save</button>
                      <button onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div 
                      className={`workspace-info ${workspace.id === currentWorkspace.id ? 'active' : ''}`}
                      onClick={() => {
                        onWorkspaceChange(workspace);
                        setIsOpen(false);
                      }}
                    >
                      <div className="workspace-header">
                        <span className="workspace-id">{workspace.id}</span>
                        {workspace.id === currentWorkspace.id && <span className="active-indicator">✓</span>}
                      </div>
                      <div className="workspace-title">{workspace.name}</div>
                      {workspace.description && (
                        <div className="workspace-description">{workspace.description}</div>
                      )}
                    </div>
                    <div className="workspace-actions">
                      <button 
                        onClick={() => startEdit(workspace)}
                        aria-label="Edit workspace"
                        title="Edit workspace"
                      >
                        ✏️
                      </button>
                      {workspaces.length > 1 && (
                        <button 
                          onClick={() => handleDeleteWorkspace(workspace.id)}
                          aria-label="Delete workspace"
                          title="Delete workspace"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {isCreating ? (
            <div className="workspace-create-form">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Workspace name"
                autoFocus
              />
              <input
                type="text"
                value={newWorkspaceDescription}
                onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                placeholder="Description (optional)"
              />
              <div className="workspace-create-actions">
                <button onClick={handleCreateWorkspace}>Create</button>
                <button onClick={() => {
                  setIsCreating(false);
                  setNewWorkspaceName('');
                  setNewWorkspaceDescription('');
                }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button 
              className="workspace-create-button"
              onClick={() => setIsCreating(true)}
            >
              + New Workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;