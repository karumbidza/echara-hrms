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

interface LeaveBalance {
  id: string;
  year: number;
  annualTotal: number;
  annualUsed: number;
  annualBalance: number;
  annualCarryOver: number;
  sickUsed: number;
  maternityUsed: number;
  paternityUsed: number;
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
  reviewer?: {
    fullName: string;
    email: string;
  };
  createdAt: string;
  reviewedAt?: string;
}

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
}

const Leave: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    halfDay: false,
    reason: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  useEffect(() => {
    if (employee) {
      fetchBalance();
      fetchRequests();
    }
  }, [employee]);

  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Find employee record for current user
      const myEmployee = response.data.employees.find(
        (emp: any) => emp.email === user?.email
      );
      
      if (myEmployee) {
        setEmployee(myEmployee);
      }
    } catch (error) {
      console.error('Failed to fetch employee data:', error);
    }
  };

  const fetchBalance = async () => {
    if (!employee) return;
    
    try {
      const token = localStorage.getItem('token');
      const year = new Date().getFullYear();
      const response = await axios.get(`${API_URL}/leave/balance/${employee.id}?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBalance(response.data.balance);
    } catch (error) {
      console.error('Failed to fetch leave balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    if (!employee) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/leave/requests?employeeId=${employee.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data.leaveRequests);
    } catch (error) {
      console.error('Failed to fetch leave requests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employee) {
      setMessage({ type: 'danger', text: 'Employee record not found' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/leave/requests`,
        {
          employeeId: employee.id,
          ...formData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Leave request submitted successfully!' });
      setShowRequestModal(false);
      setFormData({
        leaveType: 'ANNUAL',
        startDate: '',
        endDate: '',
        halfDay: false,
        reason: ''
      });
      
      fetchBalance();
      fetchRequests();
    } catch (error: any) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.error || 'Failed to submit leave request'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/leave/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ type: 'success', text: 'Leave request cancelled' });
      fetchRequests();
    } catch (error: any) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.error || 'Failed to cancel leave request'
      });
    }
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

  if (loading && !balance) {
    return (
      <Container className="mt-4">
        <div className="text-center">Loading...</div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📅 My Leave</h2>
        <Button variant="dark" onClick={() => setShowRequestModal(true)}>
          + New Leave Request
        </Button>
      </div>

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Leave Balance Card */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-dark text-white">
          <h5 className="mb-0">{balance?.year || new Date().getFullYear()} Leave Balance</h5>
        </Card.Header>
        <Card.Body>
          {balance ? (
            <div className="row">
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h3 className="text-primary mb-1">{Number(balance.annualBalance).toFixed(1)}</h3>
                  <small className="text-muted">Annual Leave Available</small>
                  <div className="mt-2">
                    <small className="text-muted">
                      Total: {Number(balance.annualTotal).toFixed(1)} | 
                      Used: {Number(balance.annualUsed).toFixed(1)}
                    </small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h3 className="text-info mb-1">{Number(balance.sickUsed).toFixed(1)}</h3>
                  <small className="text-muted">Sick Leave Used</small>
                  <div className="mt-2">
                    <small className="text-muted">No statutory limit</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h3 className="text-warning mb-1">{Number(balance.annualCarryOver).toFixed(1)}</h3>
                  <small className="text-muted">Carried Over</small>
                  <div className="mt-2">
                    <small className="text-muted">From previous year</small>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="text-center p-3 border rounded">
                  <h3 className="text-success mb-1">{Number(balance.maternityUsed + balance.paternityUsed).toFixed(1)}</h3>
                  <small className="text-muted">Other Leave Used</small>
                  <div className="mt-2">
                    <small className="text-muted">Maternity/Paternity</small>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted">
              <p>Leave balance not initialized</p>
              <small>Contact your HR administrator</small>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Leave Requests Table */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">My Leave Requests</h5>
        </Card.Header>
        <Card.Body>
          {requests.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Reviewer</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{getStatusBadge(request.status)}</td>
                    <td>{getLeaveTypeLabel(request.leaveType)}</td>
                    <td>{formatDate(request.startDate)}</td>
                    <td>{formatDate(request.endDate)}</td>
                    <td>
                      {Number(request.totalDays).toFixed(1)}
                      {request.halfDay && ' (Half)'}
                    </td>
                    <td>
                      <small>{request.reason}</small>
                    </td>
                    <td>
                      {request.reviewer ? (
                        <small>
                          {request.reviewer.fullName}
                          <br />
                          {request.reviewedAt && formatDate(request.reviewedAt)}
                        </small>
                      ) : (
                        <small className="text-muted">Pending</small>
                      )}
                    </td>
                    <td>
                      {request.reviewNotes && (
                        <small className="text-muted">{request.reviewNotes}</small>
                      )}
                    </td>
                    <td>
                      {request.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted py-4">
              <p>No leave requests yet</p>
              <Button variant="dark" onClick={() => setShowRequestModal(true)}>
                Submit Your First Request
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* New Leave Request Modal */}
      <Modal show={showRequestModal} onHide={() => setShowRequestModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>New Leave Request</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Leave Type</Form.Label>
              <Form.Select
                value={formData.leaveType}
                onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                required
              >
                <option value="ANNUAL">Annual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="MATERNITY">Maternity Leave</option>
                <option value="PATERNITY">Paternity Leave</option>
                <option value="COMPASSIONATE">Compassionate Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
                <option value="STUDY">Study Leave</option>
              </Form.Select>
              <Form.Text className="text-muted">
                {formData.leaveType === 'ANNUAL' && balance && (
                  <>Available: {Number(balance.annualBalance).toFixed(1)} days</>
                )}
              </Form.Text>
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </Form.Group>
              </div>
            </div>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Half Day"
                checked={formData.halfDay}
                onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
              />
              <Form.Text className="text-muted">
                Check if this is a half-day leave request
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Reason</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Explain why you need this leave"
                required
              />
            </Form.Group>

            <Alert variant="info" className="mb-0">
              <small>
                <strong>Note:</strong> Your request will be sent to your manager for approval.
                {formData.leaveType === 'SICK' && ' Medical certificate required after 2 days.'}
              </small>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowRequestModal(false)}>
              Cancel
            </Button>
            <Button variant="dark" type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Leave;
