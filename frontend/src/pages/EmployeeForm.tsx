import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface Department {
  id: string;
  name: string;
}

interface JobTitle {
  title: string;
}

const EmployeeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [driversLicenseFile, setDriversLicenseFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    nationalId: '',
    dateOfBirth: '',
    hireDate: '',
    email: '',
    phone: '',
    address: '',
    jobTitle: '',
    employmentType: 'FULL_TIME',
    contractType: 'PERMANENT',
    contractStartDate: '',
    contractEndDate: '',
    probationEndDate: '',
    payFrequency: 'MONTHLY',
    basicSalary: '',
    currency: 'USD',
    bankName: '',
    bankAccount: '',
    nssaNumber: '',
    departmentId: '',
    defaultHousingAllowance: 0,
    defaultTransportAllowance: 0,
    defaultMealAllowance: 0,
    defaultOtherAllowances: 0,
    defaultPensionContribution: 0,
    defaultMedicalAid: 0,
    defaultMonthlyLeaveRate: 0,
    isActive: true
  });

  useEffect(() => {
    fetchDepartments();
    fetchJobTitles();
    if (isEditMode) {
      fetchEmployee();
    }
  }, [id]);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data.departments);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchJobTitles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/job-titles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobTitles(response.data.jobTitles);
    } catch (err) {
      console.error('Failed to fetch job titles:', err);
    }
  };

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const employee = response.data.employee;
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        nationalId: employee.nationalId || '',
        dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split('T')[0] : '',
        hireDate: employee.hireDate ? employee.hireDate.split('T')[0] : '',
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        jobTitle: employee.jobTitle || '',
        employmentType: employee.employmentType || 'FULL_TIME',
        contractType: employee.contractType || 'PERMANENT',
        contractStartDate: employee.contractStartDate ? employee.contractStartDate.split('T')[0] : '',
        contractEndDate: employee.contractEndDate ? employee.contractEndDate.split('T')[0] : '',
        probationEndDate: employee.probationEndDate ? employee.probationEndDate.split('T')[0] : '',
        payFrequency: employee.payFrequency || 'MONTHLY',
        basicSalary: employee.basicSalary?.toString() || '',
        currency: employee.currency || 'USD',
        bankName: employee.bankName || '',
        bankAccount: employee.bankAccount || '',
        nssaNumber: employee.nssaNumber || '',
        departmentId: employee.departmentId || '',
        defaultHousingAllowance: employee.defaultHousingAllowance || 0,
        defaultTransportAllowance: employee.defaultTransportAllowance || 0,
        defaultMealAllowance: employee.defaultMealAllowance || 0,
        defaultOtherAllowances: employee.defaultOtherAllowances || 0,
        defaultPensionContribution: employee.defaultPensionContribution || 0,
        defaultMedicalAid: employee.defaultMedicalAid || 0,
        defaultMonthlyLeaveRate: employee.defaultMonthlyLeaveRate || 0,
        isActive: employee.isActive
      });
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch employee');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Use FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add all text fields
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof typeof formData];
        if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });
      
      // Add files if present
      if (photoFile) {
        formDataToSend.append('photo', photoFile);
      }
      if (nationalIdFile) {
        formDataToSend.append('nationalId', nationalIdFile);
      }
      if (driversLicenseFile) {
        formDataToSend.append('driversLicense', driversLicenseFile);
      }
      
      // Parse numeric fields and override
      const numericFields = {
        basicSalary: parseFloat(formData.basicSalary.toString()) || 0,
        defaultHousingAllowance: parseFloat(formData.defaultHousingAllowance.toString()) || 0,
        defaultTransportAllowance: parseFloat(formData.defaultTransportAllowance.toString()) || 0,
        defaultMealAllowance: parseFloat(formData.defaultMealAllowance.toString()) || 0,
        defaultOtherAllowances: parseFloat(formData.defaultOtherAllowances.toString()) || 0,
        defaultPensionContribution: parseFloat(formData.defaultPensionContribution.toString()) || 0,
        defaultMedicalAid: parseFloat(formData.defaultMedicalAid.toString()) || 0,
        defaultMonthlyLeaveRate: parseFloat(formData.defaultMonthlyLeaveRate.toString()) || 0
      };
      
      Object.keys(numericFields).forEach(key => {
        formDataToSend.set(key, numericFields[key as keyof typeof numericFields].toString());
      });
      
      // Convert dates to ISO strings
      if (formData.dateOfBirth) {
        formDataToSend.set('dateOfBirth', new Date(formData.dateOfBirth).toISOString());
      }
      if (formData.hireDate) {
        formDataToSend.set('hireDate', new Date(formData.hireDate).toISOString());
      }
      if (formData.contractStartDate) {
        formDataToSend.set('contractStartDate', new Date(formData.contractStartDate).toISOString());
      }
      if (formData.contractEndDate) {
        formDataToSend.set('contractEndDate', new Date(formData.contractEndDate).toISOString());
      }
      if (formData.probationEndDate) {
        formDataToSend.set('probationEndDate', new Date(formData.probationEndDate).toISOString());
      }

      if (isEditMode) {
        await axios.put(`${API_URL}/employees/${id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Employee updated successfully!');
      } else {
        await axios.post(`${API_URL}/employees`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setSuccess('Employee created successfully!');
      }

      setTimeout(() => navigate('/employees'), 1500);
    } catch (err: any) {
      console.error('Employee form error:', err);
      console.error('Error response:', err.response?.data);
      const errorMsg = err.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} employee`;
      const errorDetails = err.response?.data?.details ? ` (${err.response.data.details})` : '';
      const errorCode = err.response?.data?.code ? ` [${err.response.data.code}]` : '';
      setError(errorMsg + errorDetails + errorCode);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading employee...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>{isEditMode ? 'Edit Employee' : 'Add New Employee'}</h2>
        <Button variant="outline-secondary" onClick={() => navigate('/employees')}>
          Back to List
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <Card className="mb-4">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">Personal Information</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>National ID *</Form.Label>
                  <Form.Control
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Passport Photo *</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files[0]) setPhotoFile(files[0]);
                    }}
                    required={!isEditMode}
                  />
                  <Form.Text className="text-muted">
                    Passport-size photo (JPG, PNG)
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>National ID Upload *</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files[0]) setNationalIdFile(files[0]);
                    }}
                    required={!isEditMode}
                  />
                  <Form.Text className="text-muted">
                    Scanned copy of National ID
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Employment Information */}
        <Card className="mb-4">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">Employment Information</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Job Title *</Form.Label>
                  <Form.Select
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Job Title</option>
                    {jobTitles.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Select from predefined job titles
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Department *</Form.Label>
                  <Form.Select
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Employment Type *</Form.Label>
                  <Form.Select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    required
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="CASUAL">Casual</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Contract Type *</Form.Label>
                  <Form.Select
                    name="contractType"
                    value={formData.contractType}
                    onChange={handleChange}
                    required
                  >
                    <option value="PERMANENT">Permanent</option>
                    <option value="FIXED_TERM">Fixed Term / Period</option>
                    <option value="PROBATION">Probation</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Fixed term contracts require an end date
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Hire Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="hireDate"
                    value={formData.hireDate}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Contract Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="contractStartDate"
                    value={formData.contractStartDate}
                    onChange={handleChange}
                  />
                  <Form.Text className="text-muted">
                    Usually same as hire date
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {formData.contractType === 'FIXED_TERM' ? 'Contract End Date *' : 
                     formData.contractType === 'PROBATION' ? 'Probation End Date' : 
                     'Contract End Date'}
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name={formData.contractType === 'PROBATION' ? 'probationEndDate' : 'contractEndDate'}
                    value={formData.contractType === 'PROBATION' ? formData.probationEndDate : formData.contractEndDate}
                    onChange={handleChange}
                    required={formData.contractType === 'FIXED_TERM'}
                  />
                  <Form.Text className="text-muted">
                    {formData.contractType === 'FIXED_TERM' && '⚠️ You\'ll be notified 2 weeks before expiry'}
                    {formData.contractType === 'PROBATION' && 'Usually 3-6 months from hire date'}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {formData.jobTitle.toLowerCase().includes('driver') && (
              <Form.Group className="mb-3">
                <Form.Label>Driver's License *</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files && files[0]) setDriversLicenseFile(files[0]);
                  }}
                  required={!isEditMode}
                />
                <Form.Text className="text-muted">
                  Required for driver positions - Upload valid driver's license
                </Form.Text>
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                name="isActive"
                label="Active Employee"
                checked={formData.isActive}
                onChange={handleChange}
              />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Compensation */}
        <Card className="mb-4">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">Compensation</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Basic Salary *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="basicSalary"
                    value={formData.basicSalary}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Currency *</Form.Label>
                  <Form.Select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                  >
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Pay Frequency *</Form.Label>
                  <Form.Select
                    name="payFrequency"
                    value={formData.payFrequency}
                    onChange={handleChange}
                    required
                  >
                    <option value="WEEKLY">Weekly</option>
                    <option value="FORTNIGHTLY">Fortnightly</option>
                    <option value="MONTHLY">Monthly</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Banking & Statutory */}
        <Card className="mb-4">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">Banking & Statutory Information</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank Account Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="bankAccount"
                    value={formData.bankAccount}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>NSSA Number</Form.Label>
              <Form.Control
                type="text"
                name="nssaNumber"
                value={formData.nssaNumber}
                onChange={handleChange}
              />
            </Form.Group>
          </Card.Body>
        </Card>

        {/* Default Monthly Allowances & Deductions */}
        <Card className="mb-4">
          <Card.Header className="bg-dark text-white">
            <h5 className="mb-0">Default Monthly Allowances & Deductions</h5>
            <small className="text-muted">These amounts will be auto-populated when running payroll</small>
          </Card.Header>
          <Card.Body>
            <h6 className="text-success mb-3">Default Allowances</h6>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Housing Allowance</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="defaultHousingAllowance"
                    value={formData.defaultHousingAllowance || 0}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Transport Allowance</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="defaultTransportAllowance"
                    value={formData.defaultTransportAllowance || 0}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Meal Allowance</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="defaultMealAllowance"
                    value={formData.defaultMealAllowance || 0}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Other Allowances</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="defaultOtherAllowances"
                    value={formData.defaultOtherAllowances || 0}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </Form.Group>
              </Col>
            </Row>

            <h6 className="text-warning mb-3 mt-3">Default Deductions</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pension Contribution</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="defaultPensionContribution"
                    value={formData.defaultPensionContribution || 0}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                  <Form.Text className="text-muted">Pre-tax deduction</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Medical Aid</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="defaultMedicalAid"
                    value={formData.defaultMedicalAid || 0}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                  <Form.Text className="text-muted">Pre-tax deduction</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Monthly Leave Rate</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="defaultMonthlyLeaveRate"
                    value={formData.defaultMonthlyLeaveRate || 0}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                  <Form.Text className="text-muted">Full month leave allowance (reduced by days taken)</Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex gap-2">
          <Button variant="dark" type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditMode ? 'Update Employee' : 'Create Employee')}
          </Button>
          <Button variant="outline-secondary" onClick={() => navigate('/employees')}>
            Cancel
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EmployeeForm;
