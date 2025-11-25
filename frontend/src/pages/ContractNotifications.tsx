import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Modal, Form, Alert, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface Employee {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  jobTitle: string;
  contractType?: string;
  contractEndDate?: string;
  department?: {
    name: string;
  };
}

interface ContractNotification {
  id: string;
  contractEndDate: string;
  notificationDate: string;
  daysBeforeExpiry: number;
  sent: boolean;
  acknowledged: boolean;
  actionTaken?: string;
  actionNotes?: string;
  employee: Employee;
}

interface ContractSummary {
  expiringInNext30Days: number;
  pendingNotifications: number;
  totalFixedTerm: number;
  totalOnProbation: number;
}

const ContractNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<ContractNotification[]>([]);
  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<ContractNotification | null>(null);
  const [renewalDecision, setRenewalDecision] = useState<'RENEW' | 'NOT_RENEW'>('RENEW');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [notificationsRes, summaryRes] = await Promise.all([
        axios.get(`${API_URL}/contracts/notifications`, { headers }),
        axios.get(`${API_URL}/contracts/summary`, { headers })
      ]);

      setNotifications(notificationsRes.data.notifications);
      setSummary(summaryRes.data.summary);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch contract data');
      setLoading(false);
    }
  };

  const handleCheckExpiring = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/contracts/check-expiring`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(response.data.message);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to check expiring contracts');
      setLoading(false);
    }
  };

  const handleAcknowledge = (notification: ContractNotification) => {
    setSelectedNotification(notification);
    setRenewalDecision('RENEW');
    setNotes('');
    setShowModal(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedNotification) return;

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `${API_URL}/contracts/notifications/${selectedNotification.id}/acknowledge`,
        { renewalDecision, notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(`Decision recorded for ${selectedNotification.employee.firstName} ${selectedNotification.employee.lastName}`);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to acknowledge notification');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getUrgencyBadge = (days: number) => {
    if (days < 0) return <Badge bg="danger">Expired</Badge>;
    if (days <= 7) return <Badge bg="danger">Critical - {days} days</Badge>;
    if (days <= 14) return <Badge bg="warning">Urgent - {days} days</Badge>;
    return <Badge bg="info">{days} days</Badge>;
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading contract notifications...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Contract Management</h2>
        <Button variant="dark" onClick={handleCheckExpiring}>
          🔍 Check Expiring Contracts
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Summary Cards */}
      {summary && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h2 className="text-danger">{summary.expiringInNext30Days}</h2>
                <small className="text-muted">Expiring in 30 Days</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h2 className="text-warning">{summary.pendingNotifications}</h2>
                <small className="text-muted">Pending Actions</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h2 className="text-info">{summary.totalFixedTerm}</h2>
                <small className="text-muted">Fixed Term Contracts</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h2 className="text-secondary">{summary.totalOnProbation}</h2>
                <small className="text-muted">On Probation</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Notifications Table */}
      <Card>
        <Card.Header className="bg-dark text-white">
          <strong>Pending Contract Expiry Notifications</strong>
        </Card.Header>
        <Card.Body>
          {notifications.length === 0 ? (
            <Alert variant="success">
              ✅ No pending contract notifications. All contracts are up to date!
            </Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Contract End Date</th>
                  <th>Days Remaining</th>
                  <th>Notification Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notification) => {
                  const daysRemaining = getDaysRemaining(notification.contractEndDate);
                  return (
                    <tr key={notification.id} className={daysRemaining < 0 ? 'table-danger' : daysRemaining <= 7 ? 'table-warning' : ''}>
                      <td>
                        <strong>{notification.employee.firstName} {notification.employee.lastName}</strong>
                        <br />
                        <small className="text-muted">{notification.employee.employeeNumber}</small>
                        {notification.employee.email && (
                          <>
                            <br />
                            <small className="text-muted">📧 {notification.employee.email}</small>
                          </>
                        )}
                      </td>
                      <td>{notification.employee.jobTitle}</td>
                      <td>{notification.employee.department?.name || 'N/A'}</td>
                      <td>
                        <strong>{formatDate(notification.contractEndDate)}</strong>
                      </td>
                      <td>
                        {getUrgencyBadge(daysRemaining)}
                      </td>
                      <td>{formatDate(notification.notificationDate)}</td>
                      <td>
                        <Button
                          variant={daysRemaining < 0 ? 'danger' : 'primary'}
                          size="sm"
                          onClick={() => handleAcknowledge(notification)}
                        >
                          Make Decision
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Decision Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Contract Renewal Decision</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNotification && (
            <>
              <Alert variant="info">
                <strong>Employee:</strong> {selectedNotification.employee.firstName} {selectedNotification.employee.lastName}
                <br />
                <strong>Contract Ends:</strong> {formatDate(selectedNotification.contractEndDate)}
                <br />
                <strong>Days Remaining:</strong> {getDaysRemaining(selectedNotification.contractEndDate)}
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Renewal Decision *</Form.Label>
                <div>
                  <Form.Check
                    type="radio"
                    label="✅ Renew Contract"
                    name="renewalDecision"
                    value="RENEW"
                    checked={renewalDecision === 'RENEW'}
                    onChange={(e) => setRenewalDecision('RENEW')}
                    className="mb-2"
                  />
                  <Form.Check
                    type="radio"
                    label="❌ Do Not Renew"
                    name="renewalDecision"
                    value="NOT_RENEW"
                    checked={renewalDecision === 'NOT_RENEW'}
                    onChange={(e) => setRenewalDecision('NOT_RENEW')}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this decision..."
                />
              </Form.Group>

              {renewalDecision === 'NOT_RENEW' && (
                <Alert variant="warning">
                  ⚠️ This employee will be notified that their contract will not be renewed. 
                  Make sure to follow proper termination procedures and notice periods.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            variant={renewalDecision === 'RENEW' ? 'success' : 'danger'} 
            onClick={handleSubmitDecision}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Confirm Decision'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ContractNotifications;
