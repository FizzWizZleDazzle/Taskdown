import React, { useState } from 'react';
import { IRemoteWorkspaceClient } from '../remoteClient';
import { Analytics } from './Analytics';
import { UserManagement } from './UserManagement';
import { ActivityLog } from './ActivityLog';
import { ConfigPanel } from './ConfigPanel';
import './Dashboard.css';

interface DashboardProps {
  remoteClient?: IRemoteWorkspaceClient;
  onClose?: () => void;
  onConfigUpdate?: () => void;
}

type DashboardTab = 'analytics' | 'users' | 'activity' | 'config';

export const Dashboard: React.FC<DashboardProps> = ({ remoteClient, onClose, onConfigUpdate }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');

  const tabs = [
    { id: 'analytics' as const, label: '📊 Analytics', component: Analytics },
    { id: 'users' as const, label: '👥 Users', component: UserManagement },
    { id: 'activity' as const, label: '📋 Activity', component: ActivityLog },
    { id: 'config' as const, label: '⚙️ Config', component: ConfigPanel }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Analytics;

  return (
    <div className="dashboard-modal-overlay" onClick={onClose}>
      <div className="dashboard-container" onClick={(e) => e.stopPropagation()}>
        <div className="dashboard-header">
          <h1 className="dashboard-title">⚙️ Workspace Settings</h1>
          {onClose && (
            <button className="dashboard-close" onClick={onClose} aria-label="Close settings">
              ✕
            </button>
          )}
          {!remoteClient && (
            <div className="dashboard-notice">
              <span className="notice-icon">ℹ️</span>
              <span>Settings are only available for remote workspaces.</span>
            </div>
          )}
        </div>

      <div className="dashboard-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''} ${!remoteClient ? 'disabled' : ''}`}
            onClick={() => remoteClient && setActiveTab(tab.id)}
            disabled={!remoteClient}
          >
            {tab.label}
          </button>
        ))}
      </div>

        <div className="dashboard-content">
          {activeTab === 'config' ? (
            <ConfigPanel remoteClient={remoteClient} onConfigUpdate={onConfigUpdate} />
          ) : (
            <ActiveComponent remoteClient={remoteClient} />
          )}
        </div>
      </div>
    </div>
  );
};