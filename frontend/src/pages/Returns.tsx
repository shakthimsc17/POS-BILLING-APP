import { useState, useEffect } from 'react';
import { storageService } from '../services/storage';
import { ReturnRecord } from '../types';
import { formatCurrency, formatOrderId } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';
import { useCompanyStore } from '../store/companyStore';
import './Returns.css';

interface ReturnsProps {
  onNavigate?: (page: string) => void;
}

export default function Returns({ onNavigate }: ReturnsProps = { onNavigate: undefined }) {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { customer: currentUser } = useAuthStore();
  const { company } = useCompanyStore();
  const isAdmin = currentUser?.isAdmin || false;

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const data = await storageService.getReturns();
      setReturns(data);
    } catch (error: any) {
      console.error('Error loading returns:', error);
      alert('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (returnId: string) => {
    if (!confirm('Are you sure you want to approve this return?')) return;

    try {
      await storageService.approveReturn(returnId);
      alert('Return approved successfully!');
      loadReturns();
    } catch (error: any) {
      console.error('Error approving return:', error);
      alert(`Failed to approve return: ${error.message || 'Unknown error'}`);
    }
  };

  const handleProcess = async (returnId: string) => {
    if (!confirm('Are you sure you want to process this return? This will restock items and create refund transactions.')) return;

    try {
      const result = await storageService.processReturn(returnId);
      alert('Return processed successfully! Items have been restocked.');
      loadReturns();
    } catch (error: any) {
      console.error('Error processing return:', error);
      alert(`Failed to process return: ${error.message || 'Unknown error'}`);
    }
  };

  const handleReject = async (returnId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await storageService.rejectReturn(returnId, reason);
      alert('Return rejected successfully!');
      loadReturns();
    } catch (error: any) {
      console.error('Error rejecting return:', error);
      alert(`Failed to reject return: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (returnId: string) => {
    if (!confirm('Are you sure you want to delete this return? This action cannot be undone.')) return;

    try {
      await storageService.deleteReturn(returnId);
      alert('Return deleted successfully!');
      loadReturns();
    } catch (error: any) {
      console.error('Error deleting return:', error);
      alert(`Failed to delete return: ${error.message || 'Unknown error'}`);
    }
  };

  const handleViewReturnDetails = async (returnId: string) => {
    try {
      const returnDetails = await storageService.getReturn(returnId);
      alert(`Return Details:\n\nID: ${returnDetails.id.slice(0, 8).toUpperCase()}\nType: ${getReturnTypeLabel(returnDetails.return_type)}\nStatus: ${returnDetails.status.toUpperCase()}\nReason: ${returnDetails.reason || 'N/A'}\nRefund Amount: ${returnDetails.refund_amount ? formatCurrency(returnDetails.refund_amount) : 'N/A'}\nCreated: ${new Date(returnDetails.created_at).toLocaleDateString()}\n\nNote: Detailed return view page can be implemented here.`);
    } catch (error: any) {
      console.error('Error fetching return details:', error);
      alert('Failed to load return details');
    }
  };

  const handleViewOriginalOrder = (orderId: string) => {
    if (onNavigate) {
      // Navigate to order details
      onNavigate('sales');
      // Note: In a real implementation, you'd need to pass the orderId to the SalesOrders component
      // and have it automatically navigate to the OrderDetails page
      alert(`Navigate to Order: ${formatOrderId(orderId)}\n\nThis would navigate to the order details page. In a full implementation, this would open the OrderDetails page for this specific order.`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'approved': return '#3498db';
      case 'processed': return '#27ae60';
      case 'rejected': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getReturnTypeLabel = (type: string) => {
    switch (type) {
      case 'full': return 'Full Return';
      case 'partial': return 'Partial Return';
      case 'exchange': return 'Exchange';
      case 'refund': return 'Refund';
      default: return type;
    }
  };

  if (!isAdmin) {
    return (
      <div className="returns">
        <div className="error-state">
          <h2>Access Denied</h2>
          <p>You don't have permission to view returns.</p>
          {onNavigate && (
            <button className="btn btn-primary" onClick={() => onNavigate('dashboard')}>
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="returns">
        <div className="loading-state">
          <p>Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="returns">
      <div className="returns-header">
        {company.logo && (
          <div className="page-logo-container">
            <img src={company.logo} alt={company.name} className="page-logo" />
          </div>
        )}
        <div className="header-content">
          <h1>{company.logo ? '' : '🔄 '}Returns Management</h1>
        </div>
        {onNavigate && (
          <button className="btn btn-secondary" onClick={() => onNavigate('dashboard')}>
            ← Back to Dashboard
          </button>
        )}
      </div>

      <div className="returns-stats">
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending</h3>
            <p>{returns.filter(r => r.status === 'pending').length}</p>
          </div>
        </div>
        <div className="stat-card approved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Approved</h3>
            <p>{returns.filter(r => r.status === 'approved').length}</p>
          </div>
        </div>
        <div className="stat-card processed">
          <div className="stat-icon">✨</div>
          <div className="stat-content">
            <h3>Processed</h3>
            <p>{returns.filter(r => r.status === 'processed').length}</p>
          </div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>Rejected</h3>
            <p>{returns.filter(r => r.status === 'rejected').length}</p>
          </div>
        </div>
      </div>

      <div className="returns-table-container">
        <h2>Return Requests</h2>
        {returns.length > 0 ? (
          <div className="returns-table">
            <table>
              <thead>
                <tr>
                  <th>Return ID</th>
                  <th>Order ID</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Refund Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((returnRecord) => (
                  <tr key={returnRecord.id}>
                    <td className="return-id">
                      <span 
                        title={returnRecord.id}
                        className="clickable-return-id"
                        onClick={() => handleViewReturnDetails(returnRecord.id)}
                      >
                        {returnRecord.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span 
                        title={returnRecord.original_transaction_id}
                        className="clickable-order-id"
                        onClick={() => handleViewOriginalOrder(returnRecord.original_transaction_id)}
                      >
                        {formatOrderId(returnRecord.original_transaction_id)}
                      </span>
                    </td>
                    <td>{getReturnTypeLabel(returnRecord.return_type)}</td>
                    <td className="reason">
                      <span title={returnRecord.reason}>
                        {returnRecord.reason?.slice(0, 30) || 'N/A'}
                        {returnRecord.reason && returnRecord.reason.length > 30 ? '...' : ''}
                      </span>
                    </td>
                    <td className="amount">
                      {returnRecord.refund_amount ? formatCurrency(returnRecord.refund_amount) : '-'}
                    </td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(returnRecord.status) }}
                      >
                        {returnRecord.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(returnRecord.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        {returnRecord.status === 'pending' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(returnRecord.id)}
                              title="Approve Return"
                            >
                              ✅
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReject(returnRecord.id)}
                              title="Reject Return"
                            >
                              ❌
                            </button>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleDelete(returnRecord.id)}
                              title="Delete Return"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                        {returnRecord.status === 'approved' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleProcess(returnRecord.id)}
                            title="Process Return"
                          >
                            ⚙️
                          </button>
                        )}
                        {returnRecord.status === 'processed' && (
                          <span className="processed-badge">✨ Processed</span>
                        )}
                        {returnRecord.status === 'rejected' && (
                          <>
                            <span className="rejected-badge">❌ Rejected</span>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleDelete(returnRecord.id)}
                              title="Delete Return"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No return requests found</p>
            <p className="empty-subtext">No return requests have been created yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
