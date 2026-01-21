import { useState, useEffect, useMemo } from 'react';
import { storageService } from '../services/storage';
import { ActivityLog, Settings } from '../types';
import { useAuthStore } from '../store/authStore';
import { useCompanyStore } from '../store/companyStore';
import './ActivityLogs.css';

export default function ActivityLogs() {
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('');
  const [displayedLogsCount, setDisplayedLogsCount] = useState(20);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [deleteFilteredModalVisible, setDeleteFilteredModalVisible] = useState(false);
  const LOGS_PER_PAGE = 20;
  const { customer } = useAuthStore();
  const { company, loadCompany } = useCompanyStore();
  const isAdmin = customer?.isAdmin || false;

  useEffect(() => {
    loadCompany();
    loadSettings();
  }, [loadCompany]);

  const loadSettings = async () => {
    try {
      const data = await storageService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [isAdmin]);

  // Filter logs based on filters and settings
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      if (filterEntityType && log.entity_type !== filterEntityType) return false;
      if (filterAction && log.action !== filterAction) return false;
      
      // Filter item logs based on settings
      if (settings && log.entity_type === 'item' && settings.item_log_actions === 'update_delete') {
        if (log.action === 'create') return false;
      }
      
      return true;
    });
  }, [allLogs, filterEntityType, filterAction, settings]);

  // Items to display (lazy loaded)
  const displayedLogs = useMemo(() => {
    return filteredLogs.slice(0, displayedLogsCount);
  }, [filteredLogs, displayedLogsCount]);

  const hasMoreLogs = displayedLogsCount < filteredLogs.length;

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedLogsCount(LOGS_PER_PAGE);
  }, [filterEntityType, filterAction]);

  // Scroll handler for lazy loading
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 200
      ) {
        if (displayedLogsCount < filteredLogs.length) {
          setDisplayedLogsCount(prev => prev + LOGS_PER_PAGE);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [displayedLogsCount, filteredLogs.length]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 1000 }; // Load more initially for filtering
      const data = await storageService.getActivityLogs(params);
      setAllLogs(data || []);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      alert('Failed to load activity logs. Please check console for details.');
      setAllLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity log?')) return;

    try {
      setDeleting(id);
      await storageService.deleteActivityLog(id);
      await loadLogs();
    } catch (error: any) {
      console.error('Error deleting activity log:', error);
      alert(`Failed to delete activity log: ${error.message || 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${allLogs.length} activity logs? This action cannot be undone.`)) return;

    try {
      setDeleting('all');
      const result = await storageService.deleteAllActivityLogs();
      alert(`Successfully deleted ${result.count} activity log(s)`);
      setDeleteAllModalVisible(false);
      await loadLogs();
    } catch (error: any) {
      console.error('Error deleting all activity logs:', error);
      alert(`Failed to delete activity logs: ${error.message || 'Unknown error'}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteFiltered = async () => {
    const filteredCount = filteredLogs.length;
    if (!confirm(`Are you sure you want to delete ${filteredCount} filtered activity log(s)? This action cannot be undone.`)) return;

    try {
      setDeleting('filtered');
      const filters: any = {};
      if (filterEntityType) filters.entityType = filterEntityType;
      if (filterAction) filters.action = filterAction;
      
      const result = await storageService.deleteFilteredActivityLogs(filters);
      alert(`Successfully deleted ${result.count} activity log(s)`);
      setDeleteFilteredModalVisible(false);
      await loadLogs();
    } catch (error: any) {
      console.error('Error deleting filtered activity logs:', error);
      alert(`Failed to delete filtered activity logs: ${error.message || 'Unknown error'}`);
    } finally {
      setDeleting(null);
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
          {allLogs.length > 0 && (
            <>
              <button 
                className="btn btn-danger" 
                onClick={() => setDeleteAllModalVisible(true)}
                title="Delete All Logs"
              >
                🗑️ Delete All
              </button>
              {filteredLogs.length > 0 && filteredLogs.length < allLogs.length && (
                <button 
                  className="btn btn-danger" 
                  onClick={() => setDeleteFilteredModalVisible(true)}
                  title="Delete Filtered Logs"
                >
                  🗑️ Delete Filtered ({filteredLogs.length})
                </button>
              )}
            </>
          )}
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
          <>
            <div className="logs-count">
              Showing {displayedLogs.length} of {filteredLogs.length} filtered logs ({allLogs.length} total)
            </div>
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
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.map((log) => (
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
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteLog(log.id)}
                          disabled={deleting === log.id}
                          title="Delete Log"
                        >
                          {deleting === log.id ? 'Deleting...' : '🗑️'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hasMoreLogs && (
              <div className="load-more-indicator">
                <p>Scroll down to load more logs...</p>
              </div>
            )}
          </>
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

      {/* Delete All Confirmation Modal */}
      {deleteAllModalVisible && (
        <div className="modal-overlay" onClick={() => setDeleteAllModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete All Activity Logs</h2>
            <p>
              Are you sure you want to delete <strong>all {allLogs.length} activity log{allLogs.length === 1 ? '' : 's'}</strong>?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteAllModalVisible(false)}
                disabled={deleting === 'all'}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAll}
                disabled={deleting === 'all'}
              >
                {deleting === 'all' ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Filtered Confirmation Modal */}
      {deleteFilteredModalVisible && (
        <div className="modal-overlay" onClick={() => setDeleteFilteredModalVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Filtered Activity Logs</h2>
            <p>
              Are you sure you want to delete <strong>{filteredLogs.length} filtered activity log{filteredLogs.length === 1 ? '' : 's'}</strong>?
              This action cannot be undone.
            </p>
            {(filterEntityType || filterAction) && (
              <div className="filter-info">
                <p><strong>Current Filters:</strong></p>
                <ul>
                  {filterEntityType && <li>Entity Type: {getEntityTypeLabel(filterEntityType)}</li>}
                  {filterAction && <li>Action: {filterAction.toUpperCase()}</li>}
                </ul>
              </div>
            )}
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteFilteredModalVisible(false)}
                disabled={deleting === 'filtered'}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteFiltered}
                disabled={deleting === 'filtered'}
              >
                {deleting === 'filtered' ? 'Deleting...' : 'Delete Filtered'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

