import React, { useState, useEffect } from 'react';
import { Activity, ActivityResponse } from '../types';
import { IRemoteWorkspaceClient } from '../remoteClient';
import './ActivityLog.css';

interface ActivityLogProps {
  remoteClient?: IRemoteWorkspaceClient;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ remoteClient }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    userId: '',
    taskId: '',
    action: ''
  });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);

  const loadActivities = async (reset = false) => {
    if (!remoteClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        limit: pageSize,
        offset: reset ? 0 : page * pageSize,
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.taskId && { taskId: filters.taskId }),
        ...(filters.action && { action: filters.action })
      };
      
      const response = await remoteClient.getActivity(params);
      
      if (reset) {
        setActivities(response.activities);
        setPage(0);
      } else {
        setActivities(prev => [...prev, ...response.activities]);
      }
      
      setHasMore(response.hasMore);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    setActivities([]);
    setPage(0);
    loadActivities(true);
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      taskId: '',
      action: ''
    });
    setActivities([]);
    setPage(0);
    setTimeout(() => loadActivities(true), 0);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return '✨';
      case 'updated': return '✏️';
      case 'deleted': return '🗑️';
      case 'moved': return '🔄';
      case 'assigned': return '👤';
      default: return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'action-created';
      case 'updated': return 'action-updated';
      case 'deleted': return 'action-deleted';
      case 'moved': return 'action-moved';
      case 'assigned': return 'action-assigned';
      default: return 'action-default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) { // Less than 1 day
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
  };

  const renderActivityDetails = (activity: Activity) => {
    if (!activity.details) return null;
    
    return (
      <div className="activity-details">
        {activity.details.field && (
          <span className="field-name">{activity.details.field}:</span>
        )}
        {activity.details.oldValue !== undefined && (
          <span className="old-value">"{String(activity.details.oldValue)}"</span>
        )}
        {activity.details.oldValue !== undefined && activity.details.newValue !== undefined && (
          <span className="arrow">→</span>
        )}
        {activity.details.newValue !== undefined && (
          <span className="new-value">"{String(activity.details.newValue)}"</span>
        )}
      </div>
    );
  };

  useEffect(() => {
    loadActivities(true);
  }, [remoteClient]);

  useEffect(() => {
    if (page > 0) {
      loadActivities();
    }
  }, [page]);

  if (!remoteClient) {
    return (
      <div className="activity-log-container">
        <p className="activity-log-no-remote">Activity log is only available for remote workspaces.</p>
      </div>
    );
  }

  return (
    <div className="activity-log-container">
      <div className="activity-log-header">
        <h2 className="activity-log-title">📋 Activity Log</h2>
        <div className="activity-stats">
          <span>Total: {totalCount}</span>
          <span>•</span>
          <span>Showing: {activities.length}</span>
        </div>
      </div>

      <div className="activity-filters">
        <div className="filter-group">
          <label htmlFor="user-filter">User ID:</label>
          <input
            id="user-filter"
            type="text"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            placeholder="Filter by user ID"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="task-filter">Task ID:</label>
          <input
            id="task-filter"
            type="text"
            value={filters.taskId}
            onChange={(e) => handleFilterChange('taskId', e.target.value)}
            placeholder="Filter by task ID"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="action-filter">Action:</label>
          <select
            id="action-filter"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">All actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="moved">Moved</option>
            <option value="assigned">Assigned</option>
          </select>
        </div>

        <div className="filter-actions">
          <button onClick={applyFilters} className="apply-button">
            🔍 Apply
          </button>
          <button onClick={clearFilters} className="clear-button">
            🗑️ Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="activity-log-error">
          <p>{error}</p>
          <button onClick={() => loadActivities(true)} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {loading && activities.length === 0 ? (
        <p className="activity-log-loading">Loading activity log...</p>
      ) : (
        <>
          <div className="activities-list">
            {activities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  <span className={`action-icon ${getActionColor(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </span>
                </div>
                
                <div className="activity-content">
                  <div className="activity-main">
                    <span className="user-name">{activity.userName}</span>
                    <span className={`action-text ${getActionColor(activity.action)}`}>
                      {activity.action}
                    </span>
                    <span className="target-type">{activity.targetType}</span>
                    <span className="target-name">"{activity.targetName}"</span>
                  </div>
                  
                  {renderActivityDetails(activity)}
                  
                  <div className="activity-meta">
                    <span className="activity-timestamp">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                    <span className="activity-ids">
                      {activity.targetType}: {activity.targetId.substring(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {activities.length === 0 && !loading && !error && (
            <div className="no-activities">
              <p>No activities found matching the current filters.</p>
            </div>
          )}

          {hasMore && (
            <div className="load-more-container">
              <button 
                onClick={loadMore} 
                className="load-more-button"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      <div className="activity-log-footer">
        <button 
          onClick={() => loadActivities(true)} 
          className="refresh-button"
          disabled={loading}
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>
    </div>
  );
};