import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface Payslip {
  id: string;
  employee: {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    department: {
      name: string;
    };
  };
  basicSalary: number;
  allowances: number;
  bonuses: number;
  overtime: number;
  grossSalary: number;
  paye: number;
  aidsLevy: number;
  nssaEmployee: number;
  nssaEmployer: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  currency: string;
}

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
  payslips: Payslip[];
}

const PayrollRunDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [payrollRun, setPayrollRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrollRun();
  }, [id]);

  const fetchPayrollRun = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.get(`${API_URL}/payroll/runs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayrollRun(response.data.payrollRun);
    } catch (error) {
      console.error('Error fetching payroll run:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="container-fluid py-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!payrollRun) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger">Payroll run not found</div>
      </div>
    );
  }

  const totalPaye = payrollRun.payslips.reduce((sum, p) => sum + p.paye, 0);
  const totalNssa = payrollRun.payslips.reduce((sum, p) => sum + p.nssaEmployee + p.nssaEmployer, 0);
  const totalAidsLevy = payrollRun.payslips.reduce((sum, p) => sum + p.aidsLevy, 0);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Payroll Run Details</h2>
        <button className="btn btn-outline-secondary" onClick={() => window.location.href = '/payroll-runs'}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Payroll Runs
        </button>
      </div>

      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">Period</h6>
              <p className="mb-0">
                <strong>{formatDate(payrollRun.periodStart)}</strong>
                <br />
                to
                <br />
                <strong>{formatDate(payrollRun.periodEnd)}</strong>
              </p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Employees</h6>
              <h3 className="mb-0">{payrollRun.payslips.length}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Gross</h6>
              <h3 className="mb-0">${payrollRun.totalGross?.toFixed(2) || '0.00'}</h3>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total Net</h6>
              <h3 className="mb-0">${payrollRun.totalNet?.toFixed(2) || '0.00'}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total PAYE</h6>
              <h4 className="mb-0">${totalPaye.toFixed(2)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total NSSA</h6>
              <h4 className="mb-0">${totalNssa.toFixed(2)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h6 className="text-muted mb-2">Total AIDS Levy</h6>
              <h4 className="mb-0">${totalAidsLevy.toFixed(2)}</h4>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h6 className="text-muted mb-1">Processed By</h6>
          <p className="mb-0">
            <strong>{payrollRun.createdBy.fullName}</strong> ({payrollRun.createdBy.email})
            <br />
            <span className="text-muted">{formatDateTime(payrollRun.createdAt)}</span>
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Employee Payslips</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th className="text-end">Basic</th>
                  <th className="text-end">Allowances</th>
                  <th className="text-end">Bonuses</th>
                  <th className="text-end">Overtime</th>
                  <th className="text-end">Gross</th>
                  <th className="text-end">PAYE</th>
                  <th className="text-end">AIDS Levy</th>
                  <th className="text-end">NSSA (EE)</th>
                  <th className="text-end">NSSA (ER)</th>
                  <th className="text-end">Other</th>
                  <th className="text-end">Net</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrollRun.payslips.map((payslip) => (
                  <tr key={payslip.id}>
                    <td>
                      <div>
                        <strong>{payslip.employee.firstName} {payslip.employee.lastName}</strong>
                        <div className="small text-muted">{payslip.employee.employeeNumber}</div>
                      </div>
                    </td>
                    <td>{payslip.employee.department?.name || 'N/A'}</td>
                    <td className="text-end">{payslip.currency} {payslip.basicSalary.toFixed(2)}</td>
                    <td className="text-end">{payslip.currency} {payslip.allowances.toFixed(2)}</td>
                    <td className="text-end">{payslip.currency} {payslip.bonuses.toFixed(2)}</td>
                    <td className="text-end">{payslip.currency} {payslip.overtime.toFixed(2)}</td>
                    <td className="text-end"><strong>{payslip.currency} {payslip.grossSalary.toFixed(2)}</strong></td>
                    <td className="text-end">{payslip.currency} {payslip.paye.toFixed(2)}</td>
                    <td className="text-end">{payslip.currency} {payslip.aidsLevy.toFixed(2)}</td>
                    <td className="text-end">{payslip.currency} {payslip.nssaEmployee.toFixed(2)}</td>
                    <td className="text-end">{payslip.currency} {payslip.nssaEmployer.toFixed(2)}</td>
                    <td className="text-end">{payslip.currency} {payslip.otherDeductions.toFixed(2)}</td>
                    <td className="text-end"><strong>{payslip.currency} {payslip.netSalary.toFixed(2)}</strong></td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => window.location.href = `/payslips/${payslip.id}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollRunDetail;
