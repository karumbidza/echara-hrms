import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Alert, Table } from 'react-bootstrap';
import axios from 'axios';

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  deduction: number;
}

interface PlatformSettings {
  id: string;
  taxYear: number;
  taxBrackets: TaxBracket[];
  aidsLevyRate: number;
  nssaEmployeeRate: number;
  nssaEmployerRate: number;
  nssaLowerLimit: number;
  nssaUpperLimit: number;
  minimumWage: number;
  updatedAt: string;
}

const PlatformSettings: React.FC = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/platform/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data.settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/platform/settings`,
        settings,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: 'Settings updated successfully!' });
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateTaxBracket = (index: number, field: keyof TaxBracket, value: number) => {
    if (!settings) return;
    const newBrackets = [...settings.taxBrackets];
    newBrackets[index] = { ...newBrackets[index], [field]: value };
    setSettings({ ...settings, taxBrackets: newBrackets });
  };

  if (loading) return <div className="text-center mt-5">Loading settings...</div>;

  return (
    <Container className="py-4">
      <h2 className="mb-4">Platform Settings</h2>
      <p className="text-muted mb-4">
        Manage Zimbabwe ZIMRA tax tables and NSSA contribution rates. These are platform-wide defaults.
      </p>

      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'danger'} dismissible onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Tax Settings */}
        <Card className="mb-4">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">ZIMRA Tax Settings</h5>
          </Card.Header>
          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Tax Year</Form.Label>
                  <Form.Control
                    type="number"
                    value={settings?.taxYear || 2025}
                    onChange={(e) => setSettings(settings ? { ...settings, taxYear: parseInt(e.target.value) } : null)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>AIDS Levy Rate (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={settings?.aidsLevyRate || 3.0}
                    onChange={(e) => setSettings(settings ? { ...settings, aidsLevyRate: parseFloat(e.target.value) } : null)}
                  />
                  <Form.Text className="text-muted">Percentage of PAYE (usually 3%)</Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <h6 className="mt-4 mb-3">Tax Brackets (Annual)</h6>
            <Table bordered hover size="sm">
              <thead>
                <tr>
                  <th>From (USD)</th>
                  <th>To (USD)</th>
                  <th>Rate (%)</th>
                  <th>Deduction (USD)</th>
                </tr>
              </thead>
              <tbody>
                {settings?.taxBrackets.map((bracket, index) => (
                  <tr key={index}>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={bracket.min}
                        onChange={(e) => updateTaxBracket(index, 'min', parseFloat(e.target.value))}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={bracket.max}
                        onChange={(e) => updateTaxBracket(index, 'max', parseFloat(e.target.value))}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        step="0.1"
                        value={bracket.rate}
                        onChange={(e) => updateTaxBracket(index, 'rate', parseFloat(e.target.value))}
                      />
                    </td>
                    <td>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={bracket.deduction}
                        onChange={(e) => updateTaxBracket(index, 'deduction', parseFloat(e.target.value))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>

        {/* NSSA Settings */}
        <Card className="mb-4">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">NSSA Contribution Rates</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employee Rate (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={settings?.nssaEmployeeRate || 3.0}
                    onChange={(e) => setSettings(settings ? { ...settings, nssaEmployeeRate: parseFloat(e.target.value) } : null)}
                  />
                  <Form.Text className="text-muted">Percentage of gross salary (usually 3%)</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employer Rate (%)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.1"
                    value={settings?.nssaEmployerRate || 3.5}
                    onChange={(e) => setSettings(settings ? { ...settings, nssaEmployerRate: parseFloat(e.target.value) } : null)}
                  />
                  <Form.Text className="text-muted">Percentage of gross salary (usually 3.5%)</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lower Limit (USD)</Form.Label>
                  <Form.Control
                    type="number"
                    value={settings?.nssaLowerLimit || 0}
                    onChange={(e) => setSettings(settings ? { ...settings, nssaLowerLimit: parseFloat(e.target.value) } : null)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Upper Limit (USD)</Form.Label>
                  <Form.Control
                    type="number"
                    value={settings?.nssaUpperLimit || 1000}
                    onChange={(e) => setSettings(settings ? { ...settings, nssaUpperLimit: parseFloat(e.target.value) } : null)}
                  />
                  <Form.Text className="text-muted">Maximum monthly contribution cap</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Other Settings */}
        <Card className="mb-4">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">Other Platform Settings</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Label>Minimum Wage (USD/month)</Form.Label>
              <Form.Control
                type="number"
                value={settings?.minimumWage || 100}
                onChange={(e) => setSettings(settings ? { ...settings, minimumWage: parseFloat(e.target.value) } : null)}
              />
            </Form.Group>
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => fetchSettings()}>
            Reset
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </Form>

      {settings && (
        <Alert variant="info" className="mt-4">
          <small>Last updated: {new Date(settings.updatedAt).toLocaleString()}</small>
        </Alert>
      )}
    </Container>
  );
};

export default PlatformSettings;
