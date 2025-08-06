import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Dashboard } from '../components/Dashboard';

describe('Dashboard Component', () => {
    it('renders dashboard with tabs', () => {
      render(<Dashboard />);
      expect(screen.getByText('⚙️ Workspace Settings')).toBeInTheDocument();
      expect(screen.getByText('📊 Analytics')).toBeInTheDocument();
      expect(screen.getByText('👥 Users')).toBeInTheDocument();
      expect(screen.getByText('📋 Activity')).toBeInTheDocument();
      expect(screen.getByText('⚙️ Config')).toBeInTheDocument();
    });

    it('shows notice for local workspaces', () => {
      render(<Dashboard />);
      expect(screen.getByText('Settings are only available for remote workspaces.')).toBeInTheDocument();
    });
});