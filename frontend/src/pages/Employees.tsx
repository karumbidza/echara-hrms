import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle: string;
  employmentType: string;
  basicSalary: number;
  currency: string;
  isActive: boolean;
  department?: {
    id: string;
    name: string;
  };
}

const Employees: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchTerm, statusFilter, employees]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data.employees);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch employees');
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => 
        statusFilter === 'active' ? emp.isActive : !emp.isActive
      );
    }

    setFilteredEmployees(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete employee');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading employees...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Employee Management</h2>
        <Button 
          variant="dark" 
          onClick={() => navigate('/employees/new')}
        >
          + Add Employee
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filters */}
      <Row className="mb-3">
        <Col md={8}>
          <Form.Control
            type="text"
            placeholder="Search by name, employee number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={4}>
          <Form.Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Form.Select>
        </Col>
      </Row>

      {/* Statistics */}
      <Row className="mb-3">
        <Col>
          <div className="p-3 border rounded">
            <small className="text-muted">Total Employees</small>
            <h4>{employees.length}</h4>
          </div>
        </Col>
        <Col>
          <div className="p-3 border rounded">
            <small className="text-muted">Active</small>
            <h4>{employees.filter(e => e.isActive).length}</h4>
          </div>
        </Col>
        <Col>
          <div className="p-3 border rounded">
            <small className="text-muted">Inactive</small>
            <h4>{employees.filter(e => !e.isActive).length}</h4>
          </div>
        </Col>
        <Col>
          <div className="p-3 border rounded">
            <small className="text-muted">Showing</small>
            <h4>{filteredEmployees.length}</h4>
          </div>
        </Col>
      </Row>

      {/* Employee Table */}
      {filteredEmployees.length === 0 ? (
        <Alert variant="info">
          No employees found. {searchTerm || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Click "Add Employee" to get started.'}
        </Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead className="table-dark">
            <tr>
              <th>Employee #</th>
              <th>Name</th>
              <th>Job Title</th>
              <th>Department</th>
              <th>Type</th>
              <th>Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.id}>
                <td className="text-monospace">{employee.employeeNumber}</td>
                <td>
                  <strong>{employee.firstName} {employee.lastName}</strong>
                  <br />
                  <small className="text-muted">{employee.email}</small>
                </td>
                <td>{employee.jobTitle}</td>
                <td>{employee.department?.name || 'Unassigned'}</td>
                <td>
                  <Badge bg="secondary">
                    {employee.employmentType.replace('_', ' ')}
                  </Badge>
                </td>
                <td>
                  {employee.currency} {employee.basicSalary.toLocaleString()}
                </td>
                <td>
                  <Badge bg={employee.isActive ? 'success' : 'danger'}>
                    {employee.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    className="me-2"
                    onClick={() => navigate(`/employees/${employee.id}`)}
                  >
                    View
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="me-2"
                    onClick={() => navigate(`/employees/${employee.id}/edit`)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleDelete(employee.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default Employees;
