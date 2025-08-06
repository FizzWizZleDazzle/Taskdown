import React, { useState, useEffect } from 'react';
import { User, CreateUserRequest } from '../types';
import { IRemoteWorkspaceClient } from '../remoteClient';
import './UserManagement.css';

interface UserManagementProps {
  remoteClient?: IRemoteWorkspaceClient;
}

export const UserManagement: React.FC<UserManagementProps> = ({ remoteClient }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createUserData, setCreateUserData] = useState<CreateUserRequest>({
    username: '',
    displayName: '',
    email: '',
    role: 'user',
    password: ''
  });
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    if (!remoteClient) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await remoteClient.getUsers();
      setUsers(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remoteClient) return;

    try {
      setCreating(true);
      setError(null);
      const newUser = await remoteClient.createUser(createUserData);
      setUsers(prev => [...prev, newUser]);
      setShowCreateForm(false);
      setCreateUserData({
        username: '',
        displayName: '',
        email: '',
        role: 'user',
        password: ''
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserRequest, value: string) => {
    setCreateUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'user': return '👤';
      case 'viewer': return '👁️';
      default: return '❓';
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? '🟢' : '🔴';
  };

  useEffect(() => {
    loadUsers();
  }, [remoteClient]);

  if (!remoteClient) {
    return (
      <div className="user-management-container">
        <p className="user-management-no-remote">User management is only available for remote workspaces.</p>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h2 className="user-management-title">👥 User Management</h2>
        <button 
          onClick={() => setShowCreateForm(true)} 
          className="create-user-button"
          disabled={loading}
        >
          ➕ Add User
        </button>
      </div>

      {error && (
        <div className="user-management-error">
          <p>{error}</p>
          <button onClick={loadUsers} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {loading && users.length === 0 ? (
        <p className="user-management-loading">Loading users...</p>
      ) : (
        <div className="users-grid">
          {users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-header">
                <div className="user-avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.displayName} />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="user-info">
                  <h3 className="user-name">{user.displayName}</h3>
                  <p className="user-username">@{user.username}</p>
                </div>
                <div className="user-status">
                  {getStatusIcon(user.isActive)}
                </div>
              </div>
              
              <div className="user-details">
                <div className="user-email">
                  <span className="label">📧</span>
                  <span>{user.email}</span>
                </div>
                
                <div className="user-role">
                  <span className="label">🎭</span>
                  <span className={`role-badge role-${user.role}`}>
                    {getRoleIcon(user.role)} {user.role}
                  </span>
                </div>
                
                <div className="user-last-seen">
                  <span className="label">🕒</span>
                  <span>{new Date(user.lastSeen).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {users.length === 0 && !loading && !error && (
        <div className="no-users">
          <p>No users found in this workspace.</p>
        </div>
      )}

      {showCreateForm && (
        <div className="modal-overlay">
          <div className="create-user-modal">
            <h3>Create New User</h3>
            
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  id="username"
                  type="text"
                  value={createUserData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  required
                  placeholder="john_doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="displayName">Display Name *</label>
                <input
                  id="displayName"
                  type="text"
                  value={createUserData.displayName}
                  onChange={(e) => handleInputChange('displayName', e.target.value)}
                  required
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={createUserData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  value={createUserData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as 'admin' | 'user' | 'viewer')}
                  required
                >
                  <option value="viewer">👁️ Viewer</option>
                  <option value="user">👤 User</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  value={createUserData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="cancel-button"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="user-management-footer">
        <p className="user-count">
          Total Users: {users.length}
        </p>
        <button onClick={loadUsers} className="refresh-button" disabled={loading}>
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>
    </div>
  );
};