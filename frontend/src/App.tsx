import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Employees from './pages/Employees';
import EmployeeForm from './pages/EmployeeForm';
import Departments from './pages/Departments';
import Payroll from './pages/Payroll';
import PayrollRuns from './pages/PayrollRuns';
import PayrollRunDetail from './pages/PayrollRunDetail';
import PayrollApprovals from './pages/PayrollApprovals';
import SuperAdminDashboard from './pages/SuperAdminDashboard';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Super Admin Route component
const SuperAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Check if user has SUPER_ADMIN role
  if (user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

// Public Route component (redirects to dashboard if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return user ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function AppContent() {
  const { user } = useAuth();
  
  return (
    <Router>
      <div className="App">
        {/* Only show Navigation if logged in */}
        {user && <Navigation />}
        <Container fluid>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
            
            {/* Super Admin routes */}
            <Route 
              path="/super-admin" 
              element={
                <SuperAdminRoute>
                  <SuperAdminDashboard />
                </SuperAdminRoute>
              } 
            />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employees" 
              element={
                <ProtectedRoute>
                  <Employees />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employees/new" 
              element={
                <ProtectedRoute>
                  <EmployeeForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employees/:id/edit" 
              element={
                <ProtectedRoute>
                  <EmployeeForm />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/departments" 
              element={
                <ProtectedRoute>
                  <Departments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payroll" 
              element={
                <ProtectedRoute>
                  <Payroll />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payroll-runs" 
              element={
                <ProtectedRoute>
                  <PayrollRuns />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payroll-runs/:id" 
              element={
                <ProtectedRoute>
                  <PayrollRunDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/payroll-approvals" 
              element={
                <ProtectedRoute>
                  <PayrollApprovals />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
