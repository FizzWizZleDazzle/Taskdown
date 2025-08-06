import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Analytics } from '../components/Analytics';
import { UserManagement } from '../components/UserManagement';
import { ActivityLog } from '../components/ActivityLog';
import { ConfigPanel } from '../components/ConfigPanel';
import { Dashboard } from '../components/Dashboard';

describe('New Dashboard Components', () => {
  describe('Analytics', () => {
    it('renders no-remote message when no client provided', () => {
      render(<Analytics />);
      expect(screen.getByText('Analytics are only available for remote workspaces.')).toBeInTheDocument();
    });
  });

  describe('UserManagement', () => {
    it('renders no-remote message when no client provided', () => {
      render(<UserManagement />);
      expect(screen.getByText('User management is only available for remote workspaces.')).toBeInTheDocument();
    });
  });

  describe('ActivityLog', () => {
    it('renders no-remote message when no client provided', () => {
      render(<ActivityLog />);
      expect(screen.getByText('Activity log is only available for remote workspaces.')).toBeInTheDocument();
    });
  });

  describe('ConfigPanel', () => {
    it('renders no-remote message when no client provided', () => {
      render(<ConfigPanel />);
      expect(screen.getByText('Configuration settings are only available for remote workspaces.')).toBeInTheDocument();
    });
  });

  describe('Dashboard', () => {
    it('renders dashboard with tabs', () => {
      render(<Dashboard />);
      expect(screen.getByText('🚀 Workspace Dashboard')).toBeInTheDocument();
      expect(screen.getByText('📊 Analytics')).toBeInTheDocument();
      expect(screen.getByText('👥 Users')).toBeInTheDocument();
      expect(screen.getByText('📋 Activity')).toBeInTheDocument();
      expect(screen.getByText('⚙️ Config')).toBeInTheDocument();
    });

    it('shows notice for local workspaces', () => {
      render(<Dashboard />);
      expect(screen.getByText('Dashboard features are only available for remote workspaces.')).toBeInTheDocument();
    });
  });
});