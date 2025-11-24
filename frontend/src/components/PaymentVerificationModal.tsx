import React, { useState } from 'react';
import axios from 'axios';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  createdAt: string;
}

interface Props {
  payment: Payment;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentVerificationModal: React.FC<Props> = ({ payment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    status: 'PAID',
    method: payment.method || 'BANK_TRANSFER',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/super-admin/payments/${payment.id}/verify`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      setError(err.response?.data?.error || 'Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Verify Payment</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label fw-semibold">Payment Amount</label>
                <p className="mb-0">
                  {payment.currency === 'USD' ? '$' : 'ZWL '}{payment.amount.toFixed(2)}
                </p>
                <small className="text-muted">
                  Submitted on {new Date(payment.createdAt).toLocaleString()}
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  required
                >
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="ECOCASH">Ecocash</option>
                  <option value="ONEMONEY">OneMoney</option>
                  <option value="PAYNOW">Paynow</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="PAID">Verified - PAID</option>
                  <option value="FAILED">Rejected - FAILED</option>
                  <option value="PENDING">Keep as PENDING</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Reference number, transaction ID, or any other notes..."
                />
              </div>

              {formData.status === 'PAID' && (
                <div className="alert alert-success">
                  <small>
                    <strong>Note:</strong> Marking this as PAID will activate the company's subscription automatically.
                  </small>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Updating...
                  </>
                ) : (
                  'Update Payment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerificationModal;
