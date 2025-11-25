import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Tabs, Tab, Table, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  nationalId?: string;
  dateOfBirth?: string;
  hireDate?: string;
  email?: string;
  phone?: string;
  address?: string;
  employmentType: string;
  jobTitle: string;
  payFrequency: string;
  basicSalary: number;
  currency: string;
  contractCurrency: string;
  bankName?: string;
  bankAccount?: string;
  nssaNumber?: string;
  defaultHousingAllowance: number;
  defaultTransportAllowance: number;
  defaultMealAllowance: number;
  defaultOtherAllowances: number;
  defaultPensionContribution: number;
  defaultMedicalAid: number;
  defaultMonthlyLeaveRate: number;
  ytdGross: number;
  ytdTaxable: number;
  ytdPaye: number;
  ytdNssa: number;
  ytdNetPay: number;
  ytdYear?: number;
  photoPath?: string;
  nationalIdPath?: string;
  driversLicensePath?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
    code?: string;
  };
}

interface Payslip {
  id: string;
  periodStart: string;
  periodEnd: string;
  payDate: string;
  grossSalary: number;
  basicSalary: number;
  allowances: number;
  taxableIncome: number;
  paye: number;
  aidsLevy: number;
  nssaEmployee: number;
  totalDeductions: number;
  netSalary: number;
  currency: string;
  ytdGross: number;
  ytdPaye: number;
  ytdNssa: number;
  ytdNetPay: number;
  payrollRun?: {
    id: string;
    status: string;
  };
}

interface LeaveBalance {
  id: string;
  year: number;
  annualLeaveEntitlement: number;
  leaveUsed: number;
  leaveBalance: number;
  sickLeaveUsed: number;
  sickLeaveBalance: number;
  maternityLeaveUsed: number;
  paternityLeaveUsed: number;
  updatedAt: string;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason?: string;
  status: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

interface Document {
  name: string;
  type: string;
  path?: string;
  uploaded: boolean;
}

const ViewEmployee: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch employee details
      const empResponse = await axios.get(`${API_URL}/employees/${id}`, { headers });
      setEmployee(empResponse.data.employee);

      // Fetch payslips
      try {
        const payslipsResponse = await axios.get(`${API_URL}/payroll/employees/${id}/payslips`, { headers });
        setPayslips(payslipsResponse.data.payslips || []);
      } catch (err) {
        console.log('No payslips found or endpoint not available');
      }

      // Fetch leave balance
      try {
        const leaveBalanceResponse = await axios.get(`${API_URL}/leave/balance/${id}`, { headers });
        setLeaveBalance(leaveBalanceResponse.data.leaveBalance || null);
      } catch (err) {
        console.log('No leave balance found');
      }

      // Fetch leave requests
      try {
        const leaveRequestsResponse = await axios.get(`${API_URL}/leave/employee/${id}/requests`, { headers });
        setLeaveRequests(leaveRequestsResponse.data.leaveRequests || []);
      } catch (err) {
        console.log('No leave requests found');
      }

      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch employee data');
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-ZW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      ACTIVE: 'success',
      INACTIVE: 'danger',
      DRAFT: 'secondary',
      PENDING_REVIEW: 'warning',
      PENDING_APPROVAL: 'warning',
      APPROVED: 'success',
      PAID: 'primary',
      REJECTED: 'danger',
      CANCELLED: 'secondary',
    };
    return <Badge bg={statusMap[status] || 'secondary'}>{status.replace(/_/g, ' ')}</Badge>;
  };

  const documents: Document[] = employee ? [
    { name: 'Photo', type: 'photo', path: employee.photoPath, uploaded: !!employee.photoPath },
    { name: 'National ID', type: 'nationalId', path: employee.nationalIdPath, uploaded: !!employee.nationalIdPath },
    { name: 'Driver\'s License', type: 'driversLicense', path: employee.driversLicensePath, uploaded: !!employee.driversLicensePath },
  ] : [];

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading employee details...</p>
      </Container>
    );
  }

  if (error || !employee) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error || 'Employee not found'}</Alert>
        <Button variant="secondary" onClick={() => navigate('/employees')}>
          Back to Employees
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Button variant="outline-secondary" onClick={() => navigate('/employees')} className="me-3">
            ← Back
          </Button>
        </div>
        <div>
          <Button 
            variant="outline-primary" 
            className="me-2"
            onClick={() => navigate(`/employees/${employee.id}/edit`)}
          >
            Edit Employee
          </Button>
        </div>
      </div>

      {/* Employee Header Card */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={2} className="text-center">
              {employee.photoPath ? (
                <img 
                  src={employee.photoPath} 
                  alt={`${employee.firstName} ${employee.lastName}`}
                  className="rounded-circle"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
              ) : (
                <div 
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mx-auto"
                  style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}
                >
                  {employee.firstName[0]}{employee.lastName[0]}
                </div>
              )}
            </Col>
            <Col md={7}>
              <h2>{employee.firstName} {employee.lastName}</h2>
              <p className="text-muted mb-1">
                <strong>{employee.jobTitle}</strong> • {employee.department?.name || 'Unassigned'}
              </p>
              <p className="mb-1">
                Employee #: <strong className="text-monospace">{employee.employeeNumber}</strong>
              </p>
              <p className="mb-0">
                {employee.email && <span className="me-3">📧 {employee.email}</span>}
                {employee.phone && <span>📞 {employee.phone}</span>}
              </p>
            </Col>
            <Col md={3} className="text-end">
              <div className="mb-2">{getStatusBadge(employee.isActive ? 'ACTIVE' : 'INACTIVE')}</div>
              <div className="mb-1">
                <Badge bg="secondary">{employee.employmentType.replace(/_/g, ' ')}</Badge>
              </div>
              <div>
                <Badge bg="info">{employee.payFrequency}</Badge>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'overview')}
        className="mb-3"
      >
        {/* Overview Tab */}
        <Tab eventKey="overview" title="Overview">
          <Row>
            {/* Personal Information */}
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header className="bg-dark text-white">
                  <strong>Personal Information</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">Full Name:</Col>
                    <Col sm={7}><strong>{employee.firstName} {employee.lastName}</strong></Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">National ID:</Col>
                    <Col sm={7}>{employee.nationalId || 'N/A'}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">Date of Birth:</Col>
                    <Col sm={7}>{formatDate(employee.dateOfBirth)}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">Email:</Col>
                    <Col sm={7}>{employee.email || 'N/A'}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">Phone:</Col>
                    <Col sm={7}>{employee.phone || 'N/A'}</Col>
                  </Row>
                  <Row>
                    <Col sm={5} className="text-muted">Address:</Col>
                    <Col sm={7}>{employee.address || 'N/A'}</Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Employment Information */}
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header className="bg-dark text-white">
                  <strong>Employment Information</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">Employee Number:</Col>
                    <Col sm={7}><strong className="text-monospace">{employee.employeeNumber}</strong></Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">Job Title:</Col>
                    <Col sm={7}>{employee.jobTitle}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">Department:</Col>
                    <Col sm={7}>{employee.department?.name || 'Unassigned'}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">Employment Type:</Col>
                    <Col sm={7}>{employee.employmentType.replace(/_/g, ' ')}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">Hire Date:</Col>
                    <Col sm={7}>{formatDate(employee.hireDate)}</Col>
                  </Row>
                  <Row>
                    <Col sm={5} className="text-muted">Status:</Col>
                    <Col sm={7}>{getStatusBadge(employee.isActive ? 'ACTIVE' : 'INACTIVE')}</Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Salary & Compensation */}
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header className="bg-dark text-white">
                  <strong>Salary & Compensation</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted">Basic Salary:</Col>
                    <Col sm={6} className="text-end">
                      <strong>{formatCurrency(employee.basicSalary, employee.currency)}</strong>
                    </Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted">Pay Frequency:</Col>
                    <Col sm={6} className="text-end">{employee.payFrequency}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted">Display Currency:</Col>
                    <Col sm={6} className="text-end">{employee.currency}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted">Contract Currency:</Col>
                    <Col sm={6} className="text-end">{employee.contractCurrency}</Col>
                  </Row>
                  <hr />
                  <h6 className="mb-3">Monthly Allowances</h6>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted small">Housing:</Col>
                    <Col sm={6} className="text-end small">{formatCurrency(employee.defaultHousingAllowance, employee.currency)}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted small">Transport:</Col>
                    <Col sm={6} className="text-end small">{formatCurrency(employee.defaultTransportAllowance, employee.currency)}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted small">Meal:</Col>
                    <Col sm={6} className="text-end small">{formatCurrency(employee.defaultMealAllowance, employee.currency)}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted small">Other:</Col>
                    <Col sm={6} className="text-end small">{formatCurrency(employee.defaultOtherAllowances, employee.currency)}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted small">Monthly Leave Rate:</Col>
                    <Col sm={6} className="text-end small">{formatCurrency(employee.defaultMonthlyLeaveRate, employee.currency)}</Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* Banking & Deductions */}
            <Col md={6} className="mb-4">
              <Card>
                <Card.Header className="bg-dark text-white">
                  <strong>Banking & Deductions</strong>
                </Card.Header>
                <Card.Body>
                  <h6 className="mb-3">Banking Details</h6>
                  <Row className="mb-2">
                    <Col sm={5} className="text-muted">Bank Name:</Col>
                    <Col sm={7}>{employee.bankName || 'N/A'}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col sm={5} className="text-muted">Account Number:</Col>
                    <Col sm={7}>{employee.bankAccount ? '••••' + employee.bankAccount.slice(-4) : 'N/A'}</Col>
                  </Row>
                  <hr />
                  <h6 className="mb-3">Monthly Deductions</h6>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted small">Pension:</Col>
                    <Col sm={6} className="text-end small">{formatCurrency(employee.defaultPensionContribution, employee.currency)}</Col>
                  </Row>
                  <Row className="mb-2">
                    <Col sm={6} className="text-muted small">Medical Aid:</Col>
                    <Col sm={6} className="text-end small">{formatCurrency(employee.defaultMedicalAid, employee.currency)}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col sm={6} className="text-muted small">NSSA Number:</Col>
                    <Col sm={6} className="text-end small">{employee.nssaNumber || 'N/A'}</Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            {/* YTD Summary */}
            <Col md={12} className="mb-4">
              <Card>
                <Card.Header className="bg-dark text-white">
                  <strong>Year-to-Date Summary {employee.ytdYear ? `(${employee.ytdYear})` : ''}</strong>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={2} className="text-center mb-3">
                      <div className="text-muted small">Gross Pay</div>
                      <h5>{formatCurrency(employee.ytdGross, employee.currency)}</h5>
                    </Col>
                    <Col md={2} className="text-center mb-3">
                      <div className="text-muted small">Taxable Income</div>
                      <h5>{formatCurrency(employee.ytdTaxable, employee.currency)}</h5>
                    </Col>
                    <Col md={2} className="text-center mb-3">
                      <div className="text-muted small">PAYE</div>
                      <h5 className="text-danger">{formatCurrency(employee.ytdPaye, employee.currency)}</h5>
                    </Col>
                    <Col md={2} className="text-center mb-3">
                      <div className="text-muted small">NSSA</div>
                      <h5 className="text-danger">{formatCurrency(employee.ytdNssa, employee.currency)}</h5>
                    </Col>
                    <Col md={2} className="text-center mb-3">
                      <div className="text-muted small">Net Pay</div>
                      <h5 className="text-success">{formatCurrency(employee.ytdNetPay, employee.currency)}</h5>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Documents Tab */}
        <Tab eventKey="documents" title="Documents">
          <Card>
            <Card.Header className="bg-dark text-white">
              <strong>Employee Documents</strong>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.type}>
                      <td>{doc.name}</td>
                      <td>
                        {doc.uploaded ? (
                          <Badge bg="success">Uploaded</Badge>
                        ) : (
                          <Badge bg="warning">Not Uploaded</Badge>
                        )}
                      </td>
                      <td>
                        {doc.uploaded && doc.path ? (
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => window.open(doc.path, '_blank')}
                          >
                            View
                          </Button>
                        ) : (
                          <Button variant="outline-secondary" size="sm" disabled>
                            N/A
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {documents.filter(d => !d.uploaded).length > 0 && (
                <Alert variant="info" className="mt-3">
                  <strong>Note:</strong> Some documents are missing. Please upload them via the Edit Employee form.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Payroll History Tab */}
        <Tab eventKey="payroll" title="Payroll History">
          <Card>
            <Card.Header className="bg-dark text-white">
              <strong>Payroll History</strong>
            </Card.Header>
            <Card.Body>
              {payslips.length === 0 ? (
                <Alert variant="info">No payroll history available for this employee.</Alert>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Pay Date</th>
                      <th>Gross Salary</th>
                      <th>PAYE</th>
                      <th>NSSA</th>
                      <th>Total Deductions</th>
                      <th>Net Salary</th>
                      <th>Currency</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map((payslip) => (
                      <tr key={payslip.id}>
                        <td>
                          {formatDate(payslip.periodStart)} - {formatDate(payslip.periodEnd)}
                        </td>
                        <td>{formatDate(payslip.payDate)}</td>
                        <td>{formatCurrency(payslip.grossSalary, payslip.currency)}</td>
                        <td className="text-danger">{formatCurrency(payslip.paye, payslip.currency)}</td>
                        <td className="text-danger">{formatCurrency(payslip.nssaEmployee, payslip.currency)}</td>
                        <td className="text-danger">{formatCurrency(payslip.totalDeductions, payslip.currency)}</td>
                        <td className="text-success">
                          <strong>{formatCurrency(payslip.netSalary, payslip.currency)}</strong>
                        </td>
                        <td>{payslip.currency}</td>
                        <td>
                          {payslip.payrollRun ? getStatusBadge(payslip.payrollRun.status) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan={2}><strong>Year-to-Date Totals</strong></td>
                      <td><strong>{formatCurrency(employee.ytdGross, employee.currency)}</strong></td>
                      <td className="text-danger"><strong>{formatCurrency(employee.ytdPaye, employee.currency)}</strong></td>
                      <td className="text-danger"><strong>{formatCurrency(employee.ytdNssa, employee.currency)}</strong></td>
                      <td>-</td>
                      <td className="text-success"><strong>{formatCurrency(employee.ytdNetPay, employee.currency)}</strong></td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* Leave History Tab */}
        <Tab eventKey="leave" title="Leave History">
          <Row>
            {/* Leave Balance Card */}
            <Col md={12} className="mb-4">
              <Card>
                <Card.Header className="bg-dark text-white">
                  <strong>Current Leave Balance</strong>
                </Card.Header>
                <Card.Body>
                  {leaveBalance ? (
                    <Row>
                      <Col md={3} className="text-center mb-3">
                        <div className="text-muted small">Annual Leave</div>
                        <h4>{leaveBalance.leaveBalance.toFixed(1)} days</h4>
                        <small className="text-muted">
                          Used: {leaveBalance.leaveUsed.toFixed(1)} / {leaveBalance.annualLeaveEntitlement.toFixed(1)}
                        </small>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div className="text-muted small">Sick Leave</div>
                        <h4>{leaveBalance.sickLeaveBalance.toFixed(1)} days</h4>
                        <small className="text-muted">
                          Used: {leaveBalance.sickLeaveUsed.toFixed(1)}
                        </small>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div className="text-muted small">Maternity Leave</div>
                        <h4>{leaveBalance.maternityLeaveUsed.toFixed(1)} days</h4>
                        <small className="text-muted">Used this year</small>
                      </Col>
                      <Col md={3} className="text-center mb-3">
                        <div className="text-muted small">Paternity Leave</div>
                        <h4>{leaveBalance.paternityLeaveUsed.toFixed(1)} days</h4>
                        <small className="text-muted">Used this year</small>
                      </Col>
                    </Row>
                  ) : (
                    <Alert variant="warning">
                      No leave balance found for this employee. A leave balance should be created automatically.
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Leave Requests History */}
            <Col md={12}>
              <Card>
                <Card.Header className="bg-dark text-white">
                  <strong>Leave Request History</strong>
                </Card.Header>
                <Card.Body>
                  {leaveRequests.length === 0 ? (
                    <Alert variant="info">No leave requests submitted yet.</Alert>
                  ) : (
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>Leave Type</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Days</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th>Submitted</th>
                          <th>Reviewed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveRequests.map((request) => (
                          <tr key={request.id}>
                            <td>
                              <Badge bg="info">{request.leaveType.replace(/_/g, ' ')}</Badge>
                            </td>
                            <td>{formatDate(request.startDate)}</td>
                            <td>{formatDate(request.endDate)}</td>
                            <td className="text-center">
                              <strong>{request.daysRequested}</strong>
                            </td>
                            <td>{request.reason || 'N/A'}</td>
                            <td>{getStatusBadge(request.status)}</td>
                            <td>{formatDate(request.createdAt)}</td>
                            <td>{request.reviewedAt ? formatDate(request.reviewedAt) : 'Pending'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default ViewEmployee;
