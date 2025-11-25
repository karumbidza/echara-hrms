import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  plan: {
    id: string;
    name: string;
    slug: string;
    features: string[];
  };
}

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

interface Tenant {
  id: string;
  name: string;
  subscriptionStatus: string;
  subscriptions: Subscription[];
  users: User[];
  _count: {
    employees: number;
    users: number;
  };
}

const FEATURE_GROUPS = {
  'Control Center': [
    { key: 'employees', label: 'Employee Management', description: 'Add, edit, view employees' },
    { key: 'departments', label: 'Department Management', description: 'Manage organizational departments' },
    { key: 'contracts', label: 'Contract Management', description: 'Contract tracking, renewals, notifications' },
  ],
  'Approvals': [
    { key: 'leaveApprovals', label: 'Leave Approvals', description: 'Approve/reject leave requests' },
    { key: 'payrollApprovals', label: 'Payroll Approvals', description: 'Approve payroll runs' },
  ],
  'Core Features': [
    { key: 'payroll', label: 'Payroll Processing', description: 'Run payroll, generate payslips' },
    { key: 'leave', label: 'Leave Management', description: 'Request and track leave' },
    { key: 'documents', label: 'Document Management', description: 'Upload and manage documents' },
  ],
  'Advanced': [
    { key: 'reports', label: 'Reports & Analytics', description: 'Leave liability, NSSA/PAYE, currency reports' },
    { key: 'timesheets', label: 'Timesheets', description: 'Time tracking and attendance' },
    { key: 'analytics', label: 'Advanced Analytics', description: 'Deep insights and dashboards' },
    { key: 'customFields', label: 'Custom Fields', description: 'Add custom employee fields' },
    { key: 'apiAccess', label: 'API Access', description: 'REST API for integrations' },
  ]
};

const ROLES = [
  { value: 'ADMIN', label: 'Admin', badge: 'danger' },
  { value: 'MANAGER', label: 'Manager', badge: 'primary' },
  { value: 'GENERAL_MANAGER', label: 'General Manager', badge: 'warning' },
  { value: 'FINANCE_MANAGER', label: 'Finance Manager', badge: 'info' },
  { value: 'EMPLOYEE', label: 'Employee', badge: 'secondary' },
];

const TenantSubscription: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Feature assignment state
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  // User management modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    fetchTenantDetails();
  }, [id]);

  const fetchTenantDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/super-admin/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Tenant data received:', response.data);
      setTenant(response.data);
      
      // Set initial selected features from active subscription
      if (response.data.subscriptions && response.data.subscriptions.length > 0) {
        const activeSubscription = response.data.subscriptions.find((sub: Subscription) => sub.status === 'ACTIVE');
        if (activeSubscription && activeSubscription.plan.features) {
          setSelectedFeatures(activeSubscription.plan.features);
        }
      }
    } catch (err: any) {
      console.error('Error fetching tenant:', err);
      setError(err.response?.data?.error || 'Failed to fetch tenant details');
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = (featureKey: string) => {
    setSelectedFeatures(prev => {
      if (prev.includes(featureKey)) {
        return prev.filter(f => f !== featureKey);
      } else {
        return [...prev, featureKey];
      }
    });
  };

  const handleSaveFeatures = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/super-admin/tenants/${id}/features`,
        { features: selectedFeatures },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Features updated successfully!');
      fetchTenantDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setUserRole(user.role);
    setShowUserModal(true);
  };

  const handleUpdateUserRole = async () => {
    if (!selectedUser) return;

    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/super-admin/tenants/${id}/users/${selectedUser.id}/role`,
        { role: userRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`User role updated to ${userRole}`);
      setShowUserModal(false);
      fetchTenantDetails();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update user role');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
        <p>Loading tenant details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error Loading Tenant</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={() => navigate('/super-admin')}>
            ← Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!tenant) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          <Alert.Heading>Tenant Not Found</Alert.Heading>
          <p>The requested tenant could not be found.</p>
          <Button variant="outline-secondary" onClick={() => navigate('/super-admin')}>
            ← Back to Dashboard
          </Button>
        </Alert>
      </Container>
    );
  }

  const activeSubscription = tenant.subscriptions?.find(sub => sub.status === 'ACTIVE');

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <Button variant="outline-secondary" size="sm" onClick={() => navigate('/super-admin')}>
            ← Back to Dashboard
          </Button>
          <h2 className="mt-3">Manage Subscription: {tenant.name}</h2>
          <p className="text-muted">
            {tenant._count?.employees || 0} Employees · {tenant._count?.users || 0} Users · Status: 
            <Badge bg={tenant.subscriptionStatus === 'ACTIVE' ? 'success' : 'warning'} className="ms-2">
              {tenant.subscriptionStatus}
            </Badge>
          </p>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      <Row>
        {/* Feature Assignment Section */}
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">🎯 Feature Assignment</h5>
              {activeSubscription && (
                <small>Current Plan: {activeSubscription.plan.name}</small>
              )}
            </Card.Header>
            <Card.Body>
              {Object.entries(FEATURE_GROUPS).map(([groupName, features]) => (
                <div key={groupName} className="mb-4">
                  <h6 className="text-primary mb-3">
                    <strong>{groupName}</strong>
                  </h6>
                  {features.map((feature) => (
                    <Form.Check
                      key={feature.key}
                      type="checkbox"
                      id={`feature-${feature.key}`}
                      className="mb-3"
                      checked={selectedFeatures.includes(feature.key)}
                      onChange={() => handleFeatureToggle(feature.key)}
                      label={
                        <div>
                          <strong>{feature.label}</strong>
                          <br />
                          <small className="text-muted">{feature.description}</small>
                        </div>
                      }
                    />
                  ))}
                </div>
              ))}

              <div className="mt-4 pt-3 border-top">
                <Button 
                  variant="success" 
                  onClick={handleSaveFeatures} 
                  disabled={saving}
                  className="me-2"
                >
                  {saving ? <Spinner animation="border" size="sm" /> : '💾 Save Features'}
                </Button>
                <Button variant="outline-secondary" onClick={fetchTenantDetails}>
                  🔄 Reset
                </Button>
                <div className="mt-2">
                  <small className="text-muted">
                    {selectedFeatures.length} features enabled
                  </small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* User Management Section */}
        <Col md={4}>
          <Card>
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">👥 User Management</h5>
            </Card.Header>
            <Card.Body>
              <p className="small text-muted">Click on a user to assign roles</p>
              <Table hover size="sm">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.users && tenant.users.length > 0 ? (
                    tenant.users.map(user => (
                      <tr 
                        key={user.id} 
                        onClick={() => handleUserClick(user)}
                        style={{ cursor: 'pointer' }}
                        className="user-row"
                      >
                        <td>
                          <div>
                            <strong>{user.fullName}</strong>
                            <br />
                            <small className="text-muted">{user.email}</small>
                          </div>
                        </td>
                        <td>
                          <Badge 
                            bg={ROLES.find(r => r.value === user.role)?.badge || 'secondary'}
                          >
                            {user.role}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="text-center text-muted">No users found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Subscription Details */}
          {activeSubscription && (
            <Card className="mt-3">
              <Card.Header>📋 Subscription Details</Card.Header>
              <Card.Body>
                <p><strong>Plan:</strong> {activeSubscription.plan.name}</p>
                <p><strong>Status:</strong> 
                  <Badge bg="success" className="ms-2">{activeSubscription.status}</Badge>
                </p>
                <p><strong>Start Date:</strong><br/>
                  {new Date(activeSubscription.startDate).toLocaleDateString()}
                </p>
                {activeSubscription.endDate && (
                  <p><strong>End Date:</strong><br/>
                    {new Date(activeSubscription.endDate).toLocaleDateString()}
                  </p>
                )}
                <p className="mb-0">
                  <strong>Features:</strong><br/>
                  <Badge bg="secondary">{activeSubscription.plan.features.length} enabled</Badge>
                </p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* User Role Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Role: {selectedUser?.fullName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted">{selectedUser?.email}</p>
          <Form.Group>
            <Form.Label>Select Role</Form.Label>
            <Form.Select 
              value={userRole} 
              onChange={(e) => setUserRole(e.target.value)}
            >
              {ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <div className="mt-3">
            <small className="text-muted">
              <strong>Role Permissions:</strong>
              <ul className="mt-2">
                {userRole === 'ADMIN' && <li>Full system access, user management</li>}
                {userRole === 'MANAGER' && <li>Leave approvals, contract management</li>}
                {userRole === 'GENERAL_MANAGER' && <li>Payroll approvals, reporting</li>}
                {userRole === 'FINANCE_MANAGER' && <li>Payroll approvals, financial reports</li>}
                {userRole === 'EMPLOYEE' && <li>Basic access, self-service</li>}
              </ul>
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateUserRole} disabled={saving}>
            {saving ? <Spinner animation="border" size="sm" /> : 'Update Role'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .user-row:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </Container>
  );
};

export default TenantSubscription;
