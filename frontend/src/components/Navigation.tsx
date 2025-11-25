import React from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const { user, logout, hasFeature } = useAuth();

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
                  // Regular User Navigation with Feature Flags
                  <>
                    <Nav.Link href="/dashboard">Dashboard</Nav.Link>
                    
                    {/* Control Center Group */}
                    {(hasFeature('employees') || hasFeature('departments') || (hasFeature('contracts') && ['ADMIN', 'MANAGER'].includes(user.role))) && (
                      <NavDropdown title="Control Center" id="control-center-dropdown">
                        {hasFeature('employees') && (
                          <NavDropdown.Item href="/employees">Employees</NavDropdown.Item>
                        )}
                        {hasFeature('departments') && (
                          <NavDropdown.Item href="/departments">Departments</NavDropdown.Item>
                        )}
                        {hasFeature('contracts') && ['ADMIN', 'MANAGER'].includes(user.role) && (
                          <NavDropdown.Item href="/contracts">Contracts</NavDropdown.Item>
                        )}
                      </NavDropdown>
                    )}

                    {/* Approvals Group */}
                    {((hasFeature('leaveApprovals') && ['ADMIN', 'MANAGER'].includes(user.role)) || 
                      (hasFeature('payrollApprovals') && ['ADMIN', 'GENERAL_MANAGER', 'FINANCE_MANAGER'].includes(user.role))) && (
                      <NavDropdown title="Approvals" id="approvals-dropdown">
                        {hasFeature('leaveApprovals') && ['ADMIN', 'MANAGER'].includes(user.role) && (
                          <NavDropdown.Item href="/leave-approvals">Leave Approvals</NavDropdown.Item>
                        )}
                        {hasFeature('payrollApprovals') && ['ADMIN', 'GENERAL_MANAGER', 'FINANCE_MANAGER'].includes(user.role) && (
                          <NavDropdown.Item href="/payroll-approvals">Payroll Approvals</NavDropdown.Item>
                        )}
                      </NavDropdown>
                    )}

                    {/* Standalone Items */}
                    {hasFeature('payroll') && (
                      <Nav.Link href="/payroll">Payroll</Nav.Link>
                    )}
                    {hasFeature('leave') && (
                      <Nav.Link href="/leave">Leave</Nav.Link>
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
