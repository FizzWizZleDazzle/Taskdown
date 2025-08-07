import React, { useState, useEffect } from 'react';
import { WorkspaceConfig } from '../types';
import { IRemoteWorkspaceClient } from '../remoteClient';
import './ConfigPanel.css';

interface ConfigPanelProps {
  remoteClient?: IRemoteWorkspaceClient;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ remoteClient }) => {
  const [config, setConfig] = useState<WorkspaceConfig | null>(null);
  const [editedConfig, setEditedConfig] = useState<WorkspaceConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const loadConfig = async () => {
    if (!remoteClient) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await remoteClient.getConfig();
      setConfig(data);
      setEditedConfig(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!remoteClient || !editedConfig) return;
    
    try {
      setSaving(true);
      setError(null);
      await remoteClient.updateConfig(editedConfig);
      setConfig(editedConfig);
      setHasChanges(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfigChange = (path: string[], value: any) => {
    if (!editedConfig) return;
    
    setEditedConfig(prev => {
      if (!prev) return prev;
      
      const newConfig = { ...prev };
      let current: any = newConfig;
      
      for (let i = 0; i < path.length - 1; i++) {
        // Initialize nested objects if they don't exist
        if (!current[path[i]]) {
          current[path[i]] = {};
        } else {
          current[path[i]] = { ...current[path[i]] };
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newConfig;
    });
    
    setHasChanges(true);
  };

  const resetChanges = () => {
    setEditedConfig(config);
    setHasChanges(false);
  };

  useEffect(() => {
    loadConfig();
  }, [remoteClient]);

  if (!remoteClient) {
    return (
      <div className="config-panel-container">
        <p className="config-panel-no-remote">Configuration settings are only available for remote workspaces.</p>
      </div>
    );
  }

  if (loading && !config) {
    return (
      <div className="config-panel-container">
        <p className="config-panel-loading">Loading configuration...</p>
      </div>
    );
  }

  if (error && !config) {
    return (
      <div className="config-panel-container">
        <div className="config-panel-error">
          <h3>Error loading configuration</h3>
          <p>{error}</p>
          <button onClick={loadConfig} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!editedConfig) return null;

  return (
    <div className="config-panel-container">
      <div className="config-panel-header">
        <h2 className="config-panel-title">⚙️ Workspace Configuration</h2>
        {hasChanges && (
          <div className="changes-indicator">
            <span className="changes-dot">●</span>
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      {error && (
        <div className="config-panel-error inline">
          <p>{error}</p>
        </div>
      )}

      <div className="config-sections">
        <div className="config-section">
          <h3 className="section-title">🏢 General Settings</h3>
          
          <div className="config-group">
            <label htmlFor="workspace-name">Workspace Name</label>
            <input
              id="workspace-name"
              type="text"
              value={editedConfig.workspaceName}
              onChange={(e) => handleConfigChange(['workspaceName'], e.target.value)}
              placeholder="My Workspace"
            />
          </div>

          <div className="config-group">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              value={editedConfig.timezone}
              onChange={(e) => handleConfigChange(['timezone'], e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Shanghai">Shanghai</option>
              <option value="Australia/Sydney">Sydney</option>
            </select>
          </div>

          <div className="config-group">
            <label htmlFor="date-format">Date Format</label>
            <select
              id="date-format"
              value={editedConfig.dateFormat}
              onChange={(e) => handleConfigChange(['dateFormat'], e.target.value)}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              <option value="DD MMM YYYY">DD MMM YYYY</option>
            </select>
          </div>
        </div>

        <div className="config-section">
          <h3 className="section-title">🔧 Features</h3>
          
          <div className="feature-toggles">
            <div className="feature-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={editedConfig.features.realtime}
                  onChange={(e) => handleConfigChange(['features', 'realtime'], e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <div className="toggle-content">
                  <span className="toggle-name">📡 Real-time Collaboration</span>
                  <span className="toggle-description">Enable live updates and collaborative editing</span>
                </div>
              </label>
            </div>

            <div className="feature-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={editedConfig.features.analytics}
                  onChange={(e) => handleConfigChange(['features', 'analytics'], e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <div className="toggle-content">
                  <span className="toggle-name">📊 Analytics & Reporting</span>
                  <span className="toggle-description">Enable advanced analytics and reporting features</span>
                </div>
              </label>
            </div>

            <div className="feature-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={editedConfig.features.webhooks}
                  onChange={(e) => handleConfigChange(['features', 'webhooks'], e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <div className="toggle-content">
                  <span className="toggle-name">🔗 Webhooks</span>
                  <span className="toggle-description">Enable external integrations via webhooks</span>
                </div>
              </label>
            </div>

            <div className="feature-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={editedConfig.features.customFields}
                  onChange={(e) => handleConfigChange(['features', 'customFields'], e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <div className="toggle-content">
                  <span className="toggle-name">🏷️ Custom Fields</span>
                  <span className="toggle-description">Allow custom fields and metadata on tasks</span>
                </div>
              </label>
            </div>

            <div className="feature-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={editedConfig.features.ai}
                  onChange={(e) => handleConfigChange(['features', 'ai'], e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <div className="toggle-content">
                  <span className="toggle-name">🤖 AI Assistant</span>
                  <span className="toggle-description">Enable AI-powered task generation and suggestions</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {editedConfig.features.ai && (
          <div className="config-section">
            <h3 className="section-title">🤖 AI Configuration</h3>
            
            <div className="config-group">
              <label htmlFor="ai-provider">AI Provider</label>
              <select
                id="ai-provider"
                value={editedConfig.ai?.provider || 'openai'}
                onChange={(e) => handleConfigChange(['ai', 'provider'], e.target.value)}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="azure-openai">Azure OpenAI</option>
                <option value="custom">Custom Provider</option>
              </select>
            </div>

            <div className="config-group">
              <label htmlFor="ai-api-key">API Key</label>
              <input
                id="ai-api-key"
                type="password"
                value={editedConfig.ai?.apiKey || ''}
                onChange={(e) => handleConfigChange(['ai', 'apiKey'], e.target.value)}
                placeholder="Enter your AI provider API key"
              />
              <small>Your API key is encrypted and stored securely</small>
            </div>

            {(editedConfig.ai?.provider === 'azure-openai' || editedConfig.ai?.provider === 'custom') && (
              <div className="config-group">
                <label htmlFor="ai-endpoint">Custom Endpoint</label>
                <input
                  id="ai-endpoint"
                  type="url"
                  value={editedConfig.ai?.endpoint || ''}
                  onChange={(e) => handleConfigChange(['ai', 'endpoint'], e.target.value)}
                  placeholder="https://your-endpoint.example.com"
                />
                <small>Custom API endpoint URL</small>
              </div>
            )}

            <div className="config-group">
              <label htmlFor="ai-model">Model</label>
              <input
                id="ai-model"
                type="text"
                value={editedConfig.ai?.model || ''}
                onChange={(e) => handleConfigChange(['ai', 'model'], e.target.value)}
                placeholder="gpt-4, claude-3-opus, etc."
              />
              <small>Leave empty to use provider defaults</small>
            </div>

            <div className="config-group">
              <label htmlFor="ai-temperature">Creativity (0.0 - 1.0)</label>
              <input
                id="ai-temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={editedConfig.ai?.temperature || 0.7}
                onChange={(e) => handleConfigChange(['ai', 'temperature'], parseFloat(e.target.value))}
              />
              <small>Current: {editedConfig.ai?.temperature || 0.7} (0.0 = consistent, 1.0 = creative)</small>
            </div>

            <h4 className="subsection-title">AI Features</h4>
            <div className="feature-toggles">
              <div className="feature-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={editedConfig.ai?.features?.taskGeneration || false}
                    onChange={(e) => handleConfigChange(['ai', 'features', 'taskGeneration'], e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <div className="toggle-content">
                    <span className="toggle-name">📝 Task Generation</span>
                    <span className="toggle-description">Auto-generate task descriptions and details</span>
                  </div>
                </label>
              </div>

              <div className="feature-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={editedConfig.ai?.features?.acceptanceCriteria || false}
                    onChange={(e) => handleConfigChange(['ai', 'features', 'acceptanceCriteria'], e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <div className="toggle-content">
                    <span className="toggle-name">✅ Acceptance Criteria</span>
                    <span className="toggle-description">Suggest acceptance criteria for user stories</span>
                  </div>
                </label>
              </div>

              <div className="feature-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={editedConfig.ai?.features?.technicalTasks || false}
                    onChange={(e) => handleConfigChange(['ai', 'features', 'technicalTasks'], e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <div className="toggle-content">
                    <span className="toggle-name">⚙️ Technical Tasks</span>
                    <span className="toggle-description">Generate technical implementation tasks</span>
                  </div>
                </label>
              </div>

              <div className="feature-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={editedConfig.ai?.features?.storyPointEstimation || false}
                    onChange={(e) => handleConfigChange(['ai', 'features', 'storyPointEstimation'], e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <div className="toggle-content">
                    <span className="toggle-name">📊 Story Point Estimation</span>
                    <span className="toggle-description">AI-powered effort estimation</span>
                  </div>
                </label>
              </div>

              <div className="feature-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={editedConfig.ai?.features?.dependencyAnalysis || false}
                    onChange={(e) => handleConfigChange(['ai', 'features', 'dependencyAnalysis'], e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <div className="toggle-content">
                    <span className="toggle-name">🔗 Dependency Analysis</span>
                    <span className="toggle-description">Automatic dependency detection</span>
                  </div>
                </label>
              </div>

              <div className="feature-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={editedConfig.ai?.features?.sprintPlanning || false}
                    onChange={(e) => handleConfigChange(['ai', 'features', 'sprintPlanning'], e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <div className="toggle-content">
                    <span className="toggle-name">📅 Sprint Planning</span>
                    <span className="toggle-description">AI-assisted sprint planning recommendations</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="config-section">
          <h3 className="section-title">🚥 Limits & Quotas</h3>
          
          <div className="config-group">
            <label htmlFor="max-tasks">Maximum Tasks</label>
            <input
              id="max-tasks"
              type="number"
              min="1"
              max="100000"
              value={editedConfig.limits.maxTasks}
              onChange={(e) => handleConfigChange(['limits', 'maxTasks'], parseInt(e.target.value) || 0)}
            />
            <small>Maximum number of tasks allowed in this workspace</small>
          </div>

          <div className="config-group">
            <label htmlFor="max-users">Maximum Users</label>
            <input
              id="max-users"
              type="number"
              min="1"
              max="1000"
              value={editedConfig.limits.maxUsers}
              onChange={(e) => handleConfigChange(['limits', 'maxUsers'], parseInt(e.target.value) || 0)}
            />
            <small>Maximum number of users allowed in this workspace</small>
          </div>

          <div className="config-group">
            <label htmlFor="api-rate-limit">API Rate Limit (per minute)</label>
            <input
              id="api-rate-limit"
              type="number"
              min="10"
              max="10000"
              value={editedConfig.limits.apiRateLimit}
              onChange={(e) => handleConfigChange(['limits', 'apiRateLimit'], parseInt(e.target.value) || 0)}
            />
            <small>Maximum API requests per minute per user</small>
          </div>
        </div>
      </div>

      <div className="config-panel-actions">
        {hasChanges && (
          <button 
            onClick={resetChanges} 
            className="reset-button"
            disabled={saving}
          >
            🔄 Reset
          </button>
        )}
        
        <button 
          onClick={saveConfig} 
          className="save-button"
          disabled={!hasChanges || saving}
        >
          {saving ? '💾 Saving...' : '💾 Save Changes'}
        </button>
      </div>

      <div className="config-panel-footer">
        <button onClick={loadConfig} className="refresh-button" disabled={loading || saving}>
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>
    </div>
  );
};