import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Table, Badge } from 'react-bootstrap';
import axios from 'axios';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenueByPlan: Array<{
    plan: string;
    amount: number;
    subscribers: number;
  }>;
  recentPayments: Array<{
    id: string;
    tenantName: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: string;
  }>;
}

const SuperAdminRevenue: React.FC = () => {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const token = localStorage.getItem('token');
      const statsResponse = await axios.get(`${API_URL}/super-admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Mock revenue data for now (can be extended with real endpoints)
      setRevenueData({
        totalRevenue: statsResponse.data.totalRevenue || 0,
        monthlyRevenue: statsResponse.data.totalRevenue || 0,
        yearlyRevenue: (statsResponse.data.totalRevenue || 0) * 12,
        revenueByPlan: [
          { plan: 'Starter', amount: 290, subscribers: 10 },
          { plan: 'Professional', amount: 790, subscribers: 10 },
          { plan: 'Enterprise', amount: 0, subscribers: 0 }
        ],
        recentPayments: []
      });
    } catch (error) {
      console.error('Error fetching revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading revenue data...</div>;
  }

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PAID: 'success',
      PENDING: 'warning',
      FAILED: 'danger',
      REFUNDED: 'secondary'
    };
    return statusMap[status] || 'secondary';
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Revenue Dashboard</h2>

      {/* Revenue Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted text-uppercase mb-2">Total Revenue</h6>
              <h3 className="mb-0">${revenueData?.totalRevenue.toFixed(2)}</h3>
              <small className="text-muted">All time</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted text-uppercase mb-2">Monthly Revenue</h6>
              <h3 className="mb-0">${revenueData?.monthlyRevenue.toFixed(2)}</h3>
              <small className="text-success">Current month</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm">
            <Card.Body>
              <h6 className="text-muted text-uppercase mb-2">Projected Yearly</h6>
              <h3 className="mb-0">${revenueData?.yearlyRevenue.toFixed(2)}</h3>
              <small className="text-muted">Based on current rate</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Revenue by Plan */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-dark text-white">
          <h5 className="mb-0">Revenue by Plan</h5>
        </Card.Header>
        <Card.Body>
          <Table hover>
            <thead>
              <tr>
                <th>Plan</th>
                <th className="text-end">Subscribers</th>
                <th className="text-end">Monthly Revenue</th>
                <th className="text-end">Yearly Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenueData?.revenueByPlan.map((plan) => (
                <tr key={plan.plan}>
                  <td><strong>{plan.plan}</strong></td>
                  <td className="text-end">{plan.subscribers}</td>
                  <td className="text-end">${plan.amount.toFixed(2)}</td>
                  <td className="text-end">${(plan.amount * 12).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="table-secondary">
                <td><strong>Total</strong></td>
                <td className="text-end">
                  <strong>
                    {revenueData?.revenueByPlan.reduce((sum, p) => sum + p.subscribers, 0)}
                  </strong>
                </td>
                <td className="text-end">
                  <strong>
                    ${revenueData?.revenueByPlan.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                  </strong>
                </td>
                <td className="text-end">
                  <strong>
                    ${revenueData?.revenueByPlan.reduce((sum, p) => sum + (p.amount * 12), 0).toFixed(2)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Recent Payments */}
      <Card className="shadow-sm">
        <Card.Header className="bg-dark text-white">
          <h5 className="mb-0">Recent Payments</h5>
        </Card.Header>
        <Card.Body>
          {revenueData?.recentPayments.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No payment records yet</p>
              <small className="text-muted">Payments will appear here once tenants start subscribing</small>
            </div>
          ) : (
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Company</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {revenueData?.recentPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{new Date(payment.paidAt).toLocaleDateString()}</td>
                    <td>{payment.tenantName}</td>
                    <td className="font-weight-bold">${payment.amount.toFixed(2)}</td>
                    <td>{payment.currency}</td>
                    <td>
                      <Badge bg={getStatusBadge(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SuperAdminRevenue;
