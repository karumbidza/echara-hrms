import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Table, Badge, Button } from 'react-bootstrap';
import axios from 'axios';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceUSD: number;
  priceZWL: number;
  maxEmployees: number;
  maxUsers: number;
  features: string[];
  isActive: boolean;
  _count: {
    subscriptions: number;
  };
}

const SuperAdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/super-admin/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading plans...</div>;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Subscription Plans</h2>
        <Button variant="primary">Add New Plan</Button>
      </div>

      <Row>
        {plans.map((plan) => (
          <Col md={4} key={plan.id} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-dark text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h4 className="mb-0">{plan.name}</h4>
                  {plan.isActive ? (
                    <Badge bg="success">Active</Badge>
                  ) : (
                    <Badge bg="secondary">Inactive</Badge>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                <p className="text-muted">{plan.description}</p>
                
                <div className="mb-3">
                  <h3 className="text-primary">
                    ${plan.priceUSD}
                    <small className="text-muted">/month</small>
                  </h3>
                  <p className="text-muted mb-0">
                    ZWL {plan.priceZWL.toLocaleString()}/month
                  </p>
                </div>

                <hr />

                <div className="mb-3">
                  <strong>Limits:</strong>
                  <ul className="list-unstyled mt-2">
                    <li>👥 {plan.maxEmployees === 999999 ? 'Unlimited' : plan.maxEmployees} employees</li>
                    <li>🔑 {plan.maxUsers === 999999 ? 'Unlimited' : plan.maxUsers} users</li>
                  </ul>
                </div>

                <div className="mb-3">
                  <strong>Features:</strong>
                  <ul className="mt-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} style={{ fontSize: '0.9rem' }}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <hr />

                <div className="d-flex justify-content-between align-items-center">
                  <Badge bg="info">{plan._count.subscriptions} subscribers</Badge>
                  <Button variant="outline-primary" size="sm">Edit</Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {plans.length === 0 && (
        <Card>
          <Card.Body className="text-center py-5">
            <h5>No plans found</h5>
            <p className="text-muted">Create your first subscription plan</p>
            <Button variant="primary">Create Plan</Button>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default SuperAdminPlans;
