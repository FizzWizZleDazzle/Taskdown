import React, { useState, useEffect } from 'react';
import { AnalyticsSummary, BurndownData } from '../types';
import { IRemoteWorkspaceClient } from '../remoteClient';
import './Analytics.css';

interface AnalyticsProps {
  remoteClient?: IRemoteWorkspaceClient;
}

export const Analytics: React.FC<AnalyticsProps> = ({ remoteClient }) => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [burndownData, setBurndownData] = useState<BurndownData | null>(null);
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalyticsSummary = async () => {
    if (!remoteClient) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await remoteClient.getAnalyticsSummary();
      setSummary(data);
      
      // Auto-select first active sprint if available
      if (data.activeSprints.length > 0 && !selectedSprint) {
        setSelectedSprint(data.activeSprints[0]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadBurndownData = async (sprint: string) => {
    if (!remoteClient || !sprint) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await remoteClient.getBurndownData(sprint);
      setBurndownData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsSummary();
  }, [remoteClient]);

  useEffect(() => {
    if (selectedSprint) {
      loadBurndownData(selectedSprint);
    }
  }, [selectedSprint, remoteClient]);

  if (!remoteClient) {
    return (
      <div className="analytics-container">
        <p className="analytics-no-remote">Analytics are only available for remote workspaces.</p>
      </div>
    );
  }

  if (loading && !summary) {
    return (
      <div className="analytics-container">
        <p className="analytics-loading">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="analytics-error">
          <h3>Error loading analytics</h3>
          <p>{error}</p>
          <button onClick={loadAnalyticsSummary} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <h2 className="analytics-title">📊 Workspace Analytics</h2>
      
      {summary && (
        <>
          <div className="analytics-summary">
            <div className="summary-card">
              <h3>Total Tasks</h3>
              <div className="summary-number">{summary.totalTasks}</div>
            </div>
            
            <div className="summary-card">
              <h3>Completion Rate</h3>
              <div className="summary-number">{(summary.completionRate * 100).toFixed(1)}%</div>
            </div>
            
            <div className="summary-card">
              <h3>Avg Story Points</h3>
              <div className="summary-number">{summary.averageStoryPoints.toFixed(1)}</div>
            </div>
            
            <div className="summary-card">
              <h3>Active Sprints</h3>
              <div className="summary-number">{summary.activeSprints.length}</div>
            </div>
          </div>

          <div className="analytics-charts">
            <div className="chart-section">
              <h3>Tasks by Status</h3>
              <div className="status-chart">
                {Object.entries(summary.tasksByStatus).map(([status, count]) => (
                  <div key={status} className="status-bar">
                    <span className="status-label">{status}</span>
                    <div className="status-progress">
                      <div 
                        className={`status-fill status-${status.toLowerCase().replace(' ', '-')}`}
                        style={{ width: `${(count / summary.totalTasks) * 100}%` }}
                      ></div>
                    </div>
                    <span className="status-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-section">
              <h3>Tasks by Type</h3>
              <div className="type-chart">
                {Object.entries(summary.tasksByType).map(([type, count]) => (
                  <div key={type} className="type-item">
                    <span className="type-label">{type}</span>
                    <span className="type-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-section">
              <h3>Tasks by Priority</h3>
              <div className="priority-chart">
                {Object.entries(summary.tasksByPriority).map(([priority, count]) => (
                  <div key={priority} className="priority-item">
                    <span className={`priority-label priority-${priority.toLowerCase()}`}>
                      {priority}
                    </span>
                    <span className="priority-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {summary.activeSprints.length > 0 && (
            <div className="burndown-section">
              <h3>Sprint Burndown</h3>
              <div className="sprint-selector">
                <label htmlFor="sprint-select">Select Sprint:</label>
                <select
                  id="sprint-select"
                  value={selectedSprint}
                  onChange={(e) => setSelectedSprint(e.target.value)}
                >
                  {summary.activeSprints.map(sprint => (
                    <option key={sprint} value={sprint}>{sprint}</option>
                  ))}
                </select>
              </div>

              {burndownData && (
                <div className="burndown-chart">
                  <div className="burndown-info">
                    <p><strong>Sprint:</strong> {burndownData.sprint}</p>
                    <p><strong>Period:</strong> {new Date(burndownData.startDate).toLocaleDateString()} - {new Date(burndownData.endDate).toLocaleDateString()}</p>
                    <p><strong>Total Story Points:</strong> {burndownData.totalStoryPoints}</p>
                  </div>
                  
                  <div className="burndown-data">
                    <h4>Daily Progress</h4>
                    <div className="burndown-table">
                      <div className="burndown-header">
                        <span>Date</span>
                        <span>Remaining</span>
                        <span>Completed</span>
                        <span>Ideal</span>
                      </div>
                      {burndownData.dailyData.map((day, index) => (
                        <div key={index} className="burndown-row">
                          <span>{new Date(day.date).toLocaleDateString()}</span>
                          <span>{day.remainingPoints}</span>
                          <span>{day.completedPoints}</span>
                          <span>{day.idealRemaining}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="analytics-footer">
            <p className="last-updated">
              Last updated: {new Date(summary.lastUpdated).toLocaleString()}
            </p>
            <button onClick={loadAnalyticsSummary} className="refresh-button">
              🔄 Refresh
            </button>
          </div>
        </>
      )}
    </div>
  );
};