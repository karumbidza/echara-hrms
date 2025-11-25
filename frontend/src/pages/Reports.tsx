import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Spinner, Alert, Tabs, Tab, Badge } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface LeaveLiabilityData {
  reportName: string;
  generatedAt: string;
  summary: Array<{
    currency: string;
    totalLiability: number;
    totalEmployees: number;
    totalDaysOwed: number;
  }>;
  breakdown: Array<{
    employeeNumber: string;
    employeeName: string;
    department: string;
    basicSalary: number;
    currency: string;
    dailyRate: number;
    accruedDays: number;
    usedDays: number;
    remainingDays: number;
    liabilityAmount: number;
  }>;
}

interface StatutoryRemittanceData {
  reportName: string;
  generatedAt: string;
  period: {
    month: number;
    year: number;
    monthName: string;
  };
  nssaConfiguration: {
    employeeRate: string;
    employerRate: string;
    maxCap: number | null;
    currency: string;
  };
  grandTotal: {
    totalGrossPay: number;
    totalNSSAEmployee: number;
    totalNSSAEmployer: number;
    totalNSSA: number;
    totalPAYE: number;
  };
  departmentBreakdown: Array<{
    department: string;
    employees: Array<any>;
    totalGrossPay: number;
    totalNSSAEmployee: number;
    totalNSSAEmployer: number;
    totalNSSA: number;
    totalPAYE: number;
    currency: string;
  }>;
}

interface DualCurrencyData {
  reportName: string;
  generatedAt: string;
  period: {
    month: number;
    year: number;
    monthName: string;
  };
  exchangeRates: Array<{
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: string;
    source: string;
  }>;
  currencyBreakdown: Array<{
    currency: string;
    employees: number;
    totalGross: number;
    totalNet: number;
    departments: Array<{
      department: string;
      employees: number;
      totalGross: number;
      totalNet: number;
    }>;
  }>;
  combinedUSDEquivalent: number;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('leave-liability');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Report data states
  const [leaveLiability, setLeaveLiability] = useState<LeaveLiabilityData | null>(null);
  const [statutoryRemittance, setStatutoryRemittance] = useState<StatutoryRemittanceData | null>(null);
  const [dualCurrency, setDualCurrency] = useState<DualCurrencyData | null>(null);

  // Filter states
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [departmentId, setDepartmentId] = useState('');

  const [expandedDepartment, setExpandedDepartment] = useState<string | null>(null);

  const fetchLeaveLiabilityReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports/leave-liability`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { departmentId: departmentId || undefined }
      });
      setLeaveLiability(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch leave liability report');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatutoryRemittanceReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports/statutory-remittance`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year, departmentId: departmentId || undefined }
      });
      setStatutoryRemittance(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch statutory remittance report');
    } finally {
      setLoading(false);
    }
  };

  const fetchDualCurrencyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/reports/dual-currency`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year }
      });
      setDualCurrency(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch dual currency report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    switch (activeTab) {
      case 'leave-liability':
        fetchLeaveLiabilityReport();
        break;
      case 'statutory-remittance':
        fetchStatutoryRemittanceReport();
        break;
      case 'dual-currency':
        fetchDualCurrencyReport();
        break;
    }
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    alert(`Export to ${format.toUpperCase()} - Coming soon!`);
  };

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>📊 Reports & Analytics</h2>
          <p className="text-muted">Generate compliance and financial reports</p>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'leave-liability')} className="mb-3">
        {/* LEAVE LIABILITY TAB */}
        <Tab eventKey="leave-liability" title="Leave Liability">
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Leave Liability Report</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Department (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Department ID"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="d-flex align-items-end">
                  <Button variant="primary" onClick={handleGenerateReport} disabled={loading} className="me-2">
                    {loading ? <Spinner animation="border" size="sm" /> : 'Generate Report'}
                  </Button>
                  {leaveLiability && (
                    <>
                      <Button variant="outline-success" size="sm" onClick={() => handleExport('excel')} className="me-2">
                        📊 Excel
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleExport('pdf')}>
                        📄 PDF
                      </Button>
                    </>
                  )}
                </Col>
              </Row>

              {leaveLiability && (
                <>
                  <Alert variant="info">
                    <strong>Generated:</strong> {new Date(leaveLiability.generatedAt).toLocaleString()}
                  </Alert>

                  {/* Summary Cards */}
                  <Row className="mb-4">
                    {leaveLiability.summary.map((sum, idx) => (
                      <Col md={4} key={idx}>
                        <Card className="text-center">
                          <Card.Body>
                            <h6 className="text-muted">{sum.currency} Liability</h6>
                            <h3 className="text-primary">{sum.currency} {sum.totalLiability.toLocaleString()}</h3>
                            <p className="mb-0 small">
                              {sum.totalEmployees} employees · {sum.totalDaysOwed.toFixed(1)} days owed
                            </p>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {/* Employee Breakdown */}
                  <h5>Employee Breakdown</h5>
                  <Table striped bordered hover responsive size="sm">
                    <thead>
                      <tr>
                        <th>Emp #</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Basic Salary</th>
                        <th>Daily Rate</th>
                        <th>Accrued</th>
                        <th>Used</th>
                        <th>Remaining</th>
                        <th>Liability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveLiability.breakdown.map((emp, idx) => (
                        <tr key={idx}>
                          <td>{emp.employeeNumber}</td>
                          <td>{emp.employeeName}</td>
                          <td>{emp.department}</td>
                          <td>{emp.currency} {emp.basicSalary.toLocaleString()}</td>
                          <td>{emp.currency} {emp.dailyRate}</td>
                          <td>{emp.accruedDays}</td>
                          <td>{emp.usedDays}</td>
                          <td><Badge bg="warning">{emp.remainingDays}</Badge></td>
                          <td><strong>{emp.currency} {emp.liabilityAmount.toLocaleString()}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* STATUTORY REMITTANCE TAB */}
        <Tab eventKey="statutory-remittance" title="NSSA & PAYE Remittance">
          <Card className="mb-4">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">NSSA & PAYE Statutory Remittance Report</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Month</Form.Label>
                    <Form.Select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Year</Form.Label>
                    <Form.Control
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="d-flex align-items-end">
                  <Button variant="success" onClick={handleGenerateReport} disabled={loading} className="me-2">
                    {loading ? <Spinner animation="border" size="sm" /> : 'Generate Report'}
                  </Button>
                  {statutoryRemittance && (
                    <>
                      <Button variant="outline-success" size="sm" onClick={() => handleExport('csv')} className="me-2">
                        📁 CSV (ZIMRA)
                      </Button>
                      <Button variant="outline-primary" size="sm" onClick={() => handleExport('excel')}>
                        📊 Excel
                      </Button>
                    </>
                  )}
                </Col>
              </Row>

              {statutoryRemittance && (
                <>
                  <Alert variant="info">
                    <Row>
                      <Col md={6}>
                        <strong>Period:</strong> {statutoryRemittance.period.monthName} {statutoryRemittance.period.year}
                      </Col>
                      <Col md={6}>
                        <strong>NSSA Rate:</strong> {statutoryRemittance.nssaConfiguration.employeeRate} Employee + {statutoryRemittance.nssaConfiguration.employerRate} Employer
                      </Col>
                    </Row>
                  </Alert>

                  {/* Grand Total Card */}
                  <Card className="mb-4 border-success">
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">Grand Total - All Departments</h6>
                    </Card.Header>
                    <Card.Body>
                      <Row className="text-center">
                        <Col>
                          <p className="mb-0 small text-muted">Gross Pay</p>
                          <h5>${statutoryRemittance.grandTotal.totalGrossPay.toLocaleString()}</h5>
                        </Col>
                        <Col>
                          <p className="mb-0 small text-muted">NSSA Employee</p>
                          <h5 className="text-primary">${statutoryRemittance.grandTotal.totalNSSAEmployee.toLocaleString()}</h5>
                        </Col>
                        <Col>
                          <p className="mb-0 small text-muted">NSSA Employer</p>
                          <h5 className="text-info">${statutoryRemittance.grandTotal.totalNSSAEmployer.toLocaleString()}</h5>
                        </Col>
                        <Col>
                          <p className="mb-0 small text-muted">Total NSSA</p>
                          <h5 className="text-success">${statutoryRemittance.grandTotal.totalNSSA.toLocaleString()}</h5>
                        </Col>
                        <Col>
                          <p className="mb-0 small text-muted">Total PAYE</p>
                          <h5 className="text-danger">${statutoryRemittance.grandTotal.totalPAYE.toLocaleString()}</h5>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Department Breakdown */}
                  <h5>Department Breakdown</h5>
                  {statutoryRemittance.departmentBreakdown.map((dept, idx) => (
                    <Card key={idx} className="mb-3">
                      <Card.Header 
                        className="bg-light cursor-pointer"
                        onClick={() => setExpandedDepartment(expandedDepartment === dept.department ? null : dept.department)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Row>
                          <Col md={3}><strong>{dept.department}</strong></Col>
                          <Col md={2}>Gross: ${dept.totalGrossPay.toLocaleString()}</Col>
                          <Col md={2}>NSSA: ${dept.totalNSSA.toLocaleString()}</Col>
                          <Col md={2}>PAYE: ${dept.totalPAYE.toLocaleString()}</Col>
                          <Col md={3} className="text-end">
                            <Badge bg="secondary">{dept.employees.length} employees</Badge>
                            <span className="ms-2">{expandedDepartment === dept.department ? '▼' : '▶'}</span>
                          </Col>
                        </Row>
                      </Card.Header>
                      {expandedDepartment === dept.department && (
                        <Card.Body>
                          <Table striped size="sm">
                            <thead>
                              <tr>
                                <th>Emp #</th>
                                <th>Name</th>
                                <th>Gross Pay</th>
                                <th>NSSA Employee</th>
                                <th>NSSA Employer</th>
                                <th>Total NSSA</th>
                                <th>PAYE</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dept.employees.map((emp, empIdx) => (
                                <tr key={empIdx}>
                                  <td>{emp.employeeNumber}</td>
                                  <td>{emp.employeeName}</td>
                                  <td>${emp.grossPay.toLocaleString()}</td>
                                  <td>${emp.nssaEmployee.toLocaleString()}</td>
                                  <td>${emp.nssaEmployer.toLocaleString()}</td>
                                  <td><strong>${emp.totalNSSA.toLocaleString()}</strong></td>
                                  <td className="text-danger">${emp.paye.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </Card.Body>
                      )}
                    </Card>
                  ))}
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>

        {/* DUAL CURRENCY TAB */}
        <Tab eventKey="dual-currency" title="Dual Currency Analysis">
          <Card className="mb-4">
            <Card.Header className="bg-warning text-dark">
              <h5 className="mb-0">USD/ZWL Dual Currency Analysis</h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Month</Form.Label>
                    <Form.Select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Year</Form.Label>
                    <Form.Control
                      type="number"
                      value={year}
                      onChange={(e) => setYear(parseInt(e.target.value))}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="d-flex align-items-end">
                  <Button variant="warning" onClick={handleGenerateReport} disabled={loading} className="me-2">
                    {loading ? <Spinner animation="border" size="sm" /> : 'Generate Report'}
                  </Button>
                  {dualCurrency && (
                    <>
                      <Button variant="outline-success" size="sm" onClick={() => handleExport('excel')} className="me-2">
                        📊 Excel
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => handleExport('pdf')}>
                        📄 PDF
                      </Button>
                    </>
                  )}
                </Col>
              </Row>

              {dualCurrency && (
                <>
                  <Alert variant="info">
                    <strong>Period:</strong> {dualCurrency.period.monthName} {dualCurrency.period.year} · 
                    <strong className="ms-3">Combined USD Equivalent:</strong> ${dualCurrency.combinedUSDEquivalent.toLocaleString()}
                  </Alert>

                  {/* Exchange Rates */}
                  {dualCurrency.exchangeRates.length > 0 && (
                    <Card className="mb-4">
                      <Card.Header>Exchange Rates Applied</Card.Header>
                      <Card.Body>
                        <Table size="sm">
                          <thead>
                            <tr>
                              <th>From</th>
                              <th>To</th>
                              <th>Rate</th>
                              <th>Date</th>
                              <th>Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dualCurrency.exchangeRates.map((rate, idx) => (
                              <tr key={idx}>
                                <td>{rate.fromCurrency}</td>
                                <td>{rate.toCurrency}</td>
                                <td>{rate.rate}</td>
                                <td>{new Date(rate.effectiveDate).toLocaleDateString()}</td>
                                <td>{rate.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  )}

                  {/* Currency Breakdown */}
                  <Row className="mb-4">
                    {dualCurrency.currencyBreakdown.map((curr, idx) => (
                      <Col md={6} key={idx}>
                        <Card>
                          <Card.Header className={curr.currency === 'USD' ? 'bg-success text-white' : 'bg-info text-white'}>
                            <h6 className="mb-0">{curr.currency} Payments</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row className="text-center mb-3">
                              <Col>
                                <p className="mb-0 small text-muted">Employees</p>
                                <h5>{curr.employees}</h5>
                              </Col>
                              <Col>
                                <p className="mb-0 small text-muted">Total Gross</p>
                                <h5>{curr.currency} {curr.totalGross.toLocaleString()}</h5>
                              </Col>
                              <Col>
                                <p className="mb-0 small text-muted">Total Net</p>
                                <h5>{curr.currency} {curr.totalNet.toLocaleString()}</h5>
                              </Col>
                            </Row>

                            <h6>By Department:</h6>
                            <Table size="sm">
                              <thead>
                                <tr>
                                  <th>Department</th>
                                  <th>Gross</th>
                                  <th>Net</th>
                                </tr>
                              </thead>
                              <tbody>
                                {curr.departments.map((dept: any, deptIdx: number) => (
                                  <tr key={deptIdx}>
                                    <td>{dept.department}</td>
                                    <td>{curr.currency} {dept.totalGross.toLocaleString()}</td>
                                    <td>{curr.currency} {dept.totalNet.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Reports;
