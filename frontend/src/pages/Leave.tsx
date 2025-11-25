import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Alert, Badge, Table, Modal, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: {
    name: string;
  };
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  halfDay: boolean;
  reason: string;
  status: string;
  reviewNotes?: string;
  employee: Employee;
  reviewer?: {
    fullName: string;
    email: string;
  };
  createdAt: string;
  reviewedAt?: string;
}

const Leave: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [generatedLink, setGeneratedLink] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchEmployees();
    fetchRequests();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data.employees);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/leave/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data.leaveRequests.filter((req: LeaveRequest) => Number(req.totalDays) > 0));
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    }
  };

  const handleGenerateLink = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/leave/employee/${employee.id}/generate-token`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGeneratedLink(response.data.leaveRequestUrl);
      setShowLinkModal(true);
    } catch (error: any) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.error || 'Failed to generate leave request link'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setMessage({ type: 'success', text: 'Link copied to clipboard!' });
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      PENDING: 'warning',
      APPROVED: 'success',
      REJECTED: 'danger',
      CANCELLED: 'secondary'
    };
    return <Badge bg={badges[status] || 'secondary'}>{status}</Badge>;
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: any = {
      ANNUAL: 'Annual Leave',
      SICK: 'Sick Leave',
      MATERNITY: 'Maternity Leave',
      PATERNITY: 'Paternity Leave',
      COMPASSIONATE: 'Compassionate Leave',
      UNPAID: 'Unpaid Leave',
      STUDY: 'Study Leave'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const canManageLeave = ['ADMIN'].includes(user?.role || '');

  if (!canManageLeave) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          Only HR admins can manage leave requests. Please contact your HR department.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📅 Leave Management</h2>
        <Button variant="dark" onClick={() => setShowLinkModal(true)}>
          + Generate Leave Request Link
        </Button>
      </div>

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Generate Link for Employees */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-dark text-white">
          <h5 className="mb-0">Generate Leave Request Links</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-3">
            Generate a unique leave request link for each employee. Share the link via email or WhatsApp.
            The employee fills the form (no login required), and you'll review and approve/reject.
          </p>
          
          {employees.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Employee #</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.employeeNumber}</td>
                    <td>
                      {employee.firstName} {employee.lastName}
                    </td>
                    <td>{employee.email || <span className="text-muted">N/A</span>}</td>
                    <td>
                      {employee.department?.name || <span className="text-muted">N/A</span>}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleGenerateLink(employee)}
                        disabled={loading}
                      >
                        🔗 Generate Link
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted py-4">
              <p>No employees found</p>
              <small>Add employees first to generate leave request links</small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* All Leave Requests */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">All Leave Requests ({requests.length})</h5>
        </Card.Header>
        <Card.Body>
          {requests.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>
                      <strong>
                        {request.employee.firstName} {request.employee.lastName}
                      </strong>
                      <br />
                      <small className="text-muted">{request.employee.employeeNumber}</small>
                    </td>
                    <td>{getLeaveTypeLabel(request.leaveType)}</td>
                    <td>
                      <small>
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </small>
                    </td>
                    <td>
                      {Number(request.totalDays).toFixed(1)}
                      {request.halfDay && <><br /><small>(Half)</small></>}
                    </td>
                    <td>
                      <small>{request.reason}</small>
                    </td>
                    <td>
                      <small className="text-muted">{formatDate(request.createdAt)}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted py-4">
              <p>No leave requests submitted yet</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Generated Link Modal */}
      <Modal show={showLinkModal} onHide={() => {
        setShowLinkModal(false);
        setGeneratedLink('');
        setSelectedEmployee(null);
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Leave Request Link Generated</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmployee && !generatedLink && (
            <div className="text-center py-4">
              <h5 className="mb-3">Select Employee</h5>
              <Form.Select
                onChange={(e) => {
                  const emp = employees.find(emp => emp.id === e.target.value);
                  if (emp) handleGenerateLink(emp);
                }}
              >
                <option value="">Choose employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeNumber})
                  </option>
                ))}
              </Form.Select>
            </div>
          )}

          {generatedLink && selectedEmployee && (
            <>
              <Alert variant="success">
                <strong>✓ Link generated successfully!</strong>
              </Alert>

              <div className="mb-3">
                <strong>Employee:</strong> {selectedEmployee.firstName} {selectedEmployee.lastName}
                <br />
                <strong>Email:</strong> {selectedEmployee.email || 'N/A'}
              </div>

              <Form.Group className="mb-3">
                <Form.Label><strong>Leave Request Link:</strong></Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    value={generatedLink}
                    readOnly
                    style={{ fontSize: '0.9rem' }}
                  />
                  <Button variant="primary" onClick={copyToClipboard}>
                    📋 Copy
                  </Button>
                </InputGroup>
                <Form.Text className="text-muted">
                  Link valid for 30 days
                </Form.Text>
              </Form.Group>

              <Alert variant="info">
                <strong>📧 How to share:</strong>
                <ul className="mb-0 mt-2">
                  <li>Copy the link above</li>
                  <li>Send via Email, WhatsApp, or SMS to the employee</li>
                  <li>Employee fills the form (no login needed)</li>
                  <li>You'll review and approve/reject from "Leave Approvals" page</li>
                </ul>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowLinkModal(false);
            setGeneratedLink('');
            setSelectedEmployee(null);
          }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Leave;
