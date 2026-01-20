import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { ActivityLog } from '../types';
import { useAuthStore } from '../store/authStore';
import { useCompanyStore } from '../store/companyStore';
import './ActivityLogs.css';

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const { customer } = useAuthStore();
  const { company, loadCompany } = useCompanyStore();
  const isAdmin = customer?.isAdmin || false;

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [isAdmin, filterEntityType, filterAction]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 200 };
      if (filterEntityType) params.entityType = filterEntityType;
      
      const data = await storageService.getActivityLogs(params);
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      alert('Failed to load activity logs. Please check console for details.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      default:
        return '📝';
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'item':
        return 'Item';
      case 'category':
        return 'Category';
      case 'transaction':
        return 'Transaction';
      case 'company':
        return 'Company';
      default:
        return type;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterEntityType && log.entity_type !== filterEntityType) return false;
    if (filterAction && log.action !== filterAction) return false;
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="activity-logs-page">
        <div className="loading-state">
          <p>⛔ Access Denied: Activity logs are only available for administrators.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="activity-logs-page">
        <div className="loading-state">
          <p>Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-logs-page">
      <div className="activity-logs-header">
        {company.logo && (
          <div className="page-logo-container">
            <img 
              src={company.logo} 
              alt={company.name || 'Company Logo'} 
              className="page-logo"
            />
          </div>
        )}
        <div className="header-content">
          <h1>{company.logo ? '' : '📋 '}Activity Logs</h1>
          <p className="subtitle">Track all changes made to items, categories, transactions, and company data</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadLogs} title="Refresh">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <label>
            Filter by Entity Type:
            <select
              className="input"
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="item">Items</option>
              <option value="category">Categories</option>
              <option value="transaction">Transactions</option>
              <option value="company">Company</option>
            </select>
          </label>
          <label>
            Filter by Action:
            <select
              className="input"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="create">Created</option>
              <option value="update">Updated</option>
              <option value="delete">Deleted</option>
            </select>
          </label>
        </div>

        {filteredLogs.length > 0 ? (
          <div className="activity-logs-table">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Changed By</th>
                  <th>Changes</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDate(log.created_at)}</td>
                    <td>
                      <span className={`action-badge action-${log.action}`}>
                        {getActionIcon(log.action)} {log.action.toUpperCase()}
                      </span>
                    </td>
                    <td>{getEntityTypeLabel(log.entity_type)}</td>
                    <td className="entity-id">{log.entity_id.substring(0, 8)}...</td>
                    <td>
                      <div className="changed-by">
                        <div className="changed-by-name">{log.changed_by_name || 'Unknown'}</div>
                        {log.changed_by_email && (
                          <div className="changed-by-email">{log.changed_by_email}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      {log.changes ? (
                        <details className="changes-details">
                          <summary>View Changes</summary>
                          <pre>{JSON.stringify(log.changes, null, 2)}</pre>
                        </details>
                      ) : (
                        <span className="no-changes">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No activity logs found</p>
            <p className="empty-subtext">
              {filterEntityType || filterAction
                ? 'Try adjusting your filters'
                : 'Activity logs will appear here as changes are made'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

