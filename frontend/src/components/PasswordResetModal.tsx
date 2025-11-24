import React, { useState } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  fullName: string;
}

interface Props {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const PasswordResetModal: React.FC<Props> = ({ user, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'auto' | 'custom'>('auto');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const handleGeneratePassword = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/user-management/users/${user.id}/generate-password`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTempPassword(response.data.tempPassword);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate password');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/user-management/users/${user.id}/reset-password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Reset Password</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}

            <div className="mb-3">
              <label className="form-label fw-semibold">User</label>
              <p className="mb-0">{user.fullName}</p>
              <small className="text-muted">{user.email}</small>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Reset Method</label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${mode === 'auto' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setMode('auto')}
                >
                  Generate Temporary Password
                </button>
                <button
                  type="button"
                  className={`btn ${mode === 'custom' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setMode('custom')}
                >
                  Set Custom Password
                </button>
              </div>
            </div>

            {mode === 'auto' && (
              <>
                {!tempPassword ? (
                  <div className="text-center">
                    <p className="text-muted mb-3">
                      A random temporary password will be generated for this user.
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleGeneratePassword}
                      disabled={loading}
                    >
                      {loading ? 'Generating...' : 'Generate Password'}
                    </button>
                  </div>
                ) : (
                  <div className="alert alert-success">
                    <h6 className="fw-bold">Password Generated!</h6>
                    <div className="input-group mb-2">
                      <input
                        type="text"
                        className="form-control"
                        value={tempPassword}
                        readOnly
                      />
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => navigator.clipboard.writeText(tempPassword)}
                      >
                        Copy
                      </button>
                    </div>
                    <small>
                      Share this password securely with the user via WhatsApp, email, or phone. They should change it after first login.
                    </small>
                  </div>
                )}
              </>
            )}

            {mode === 'custom' && (
              <form onSubmit={handleCustomReset}>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {tempPassword ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;
