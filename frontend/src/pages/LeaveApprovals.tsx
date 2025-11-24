import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Badge, Table, Modal, Form } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

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
  employee: {
    employeeNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: {
      name: string;
    };
  };
  reviewer?: {
    fullName: string;
    email: string;
  };
  createdAt: string;
  reviewedAt?: string;
}

const LeaveApprovals: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/leave/requests?status=PENDING`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data.leaveRequests);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      setMessage({
        type: 'danger',
        text: 'Failed to load pending leave requests'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to approve this leave request?')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/leave/requests/${requestId}/approve`,
        { reviewNotes: 'Approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Leave request approved successfully' });
      fetchPendingRequests();
    } catch (error: any) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.error || 'Failed to approve leave request'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setReviewNotes('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedRequest) return;

    if (!reviewNotes.trim()) {
      setMessage({ type: 'danger', text: 'Please provide a reason for rejection' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/leave/requests/${selectedRequest.id}/reject`,
        { reviewNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: 'Leave request rejected' });
      setShowRejectModal(false);
      setSelectedRequest(null);
      setReviewNotes('');
      fetchPendingRequests();
    } catch (error: any) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.error || 'Failed to reject leave request'
      });
    } finally {
      setLoading(false);
    }
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

  const canApprove = ['ADMIN', 'MANAGER'].includes(user?.role || '');

  if (!canApprove) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          You do not have permission to approve leave requests. Only admins and managers can approve leave.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📋 Leave Approvals</h2>
        <Badge bg="info" className="fs-6">
          {requests.length} Pending
        </Badge>
      </div>

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          {loading && requests.length === 0 ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : requests.length > 0 ? (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>
                        {request.employee.firstName} {request.employee.lastName}
                      </strong>
                      <br />
                      <small className="text-muted">{request.employee.employeeNumber}</small>
                    </td>
                    <td>
                      {request.employee.department?.name || (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td>
                      <Badge bg="secondary">{getLeaveTypeLabel(request.leaveType)}</Badge>
                    </td>
                    <td>
                      <small>
                        {formatDate(request.startDate)}
                        <br />
                        to {formatDate(request.endDate)}
                      </small>
                    </td>
                    <td>
                      <strong>{Number(request.totalDays).toFixed(1)}</strong>
                      {request.halfDay && (
                        <>
                          <br />
                          <small className="text-muted">(Half Day)</small>
                        </>
                      )}
                    </td>
                    <td>
                      <small>{request.reason}</small>
                    </td>
                    <td>
                      <small className="text-muted">{formatDate(request.createdAt)}</small>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApprove(request.id)}
                          disabled={loading}
                        >
                          ✓ Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRejectClick(request)}
                          disabled={loading}
                        >
                          ✗ Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center py-5 text-muted">
              <h4>✅ All Caught Up!</h4>
              <p>No pending leave requests at the moment.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Reject Modal */}
      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <>
              <Alert variant="warning" className="mb-3">
                <strong>Employee:</strong> {selectedRequest.employee.firstName} {selectedRequest.employee.lastName}
                <br />
                <strong>Leave Type:</strong> {getLeaveTypeLabel(selectedRequest.leaveType)}
                <br />
                <strong>Duration:</strong> {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)} ({Number(selectedRequest.totalDays).toFixed(1)} days)
              </Alert>

              <Form.Group>
                <Form.Label>Reason for Rejection *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide a clear reason why this leave is being rejected..."
                  required
                />
                <Form.Text className="text-muted">
                  This will be visible to the employee.
                </Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleRejectSubmit}
            disabled={loading || !reviewNotes.trim()}
          >
            {loading ? 'Rejecting...' : 'Reject Leave'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LeaveApprovals;
