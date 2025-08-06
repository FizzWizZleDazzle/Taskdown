import React, { useState } from 'react';
import { Workspace, WorkspaceType, AuthConfig } from '../types';
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
  
  // Form state for creating/editing workspaces
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'local' as WorkspaceType,
    baseUrl: '',
    authType: 'api-key' as AuthConfig['type'],
    authToken: '',
    authUsername: '',
    authPassword: '',
    customHeaders: '',
    timeout: 10000,
    retryAttempts: 3
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'local',
      baseUrl: '',
      authType: 'api-key',
      authToken: '',
      authUsername: '',
      authPassword: '',
      customHeaders: '',
      timeout: 10000,
      retryAttempts: 3
    });
  };

  const handleCreateWorkspace = () => {
    if (!formData.name.trim()) return;
    
    const workspaceData: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type
    };

    if (formData.type === 'remote') {
      if (!formData.baseUrl.trim()) {
        alert('Base URL is required for remote workspaces');
        return;
      }

      const authConfig: AuthConfig | undefined = formData.authToken || formData.authUsername || formData.customHeaders 
        ? {
            type: formData.authType,
            ...(formData.authType === 'api-key' || formData.authType === 'bearer' ? { token: formData.authToken } : {}),
            ...(formData.authType === 'basic' ? { username: formData.authUsername, password: formData.authPassword } : {}),
            ...(formData.authType === 'custom' ? { customHeaders: JSON.parse(formData.customHeaders || '{}') } : {})
          }
        : undefined;

      workspaceData.remoteConfig = {
        baseUrl: formData.baseUrl.trim(),
        authConfig,
        timeout: formData.timeout,
        retryAttempts: formData.retryAttempts
      };
    }

    onWorkspaceCreate(workspaceData);
    resetForm();
    setIsCreating(false);
  };

  const handleEditWorkspace = (workspace: Workspace) => {
    const workspaceData: Workspace = {
      ...workspace,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    };

    if (workspace.type === 'remote') {
      if (!formData.baseUrl.trim()) {
        alert('Base URL is required for remote workspaces');
        return;
      }

      const authConfig: AuthConfig | undefined = formData.authToken || formData.authUsername || formData.customHeaders
        ? {
            type: formData.authType,
            ...(formData.authType === 'api-key' || formData.authType === 'bearer' ? { token: formData.authToken } : {}),
            ...(formData.authType === 'basic' ? { username: formData.authUsername, password: formData.authPassword } : {}),
            ...(formData.authType === 'custom' ? { customHeaders: JSON.parse(formData.customHeaders || '{}') } : {})
          }
        : undefined;

      workspaceData.remoteConfig = {
        baseUrl: formData.baseUrl.trim(),
        authConfig,
        timeout: formData.timeout,
        retryAttempts: formData.retryAttempts
      };
    }

    onWorkspaceEdit(workspaceData);
    setEditingId(null);
    resetForm();
  };

  const startEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setFormData({
      name: workspace.name,
      description: workspace.description || '',
      type: workspace.type,
      baseUrl: workspace.remoteConfig?.baseUrl || '',
      authType: workspace.remoteConfig?.authConfig?.type || 'api-key',
      authToken: workspace.remoteConfig?.authConfig?.token || '',
      authUsername: workspace.remoteConfig?.authConfig?.username || '',
      authPassword: workspace.remoteConfig?.authConfig?.password || '',
      customHeaders: workspace.remoteConfig?.authConfig?.customHeaders ? JSON.stringify(workspace.remoteConfig.authConfig.customHeaders, null, 2) : '',
      timeout: workspace.remoteConfig?.timeout || 10000,
      retryAttempts: workspace.remoteConfig?.retryAttempts || 3
    });
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

  const getConnectionStatusIcon = (workspace: Workspace) => {
    if (workspace.type === 'local') return '💾';
    
    const status = workspace.connectionStatus;
    if (!status) return '❓';
    
    if (!status.connected) return '🔴';
    if (!status.authenticated) return '🟡';
    return '🟢';
  };

  const getConnectionStatusText = (workspace: Workspace) => {
    if (workspace.type === 'local') return 'Local';
    
    const status = workspace.connectionStatus;
    if (!status) return 'Unknown';
    
    if (!status.connected) return `Disconnected${status.error ? `: ${status.error}` : ''}`;
    if (!status.authenticated) return 'Connected (Not authenticated)';
    return `Connected${status.serverVersion ? ` (v${status.serverVersion})` : ''}`;
  };

  return (
    <div className="workspace-switcher">
      <button 
        className="workspace-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Switch workspace"
      >
        <span className="workspace-icon">{getConnectionStatusIcon(currentWorkspace)}</span>
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
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Workspace name"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description (optional)"
                    />
                    
                    {workspace.type === 'remote' && (
                      <>
                        <input
                          type="text"
                          value={formData.baseUrl}
                          onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                          placeholder="Base URL (e.g., https://api.example.com)"
                        />
                        
                        <select
                          value={formData.authType}
                          onChange={(e) => setFormData({ ...formData, authType: e.target.value as AuthConfig['type'] })}
                        >
                          <option value="api-key">API Key</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="basic">Basic Auth</option>
                          <option value="custom">Custom Headers</option>
                        </select>
                        
                        {(formData.authType === 'api-key' || formData.authType === 'bearer') && (
                          <input
                            type="password"
                            value={formData.authToken}
                            onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
                            placeholder="Token"
                          />
                        )}
                        
                        {formData.authType === 'basic' && (
                          <>
                            <input
                              type="text"
                              value={formData.authUsername}
                              onChange={(e) => setFormData({ ...formData, authUsername: e.target.value })}
                              placeholder="Username"
                            />
                            <input
                              type="password"
                              value={formData.authPassword}
                              onChange={(e) => setFormData({ ...formData, authPassword: e.target.value })}
                              placeholder="Password"
                            />
                          </>
                        )}
                        
                        {formData.authType === 'custom' && (
                          <textarea
                            value={formData.customHeaders}
                            onChange={(e) => setFormData({ ...formData, customHeaders: e.target.value })}
                            placeholder='{"X-Auth-Token": "your-token"}'
                            rows={3}
                          />
                        )}
                      </>
                    )}
                    
                    <div className="workspace-edit-actions">
                      <button onClick={() => handleEditWorkspace(workspace)}>Save</button>
                      <button onClick={() => {
                        setEditingId(null);
                        resetForm();
                      }}>Cancel</button>
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
                        <span className="workspace-type-badge">{workspace.type}</span>
                        {workspace.id === currentWorkspace.id && <span className="active-indicator">✓</span>}
                      </div>
                      <div className="workspace-title">{workspace.name}</div>
                      {workspace.description && (
                        <div className="workspace-description">{workspace.description}</div>
                      )}
                      <div className="workspace-status" title={getConnectionStatusText(workspace)}>
                        {getConnectionStatusIcon(workspace)} {getConnectionStatusText(workspace)}
                      </div>
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
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Workspace name"
                autoFocus
              />
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description (optional)"
              />
              
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as WorkspaceType })}
              >
                <option value="local">Local</option>
                <option value="remote">Remote</option>
              </select>
              
              {formData.type === 'remote' && (
                <>
                  <input
                    type="text"
                    value={formData.baseUrl}
                    onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                    placeholder="Base URL (e.g., https://api.example.com)"
                  />
                  
                  <select
                    value={formData.authType}
                    onChange={(e) => setFormData({ ...formData, authType: e.target.value as AuthConfig['type'] })}
                  >
                    <option value="api-key">API Key</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="custom">Custom Headers</option>
                  </select>
                  
                  {(formData.authType === 'api-key' || formData.authType === 'bearer') && (
                    <input
                      type="password"
                      value={formData.authToken}
                      onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
                      placeholder="Token (optional)"
                    />
                  )}
                  
                  {formData.authType === 'basic' && (
                    <>
                      <input
                        type="text"
                        value={formData.authUsername}
                        onChange={(e) => setFormData({ ...formData, authUsername: e.target.value })}
                        placeholder="Username (optional)"
                      />
                      <input
                        type="password"
                        value={formData.authPassword}
                        onChange={(e) => setFormData({ ...formData, authPassword: e.target.value })}
                        placeholder="Password (optional)"
                      />
                    </>
                  )}
                  
                  {formData.authType === 'custom' && (
                    <textarea
                      value={formData.customHeaders}
                      onChange={(e) => setFormData({ ...formData, customHeaders: e.target.value })}
                      placeholder='{"X-Auth-Token": "your-token"} (optional)'
                      rows={3}
                    />
                  )}
                  
                  <div className="advanced-options">
                    <label>
                      Timeout (ms):
                      <input
                        type="number"
                        value={formData.timeout}
                        onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) || 10000 })}
                        min="1000"
                        max="60000"
                      />
                    </label>
                    <label>
                      Retry Attempts:
                      <input
                        type="number"
                        value={formData.retryAttempts}
                        onChange={(e) => setFormData({ ...formData, retryAttempts: parseInt(e.target.value) || 3 })}
                        min="1"
                        max="10"
                      />
                    </label>
                  </div>
                </>
              )}
              
              <div className="workspace-create-actions">
                <button onClick={handleCreateWorkspace}>Create</button>
                <button onClick={() => {
                  setIsCreating(false);
                  resetForm();
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