import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  companyEmail: string;
  createdAt: string;
  _count: {
    users: number;
    employees: number;
    payrollRuns: number;
  };
}

interface Stats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalRevenue: number;
  totalEmployees: number;
  totalPayrollRuns: number;
}

const SuperAdminDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [tenantsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/super-admin/tenants`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/super-admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setTenants(tenantsRes.data.tenants);
      setStats(statsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching super admin data:', error);
      setLoading(false);
    }
  };

  const filteredTenants = tenants.filter(t => {
    if (filter === 'ALL') return true;
    if (filter === 'TRIAL') return t.subscriptionStatus === 'TRIAL';
    if (filter === 'ACTIVE') return t.subscriptionStatus === 'ACTIVE';
    if (filter === 'EXPIRED') return t.subscriptionStatus === 'EXPIRED';
    return true;
  });

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

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Super Admin Dashboard</h2>
          <p className="text-muted mb-0">Platform overview and tenant management</p>
        </div>
        <button className="btn btn-dark" onClick={() => window.location.href = '/super-admin/plans'}>
          Manage Plans
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="text-muted mb-1 small text-uppercase fw-semibold">Total Companies</p>
                    <h2 className="fw-bold mb-0">{stats.totalTenants}</h2>
                  </div>
                  <div className="bg-light rounded p-3">
                    <h3 className="mb-0">🏢</h3>
                  </div>
                </div>
                <div className="d-flex gap-3 small mt-3">
                  <div>
                    <span className="badge bg-success">{stats.activeTenants} Active</span>
                  </div>
                  <div>
                    <span className="badge bg-warning text-dark">{stats.trialTenants} Trial</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="text-muted mb-1 small text-uppercase fw-semibold">Monthly Revenue</p>
                    <h2 className="fw-bold mb-0">${stats.totalRevenue.toLocaleString()}</h2>
                  </div>
                  <div className="bg-light rounded p-3">
                    <h3 className="mb-0">💰</h3>
                  </div>
                </div>
                <small className="text-muted">From active subscriptions</small>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <p className="text-muted mb-1 small text-uppercase fw-semibold">Platform Usage</p>
                    <h2 className="fw-bold mb-0">{stats.totalEmployees}</h2>
                  </div>
                  <div className="bg-light rounded p-3">
                    <h3 className="mb-0">👥</h3>
                  </div>
                </div>
                <small className="text-muted">{stats.totalPayrollRuns} payroll runs processed</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenants Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="fw-bold mb-0">All Companies</h5>
            <div className="btn-group" role="group">
              <button
                type="button"
                className={`btn btn-sm ${filter === 'ALL' ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setFilter('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filter === 'TRIAL' ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setFilter('TRIAL')}
              >
                Trial
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filter === 'ACTIVE' ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setFilter('ACTIVE')}
              >
                Active
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filter === 'EXPIRED' ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setFilter('EXPIRED')}
              >
                Expired
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="bg-light">
                <tr>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Employees</th>
                  <th>Payrolls</th>
                  <th>Trial Ends</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <div>
                        <strong>{tenant.name}</strong>
                        <div className="small text-muted">{tenant.slug}</div>
                      </div>
                    </td>
                    <td>{tenant.companyEmail}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(tenant.subscriptionStatus)}`}>
                        {tenant.subscriptionStatus}
                      </span>
                    </td>
                    <td className="text-center">{tenant._count.users}</td>
                    <td className="text-center">{tenant._count.employees}</td>
                    <td className="text-center">{tenant._count.payrollRuns}</td>
                    <td>
                      {tenant.trialEndsAt ? (
                        <small>{new Date(tenant.trialEndsAt).toLocaleDateString()}</small>
                      ) : (
                        <small className="text-muted">-</small>
                      )}
                    </td>
                    <td>
                      <small>{new Date(tenant.createdAt).toLocaleDateString()}</small>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-dark"
                        onClick={() => window.location.href = `/super-admin/tenants/${tenant.id}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTenants.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted">No companies found matching the filter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
