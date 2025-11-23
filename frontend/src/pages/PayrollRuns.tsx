import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PayrollRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalGross: number;
  totalNet: number;
  createdAt: string;
  createdBy: {
    fullName: string;
    email: string;
  };
  _count: {
    payslips: number;
  };
}

const PayrollRuns: React.FC = () => {
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrollRuns();
  }, []);

  const fetchPayrollRuns = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.get(`${API_URL}/payroll/runs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayrollRuns(response.data.payrollRuns);
    } catch (error) {
      console.error('Error fetching payroll runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      COMPLETED: 'success',
      PROCESSING: 'warning',
      FAILED: 'danger',
      DRAFT: 'secondary'
    };
    return `badge bg-${badges[status] || 'secondary'}`;
  };

  if (loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Payroll Runs</h2>
        <button className="btn btn-primary" onClick={() => window.location.href = '/payroll'}>
          <i className="bi bi-plus-circle me-2"></i>
          Process New Payroll
        </button>
      </div>

      {payrollRuns.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="bi bi-cash-stack" style={{ fontSize: '48px', color: '#ccc' }}></i>
            <h4 className="mt-3">No payroll runs yet</h4>
            <p className="text-muted">Click "Process New Payroll" to run your first payroll</p>
            <button className="btn btn-primary" onClick={() => window.location.href = '/payroll'}>
              Process New Payroll
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Employees</th>
                    <th>Total Gross</th>
                    <th>Total Net</th>
                    <th>Processed By</th>
                    <th>Processed At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollRuns.map((run) => (
                    <tr key={run.id}>
                      <td>
                        <div>
                          <strong>{formatDate(run.periodStart)}</strong>
                          <span className="text-muted mx-1">to</span>
                          <strong>{formatDate(run.periodEnd)}</strong>
                        </div>
                      </td>
                      <td>
                        <span className={getStatusBadge(run.status)}>
                          {run.status}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {run._count.payslips} employees
                        </span>
                      </td>
                      <td>
                        <strong>${run.totalGross?.toFixed(2) || '0.00'}</strong>
                      </td>
                      <td>
                        <strong>${run.totalNet?.toFixed(2) || '0.00'}</strong>
                      </td>
                      <td>
                        <div>
                          <div>{run.createdBy.fullName}</div>
                          <div className="small text-muted">{run.createdBy.email}</div>
                        </div>
                      </td>
                      <td>{formatDateTime(run.createdAt)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => window.location.href = `/payroll-runs/${run.id}`}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollRuns;
