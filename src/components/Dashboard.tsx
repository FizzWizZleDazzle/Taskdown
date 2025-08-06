import React, { useState } from 'react';
import { IRemoteWorkspaceClient } from '../remoteClient';
import { Analytics } from './Analytics';
import { UserManagement } from './UserManagement';
import { ActivityLog } from './ActivityLog';
import { ConfigPanel } from './ConfigPanel';
import './Dashboard.css';

interface DashboardProps {
  remoteClient?: IRemoteWorkspaceClient;
}

type DashboardTab = 'analytics' | 'users' | 'activity' | 'config';

export const Dashboard: React.FC<DashboardProps> = ({ remoteClient }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('analytics');

  const tabs = [
    { id: 'analytics' as const, label: '📊 Analytics', component: Analytics },
    { id: 'users' as const, label: '👥 Users', component: UserManagement },
    { id: 'activity' as const, label: '📋 Activity', component: ActivityLog },
    { id: 'config' as const, label: '⚙️ Config', component: ConfigPanel }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || Analytics;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">🚀 Workspace Dashboard</h1>
        {!remoteClient && (
          <div className="dashboard-notice">
            <span className="notice-icon">ℹ️</span>
            <span>Dashboard features are only available for remote workspaces.</span>
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
        <ActiveComponent remoteClient={remoteClient} />
      </div>
    </div>
  );
};