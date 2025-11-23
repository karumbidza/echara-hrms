import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Alert, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

interface Department {
  id: string;
  name: string;
  code?: string;
  organizationId: string;
  _count: {
    employees: number;
  };
}

interface Organization {
  id: string;
  name: string;
}

const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    organizationId: ''
  });

  useEffect(() => {
    fetchDepartments();
    fetchOrganizations();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data.departments);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch departments');
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/organizations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrganizations(response.data.organizations);
      if (response.data.organizations.length > 0) {
        setFormData(prev => ({ ...prev, organizationId: response.data.organizations[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch organizations:', err);
    }
  };

  const handleShowModal = (dept?: Department) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        name: dept.name,
        code: dept.code || '',
        organizationId: dept.organizationId
      });
    } else {
      setEditingDept(null);
      setFormData({
        name: '',
        code: '',
        organizationId: organizations[0]?.id || ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDept(null);
    setFormData({ name: '', code: '', organizationId: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (editingDept) {
        await axios.put(`${API_URL}/departments/${editingDept.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/departments`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      fetchDepartments();
      handleCloseModal();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save department');
    }
  };

  const handleDelete = async (id: string, employeeCount: number) => {
    if (employeeCount > 0) {
      alert(`Cannot delete department with ${employeeCount} employee(s). Please reassign employees first.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this department?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDepartments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete department');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="mt-2">Loading departments...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Department Management</h2>
        <Button variant="dark" onClick={() => handleShowModal()}>
          + Add Department
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {departments.length === 0 ? (
        <Alert variant="info">
          No departments found. Click "Add Department" to create your first department.
        </Alert>
      ) : (
        <Table striped bordered hover>
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Employees</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id}>
                <td><strong>{dept.name}</strong></td>
                <td>{dept.code || '-'}</td>
                <td>
                  <Badge bg="info">{dept._count.employees} employees</Badge>
                </td>
                <td>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="me-2"
                    onClick={() => handleShowModal(dept)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleDelete(dept.id, dept._count.employees)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{editingDept ? 'Edit Department' : 'Add Department'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Department Name *</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Human Resources"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Department Code</Form.Label>
              <Form.Control
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., HR"
              />
              <Form.Text className="text-muted">
                Optional short code for the department
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="dark" type="submit">
              {editingDept ? 'Update' : 'Create'} Department
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Departments;
