import React, { useState } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

interface Props {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const RoleAssignmentModal: React.FC<Props> = ({ user, onClose, onSuccess }) => {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const roles = [
    { value: 'ADMIN', label: 'Admin', description: 'Full access to all company features' },
    { value: 'PAYROLL_OFFICER', label: 'Payroll Officer', description: 'Process payroll, manage employees' },
    { value: 'MANAGER', label: 'Manager', description: 'View reports, approve leave' },
    { value: 'EMPLOYEE', label: 'Employee', description: 'Self-service portal only' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/user-management/users/${user.id}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Assign Role</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="mb-3">
                <label className="form-label fw-semibold">User</label>
                <p className="mb-0">{user.fullName}</p>
                <small className="text-muted">{user.email}</small>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Current Role</label>
                <p className="mb-0">
                  <span className="badge bg-secondary">{user.role}</span>
                </p>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Assign New Role</label>
                {roles.map((r) => (
                  <div key={r.value} className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="role"
                      id={r.value}
                      value={r.value}
                      checked={role === r.value}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <label className="form-check-label" htmlFor={r.value}>
                      <strong>{r.label}</strong>
                      <div className="small text-muted">{r.description}</div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="alert alert-warning">
                <small>
                  <strong>Note:</strong> This will immediately update the user's permissions. They may need to log out and log back in for changes to take effect.
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || role === user.role}>
                {loading ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleAssignmentModal;
