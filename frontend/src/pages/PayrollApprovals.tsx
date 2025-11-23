import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, Table, Modal, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface PayrollRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalGross: number;
  totalNet: number;
  submittedAt?: string;
  submitter?: {
    fullName: string;
    email: string;
  };
  payslips: Array<{
    id: string;
    netSalary: number;
    employee: {
      employeeNumber: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

const PayrollApprovals: React.FC = () => {
  const [pendingPayrolls, setPendingPayrolls] = useState<PayrollRun[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRun | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingPayrolls();
  }, []);

  const fetchPendingPayrolls = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.get(`${API_URL}/payroll/approval/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingPayrolls(response.data.payrollRuns);
    } catch (error: any) {
      console.error('Error fetching pending payrolls:', error);
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.error || 'Failed to load pending payrolls' 
      });
    }
  };

  const handleApprove = async (payrollId: string) => {
    if (!window.confirm('Are you sure you want to approve this payroll?')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      await axios.post(
        `${API_URL}/payroll/approval/${payrollId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({ type: 'success', text: 'Payroll approved successfully!' });
      fetchPendingPayrolls();
    } catch (error: any) {
      console.error('Error approving payroll:', error);
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.error || 'Failed to approve payroll' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (payroll: PayrollRun) => {
    setSelectedPayroll(payroll);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedPayroll || !rejectionReason.trim()) {
      setMessage({ type: 'danger', text: 'Rejection reason is required' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      await axios.post(
        `${API_URL}/payroll/approval/${selectedPayroll.id}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage({ type: 'success', text: 'Payroll rejected' });
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedPayroll(null);
      fetchPendingPayrolls();
    } catch (error: any) {
      console.error('Error rejecting payroll:', error);
      setMessage({ 
        type: 'danger', 
        text: error.response?.data?.error || 'Failed to reject payroll' 
      });
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const canApprove = ['ADMIN', 'GENERAL_MANAGER', 'FINANCE_MANAGER'].includes(user?.role || '');

  if (!canApprove) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          You do not have permission to approve payroll. Only General Managers and Finance Managers can approve payroll runs.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Payroll Approvals</h2>
        <Badge bg="info" className="fs-6">
          {pendingPayrolls.length} Pending
        </Badge>
      </div>

      {message && (
        <Alert 
          variant={message.type} 
          dismissible 
          onClose={() => setMessage(null)}
          className="mb-4"
        >
          {message.text}
        </Alert>
      )}

      {pendingPayrolls.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-0">No payroll runs pending approval</p>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Submitted By</th>
                  <th>Submitted At</th>
                  <th>Employees</th>
                  <th>Total Gross</th>
                  <th>Total Net</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayrolls.map((payroll) => (
                  <tr key={payroll.id}>
                    <td>
                      <strong>{formatDate(payroll.periodStart)}</strong>
                      <br />
                      <small className="text-muted">to {formatDate(payroll.periodEnd)}</small>
                    </td>
                    <td>
                      {payroll.submitter?.fullName || 'N/A'}
                      <br />
                      <small className="text-muted">{payroll.submitter?.email}</small>
                    </td>
                    <td>
                      {payroll.submittedAt ? formatDate(payroll.submittedAt) : 'N/A'}
                    </td>
                    <td>{payroll.payslips.length}</td>
                    <td>{formatCurrency(payroll.totalGross)}</td>
                    <td>{formatCurrency(payroll.totalNet)}</td>
                    <td>
                      <Badge bg="warning">Pending</Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApprove(payroll.id)}
                          disabled={loading}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRejectClick(payroll)}
                          disabled={loading}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Payroll</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group>
              <Form.Label>Rejection Reason *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this payroll is being rejected..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowRejectModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRejectSubmit}
            disabled={loading || !rejectionReason.trim()}
          >
            {loading ? 'Rejecting...' : 'Reject Payroll'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PayrollApprovals;
