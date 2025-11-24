import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PaymentVerificationModal from '../components/PaymentVerificationModal';
import RoleAssignmentModal from '../components/RoleAssignmentModal';
import PasswordResetModal from '../components/PasswordResetModal';

interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  createdAt: string;
  users: Array<{
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  }>;
  employees: Array<{
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    isActive: boolean;
  }>;
  subscriptions: Array<{
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    amountUSD: number;
    amountZWL: number;
    currency: string;
    plan: {
      name: string;
      description: string;
    };
    payments: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      method: string;
      createdAt: string;
    }>;
  }>;
  payrollRuns: Array<{
    id: string;
    periodStart: string;
    periodEnd: string;
    status: string;
    totalGross: number;
    totalNet: number;
    runDate: string;
  }>;
}

const TenantDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    subscriptionStatus: '',
    trialDays: 14
  });
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchTenantDetails();
  }, [id]);

  const fetchTenantDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/super-admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenant(response.data.tenant);
      setFormData({
        subscriptionStatus: response.data.tenant.subscriptionStatus,
        trialDays: 14
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      setAlert({ type: 'danger', message: 'Failed to load tenant details' });
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/super-admin/tenants/${id}/status`,
        { subscriptionStatus: formData.subscriptionStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlert({ type: 'success', message: 'Status updated successfully' });
      setEditMode(false);
      fetchTenantDetails();
    } catch (error) {
      console.error('Error updating status:', error);
      setAlert({ type: 'danger', message: 'Failed to update status' });
    }
  };

  const handleExtendTrial = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/super-admin/tenants/${id}/extend-trial`,
        { days: formData.trialDays },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlert({ type: 'success', message: `Trial extended by ${formData.trialDays} days` });
      fetchTenantDetails();
    } catch (error) {
      console.error('Error extending trial:', error);
      setAlert({ type: 'danger', message: 'Failed to extend trial' });
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this user?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/user-management/users/${userId}/toggle-status`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlert({ type: 'success', message: `User ${!currentStatus ? 'activated' : 'suspended'} successfully` });
      fetchTenantDetails();
    } catch (error) {
      console.error('Error toggling user status:', error);
      setAlert({ type: 'danger', message: 'Failed to update user status' });
    }
  };

  const handleAssignRole = (user: any) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleResetPassword = (user: any) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      TRIAL: 'bg-warning text-dark',
      ACTIVE: 'bg-success',
      PAST_DUE: 'bg-danger',
      EXPIRED: 'bg-secondary',
      CANCELLED: 'bg-dark'
    };
    return badges[status] || 'bg-secondary';
  };

  const getPaymentStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      PAID: 'bg-success',
      PENDING: 'bg-warning text-dark',
      FAILED: 'bg-danger',
      REFUNDED: 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">Tenant not found</div>
        <button className="btn btn-dark" onClick={() => navigate('/super-admin')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <button className="btn btn-sm btn-outline-dark mb-2" onClick={() => navigate('/super-admin')}>
            ← Back to Dashboard
          </button>
          <h2 className="fw-bold mb-0">{tenant.name}</h2>
          <p className="text-muted mb-0">
            {tenant.slug} • Registered {new Date(tenant.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`badge ${getStatusBadge(tenant.subscriptionStatus)} fs-6`}>
          {tenant.subscriptionStatus}
        </span>
      </div>

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users ({tenant.users.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            Employees ({tenant.employees.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'subscription' ? 'active' : ''}`}
            onClick={() => setActiveTab('subscription')}
          >
            Subscription
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
        </li>
      </ul>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="row g-4">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title fw-bold mb-3">Company Information</h5>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Company Name</label>
                    <p className="fw-semibold mb-0">{tenant.name}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Slug</label>
                    <p className="mb-0"><code>{tenant.slug}</code></p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Email</label>
                    <p className="mb-0">{tenant.companyEmail || '-'}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="text-muted small">Phone</label>
                    <p className="mb-0">{tenant.companyPhone || '-'}</p>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="text-muted small">Address</label>
                    <p className="mb-0">{tenant.companyAddress || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-bold mb-3">Recent Payroll Runs</h5>
                {tenant.payrollRuns.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Status</th>
                          <th className="text-end">Gross</th>
                          <th className="text-end">Net</th>
                          <th>Run Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenant.payrollRuns.map((run) => (
                          <tr key={run.id}>
                            <td>
                              <small>
                                {new Date(run.periodStart).toLocaleDateString()} - {new Date(run.periodEnd).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <span className={`badge badge-sm ${run.status === 'APPROVED' ? 'bg-success' : 'bg-warning'}`}>
                                {run.status}
                              </span>
                            </td>
                            <td className="text-end">${run.totalGross.toFixed(2)}</td>
                            <td className="text-end">${run.totalNet.toFixed(2)}</td>
                            <td><small>{new Date(run.runDate).toLocaleDateString()}</small></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted mb-0">No payroll runs yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body">
                <h5 className="card-title fw-bold mb-3">Subscription Management</h5>
                
                {editMode ? (
                  <div>
                    <div className="mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={formData.subscriptionStatus}
                        onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                      >
                        <option value="TRIAL">Trial</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PAST_DUE">Past Due</option>
                        <option value="EXPIRED">Expired</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-dark" onClick={handleStatusUpdate}>
                        Save
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditMode(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3">
                      <label className="text-muted small">Current Status</label>
                      <div>
                        <span className={`badge ${getStatusBadge(tenant.subscriptionStatus)}`}>
                          {tenant.subscriptionStatus}
                        </span>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-outline-dark" onClick={() => setEditMode(true)}>
                      Change Status
                    </button>
                  </div>
                )}

                {tenant.trialEndsAt && (
                  <div className="mt-4">
                    <label className="text-muted small">Trial Ends</label>
                    <p className="fw-semibold mb-2">{new Date(tenant.trialEndsAt).toLocaleDateString()}</p>
                    <div className="input-group input-group-sm mb-2">
                      <input
                        type="number"
                        className="form-control"
                        value={formData.trialDays}
                        onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) })}
                        min="1"
                      />
                      <span className="input-group-text">days</span>
                    </div>
                    <button className="btn btn-sm btn-outline-primary" onClick={handleExtendTrial}>
                      Extend Trial
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h5 className="card-title fw-bold mb-3">Quick Stats</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Users</span>
                  <span className="fw-semibold">{tenant.users.length}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Employees</span>
                  <span className="fw-semibold">{tenant.employees.length}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Payroll Runs</span>
                  <span className="fw-semibold">{tenant.payrollRuns.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title fw-bold mb-0">System Users</h5>
              <span className="badge bg-light text-dark">{tenant.users.length} users</span>
            </div>
            {tenant.users.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenant.users.map((user) => (
                      <tr key={user.id}>
                        <td className="fw-semibold">{user.fullName}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className="badge bg-dark">{user.role.replace(/_/g, ' ')}</span>
                        </td>
                        <td>
                          <span className={`badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                            {user.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td>
                          <small>{new Date(user.createdAt).toLocaleDateString()}</small>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleAssignRole(user)}
                              title="Change Role"
                            >
                              <i className="bi bi-person-badge"></i> Role
                            </button>
                            <button
                              className="btn btn-outline-warning"
                              onClick={() => handleResetPassword(user)}
                              title="Reset Password"
                            >
                              <i className="bi bi-key"></i> Password
                            </button>
                            <button
                              className={`btn ${user.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                              title={user.isActive ? 'Suspend User' : 'Activate User'}
                            >
                              {user.isActive ? '⛔ Suspend' : '✓ Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <p className="text-muted mb-0">No users found</p>
                <small className="text-muted">The company admin will create users after registration</small>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-light rounded">
              <h6 className="fw-bold mb-2">🔐 User Management Guide</h6>
              <small className="text-muted">
                <strong>Role Assignment:</strong> Set user permissions (Admin, Payroll Officer, Manager, Employee)<br />
                <strong>Password Reset:</strong> Generate temporary password for locked-out users<br />
                <strong>Suspend/Activate:</strong> Immediately revoke or restore access (for terminated employees or security)
              </small>
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === 'employees' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="card-title fw-bold mb-3">Employees</h5>
            <p className="text-muted small mb-3">
              Note: Sensitive employee data (salaries, national IDs) is encrypted and not accessible to super admin.
            </p>
            {tenant.employees.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Employee #</th>
                      <th>Name</th>
                      <th>Job Title</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenant.employees.map((employee) => (
                      <tr key={employee.id}>
                        <td><code>{employee.employeeNumber}</code></td>
                        <td className="fw-semibold">{employee.firstName} {employee.lastName}</td>
                        <td>{employee.jobTitle || '-'}</td>
                        <td>
                          <span className={`badge ${employee.isActive ? 'bg-success' : 'bg-secondary'}`}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted mb-0">No employees found</p>
            )}
          </div>
        </div>
      )}

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="card-title fw-bold mb-3">Subscription History</h5>
            {tenant.subscriptions.length > 0 ? (
              <div className="row">
                {tenant.subscriptions.map((sub) => (
                  <div key={sub.id} className="col-md-6 mb-3">
                    <div className="card bg-light border-0">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="fw-bold mb-0">{sub.plan.name}</h6>
                          <span className={`badge ${getStatusBadge(sub.status)}`}>
                            {sub.status}
                          </span>
                        </div>
                        <p className="text-muted small mb-3">{sub.plan.description}</p>
                        <div className="row small">
                          <div className="col-6 mb-2">
                            <span className="text-muted">Amount</span>
                            <p className="fw-semibold mb-0">
                              {sub.currency === 'USD' ? `$${sub.amountUSD}` : `ZWL ${sub.amountZWL}`}
                            </p>
                          </div>
                          <div className="col-6 mb-2">
                            <span className="text-muted">Period</span>
                            <p className="mb-0">
                              {new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted mb-0">No subscription history</p>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="card-title fw-bold mb-3">Payment History</h5>
            {tenant.subscriptions.some(s => s.payments.length > 0) ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenant.subscriptions.flatMap(sub => sub.payments).map((payment) => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                        <td className="fw-semibold">
                          {payment.currency === 'USD' ? '$' : 'ZWL '}{payment.amount.toFixed(2)}
                        </td>
                        <td>
                          <span className="badge bg-secondary">{payment.method || 'N/A'}</span>
                        </td>
                        <td>
                          <span className={`badge ${getPaymentStatusBadge(payment.status)}`}>
                            {payment.status}
                          </span>
                        </td>
                        <td>
                          {payment.status === 'PENDING' && (
                            <button 
                              className="btn btn-sm btn-outline-success"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              Verify Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted mb-0">No payment history</p>
            )}
          </div>
        </div>
      )}

      {/* Payment Verification Modal */}
      {selectedPayment && (
        <PaymentVerificationModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onSuccess={() => {
            setAlert({ type: 'success', message: 'Payment updated successfully' });
            fetchTenantDetails();
          }}
        />
      )}

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <RoleAssignmentModal
          user={selectedUser}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setAlert({ type: 'success', message: 'User role updated successfully' });
            fetchTenantDetails();
          }}
        />
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <PasswordResetModal
          user={selectedUser}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setAlert({ type: 'success', message: 'Password reset successfully' });
            fetchTenantDetails();
          }}
        />
      )}
    </div>
  );
};

export default TenantDetails;
