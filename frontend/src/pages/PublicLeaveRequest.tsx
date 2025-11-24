import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import axios from 'axios';

interface Employee {
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
  token: string;
  status: string;
  employee: Employee;
}

const PublicLeaveRequest: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [leaveRequest, setLeaveRequest] = useState<LeaveRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'info'; text: string } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: 'ANNUAL',
    startDate: '',
    endDate: '',
    halfDay: false,
    reason: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchLeaveRequest();
  }, [token]);

  const fetchLeaveRequest = async () => {
    try {
      const response = await axios.get(`${API_URL}/leave/request/${token}`);
      setLeaveRequest(response.data.leaveRequest);
    } catch (error: any) {
      if (error.response?.status === 410) {
        setMessage({
          type: 'danger',
          text: 'This leave request link has expired. Please contact your HR department for a new link.'
        });
      } else if (error.response?.status === 400) {
        setMessage({
          type: 'info',
          text: 'This leave request has already been submitted. You will be notified via email once it\'s reviewed.'
        });
        setSubmitted(true);
      } else {
        setMessage({
          type: 'danger',
          text: 'Invalid leave request link. Please contact your HR department.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      await axios.post(`${API_URL}/leave/request/${token}/submit`, formData);
      
      setMessage({
        type: 'success',
        text: 'Your leave request has been submitted successfully! You will receive an email notification once it\'s reviewed by HR.'
      });
      setSubmitted(true);
      
      // Clear form
      setFormData({
        leaveType: 'ANNUAL',
        startDate: '',
        endDate: '',
        halfDay: false,
        reason: ''
      });
    } catch (error: any) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.error || 'Failed to submit leave request. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading leave request form...</p>
        </div>
      </Container>
    );
  }

  if (!leaveRequest || submitted) {
    return (
      <Container className="mt-5">
        <Card className="shadow-sm">
          <Card.Body className="text-center p-5">
            {message && (
              <Alert variant={message.type} className="mb-4">
                {message.text}
              </Alert>
            )}
            {submitted && (
              <>
                <h2 className="text-success mb-3">✓ Leave Request Submitted</h2>
                <p className="text-muted">
                  Your HR department will review your request and send you an email notification.
                </p>
                <p className="text-muted">
                  <small>You can close this page now.</small>
                </p>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-5 mb-5" style={{ maxWidth: '700px' }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="mb-2">🏢 ECHARA HRMS</h1>
        <h4 className="text-muted">Leave Request Form</h4>
      </div>

      {message && (
        <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Employee Info Card */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Header className="bg-dark text-white">
          <h5 className="mb-0">Employee Information</h5>
        </Card.Header>
        <Card.Body>
          <div className="row">
            <div className="col-md-6 mb-2">
              <strong>Name:</strong> {leaveRequest.employee.firstName} {leaveRequest.employee.lastName}
            </div>
            <div className="col-md-6 mb-2">
              <strong>Employee Number:</strong> {leaveRequest.employee.employeeNumber}
            </div>
            <div className="col-md-6 mb-2">
              <strong>Email:</strong> {leaveRequest.employee.email}
            </div>
            {leaveRequest.employee.department && (
              <div className="col-md-6 mb-2">
                <strong>Department:</strong> {leaveRequest.employee.department.name}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* Leave Request Form */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Leave Request Details</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Leave Type *</Form.Label>
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
                {formData.leaveType === 'SICK' && '⚠️ Medical certificate required for more than 2 days'}
                {formData.leaveType === 'MATERNITY' && 'ℹ️ 98 days (14 weeks) maternity leave'}
                {formData.leaveType === 'PATERNITY' && 'ℹ️ 7 days paternity leave'}
              </Form.Text>
            </Form.Group>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Start Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>End Date *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
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
                Check this if you're requesting a half-day leave
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Reason for Leave *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please explain why you need this leave..."
                required
              />
              <Form.Text className="text-muted">
                Provide a clear reason for your leave request
              </Form.Text>
            </Form.Group>

            <Alert variant="info" className="mb-4">
              <small>
                <strong>📝 Note:</strong> By submitting this form, you confirm that all information is accurate.
                Your HR department will review your request and notify you via email.
                {formData.leaveType === 'SICK' && ' Remember to submit a medical certificate if you\'re taking more than 2 days.'}
              </small>
            </Alert>

            <div className="d-grid gap-2">
              <Button 
                variant="dark" 
                size="lg" 
                type="submit" 
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Leave Request'
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Footer */}
      <div className="text-center mt-4">
        <small className="text-muted">
          Having trouble? Contact your HR department<br />
          ECHARA HRMS - Human Resource Management System
        </small>
      </div>
    </Container>
  );
};

export default PublicLeaveRequest;
