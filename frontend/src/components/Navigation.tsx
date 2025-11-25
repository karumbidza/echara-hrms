import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/">
          🏢 ECHARA HRMS
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {user && (
              <>
                {user.role === 'SUPER_ADMIN' ? (
                  // Super Admin Navigation
                  <>
                    <Nav.Link href="/super-admin">Platform Dashboard</Nav.Link>
                    <Nav.Link href="/super-admin/quotes">Quote Requests</Nav.Link>
                    <Nav.Link href="/super-admin/plans">Plans</Nav.Link>
                    <Nav.Link href="/super-admin/settings">Settings</Nav.Link>
                    <Nav.Link href="/super-admin/revenue">Revenue</Nav.Link>
                  </>
                ) : (
                  // Regular User Navigation
                  <>
                    <Nav.Link href="/dashboard">Dashboard</Nav.Link>
                    <Nav.Link href="/employees">Employees</Nav.Link>
                    <Nav.Link href="/departments">Departments</Nav.Link>
                    <Nav.Link href="/payroll">Payroll</Nav.Link>
                    <Nav.Link href="/leave">Leave</Nav.Link>
                    {['ADMIN', 'MANAGER'].includes(user.role) && (
                      <Nav.Link href="/contracts">Contracts</Nav.Link>
                    )}
                    {['ADMIN', 'GENERAL_MANAGER', 'FINANCE_MANAGER'].includes(user.role) && (
                      <Nav.Link href="/payroll-approvals">Payroll Approvals</Nav.Link>
                    )}
                    {['ADMIN', 'MANAGER'].includes(user.role) && (
                      <Nav.Link href="/leave-approvals">Leave Approvals</Nav.Link>
                    )}
                  </>
                )}
              </>
            )}
          </Nav>
          <Nav>
            {user ? (
              <>
                <Navbar.Text className="me-3">
                  {user.role === 'SUPER_ADMIN' ? '👑 ' : ''}
                  {user.fullName} ({user.role})
                </Navbar.Text>
                <Button variant="outline-light" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Nav.Link href="/login">Login</Nav.Link>
                <Nav.Link href="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
