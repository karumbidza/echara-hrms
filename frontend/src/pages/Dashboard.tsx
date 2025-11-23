import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Welcome to ECHARA HRMS</h2>
          <p className="text-muted">Human Resource Management System</p>
        </Col>
      </Row>

      <Row>
        <Col md={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Employees</Card.Title>
              <h2 className="display-4">0</h2>
              <Button variant="primary" size="sm" onClick={() => navigate('/employees')}>
                Manage Employees
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Departments</Card.Title>
              <h2 className="display-4">0</h2>
              <Button variant="primary" size="sm" onClick={() => navigate('/departments')}>
                Manage Departments
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Payroll Runs</Card.Title>
              <h2 className="display-4">0</h2>
              <Button variant="primary" size="sm">
                View Payroll
              </Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3} className="mb-3">
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Timesheets</Card.Title>
              <h2 className="display-4">0</h2>
              <Button variant="primary" size="sm">
                View Timesheets
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6} className="mb-3">
          <Card>
            <Card.Header>
              <strong>Recent Activities</strong>
            </Card.Header>
            <Card.Body>
              <p className="text-muted">No recent activities</p>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} className="mb-3">
          <Card>
            <Card.Header>
              <strong>Quick Actions</strong>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" onClick={() => navigate('/employees/new')}>Add New Employee</Button>
                <Button variant="outline-primary" onClick={() => navigate('/departments')}>Create Department</Button>
                <Button variant="outline-primary">Run Payroll</Button>
                <Button variant="outline-primary">Generate Report</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
