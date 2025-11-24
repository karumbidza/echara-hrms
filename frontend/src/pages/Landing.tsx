import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-vh-100 bg-light">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">
            <span className="fs-4">ECHARA</span> <span className="text-muted">HRMS</span>
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="#features">Features</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#pricing">Pricing</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#about">About</a>
              </li>
              <li className="nav-item ms-3">
                <button className="btn btn-outline-light" onClick={() => navigate('/login')}>
                  Login
                </button>
              </li>
              <li className="nav-item ms-2">
                <button className="btn btn-light fw-semibold" onClick={() => navigate('/register')}>
                  Start Free Trial
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5 bg-dark text-white">
        <div className="container py-5">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Payroll & HR Management<br />
                <span className="text-muted">Made Simple</span>
              </h1>
              <p className="lead mb-4">
                Automate payroll processing, manage employees, and stay compliant with Zimbabwe tax regulations. 
                Built specifically for Zimbabwean businesses.
              </p>
              <div className="d-flex gap-3">
                <button className="btn btn-light btn-lg fw-semibold" onClick={() => navigate('/register')}>
                  Start Free 14-Day Trial
                </button>
                <button className="btn btn-outline-light btn-lg" onClick={() => navigate('/demo')}>
                  Watch Demo
                </button>
              </div>
              <p className="mt-3 small text-muted">No credit card required • Cancel anytime</p>
            </div>
            <div className="col-lg-6 text-center">
              <div className="bg-white text-dark rounded shadow-lg p-5">
                <h3 className="mb-4">Trusted by 200+ Companies</h3>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="border rounded p-3">
                      <h2 className="mb-0">99.9%</h2>
                      <small className="text-muted">Uptime</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3">
                      <h2 className="mb-0">5,000+</h2>
                      <small className="text-muted">Payslips/Month</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3">
                      <h2 className="mb-0">100%</h2>
                      <small className="text-muted">ZIMRA Compliant</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="border rounded p-3">
                      <h2 className="mb-0">24/7</h2>
                      <small className="text-muted">Support</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-5">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Everything You Need</h2>
            <p className="lead text-muted">Comprehensive payroll and HR features designed for Zimbabwe</p>
          </div>
          
          <div className="row g-4">
            {/* Feature Cards */}
            <div className="col-md-4">
              <div className="card border-0 shadow h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <h1 className="mb-0">💰</h1>
                  </div>
                  <h4 className="fw-bold mb-3">Automated Payroll</h4>
                  <p className="text-muted">
                    Process payroll in minutes. Automatic PAYE, NSSA, and AIDS Levy calculations. 
                    Dual currency support (USD/ZWL).
                  </p>
                  <ul className="list-unstyled small">
                    <li className="mb-2">✓ Tax table management</li>
                    <li className="mb-2">✓ Bulk processing</li>
                    <li className="mb-2">✓ Payslip generation</li>
                    <li className="mb-2">✓ Bank file exports</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <h1 className="mb-0">📊</h1>
                  </div>
                  <h4 className="fw-bold mb-3">Compliance Made Easy</h4>
                  <p className="text-muted">
                    Stay compliant with Zimbabwe tax laws. Automatic updates to ZIMRA rates and regulations.
                  </p>
                  <ul className="list-unstyled small">
                    <li className="mb-2">✓ ZIMRA P.35 exports</li>
                    <li className="mb-2">✓ NSSA remittance files</li>
                    <li className="mb-2">✓ Audit trail</li>
                    <li className="mb-2">✓ Statutory reports</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <h1 className="mb-0">👥</h1>
                  </div>
                  <h4 className="fw-bold mb-3">Employee Management</h4>
                  <p className="text-muted">
                    Centralized employee database. Track contracts, departments, and performance.
                  </p>
                  <ul className="list-unstyled small">
                    <li className="mb-2">✓ Employee profiles</li>
                    <li className="mb-2">✓ Department structure</li>
                    <li className="mb-2">✓ Document storage</li>
                    <li className="mb-2">✓ Leave management</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <h1 className="mb-0">✅</h1>
                  </div>
                  <h4 className="fw-bold mb-3">Approval Workflows</h4>
                  <p className="text-muted">
                    Multi-level approval system. Department managers and finance review before final approval.
                  </p>
                  <ul className="list-unstyled small">
                    <li className="mb-2">✓ Payroll approvals</li>
                    <li className="mb-2">✓ Leave approvals</li>
                    <li className="mb-2">✓ Role-based access</li>
                    <li className="mb-2">✓ Approval history</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <h1 className="mb-0">📱</h1>
                  </div>
                  <h4 className="fw-bold mb-3">Self-Service Portal</h4>
                  <p className="text-muted">
                    Employees access payslips, request leave, and update personal information online.
                  </p>
                  <ul className="list-unstyled small">
                    <li className="mb-2">✓ Digital payslips</li>
                    <li className="mb-2">✓ Leave requests</li>
                    <li className="mb-2">✓ Profile updates</li>
                    <li className="mb-2">✓ Salary history</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card border-0 shadow h-100">
                <div className="card-body p-4">
                  <div className="mb-3">
                    <h1 className="mb-0">📈</h1>
                  </div>
                  <h4 className="fw-bold mb-3">Reports & Analytics</h4>
                  <p className="text-muted">
                    Real-time insights into payroll costs, trends, and employee metrics.
                  </p>
                  <ul className="list-unstyled small">
                    <li className="mb-2">✓ Cost analysis</li>
                    <li className="mb-2">✓ Department reports</li>
                    <li className="mb-2">✓ Tax summaries</li>
                    <li className="mb-2">✓ Custom exports</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-5 bg-light">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Simple, Transparent Pricing</h2>
            <p className="lead text-muted">Choose the plan that fits your business</p>
          </div>

          <div className="row g-4 justify-content-center">
            {/* Starter Plan */}
            <div className="col-md-4">
              <div className="card border-0 shadow h-100">
                <div className="card-body p-4">
                  <h4 className="fw-bold mb-3">Starter</h4>
                  <p className="text-muted">Perfect for small teams</p>
                  <div className="mb-4">
                    <h2 className="fw-bold mb-0">$29<small className="text-muted">/month</small></h2>
                    <small className="text-muted">or ZWL 900/month</small>
                  </div>
                  <ul className="list-unstyled mb-4">
                    <li className="mb-2">✓ Up to 10 employees</li>
                    <li className="mb-2">✓ 2 user accounts</li>
                    <li className="mb-2">✓ Payroll processing</li>
                    <li className="mb-2">✓ Tax calculations</li>
                    <li className="mb-2">✓ Basic reports</li>
                    <li className="mb-2">✓ Email support</li>
                  </ul>
                  <button className="btn btn-dark w-100" onClick={() => navigate('/register?plan=starter')}>
                    Start Free Trial
                  </button>
                </div>
              </div>
            </div>

            {/* Professional Plan */}
            <div className="col-md-4">
              <div className="card border border-dark shadow-lg h-100 position-relative">
                <div className="position-absolute top-0 start-50 translate-middle">
                  <span className="badge bg-dark">Most Popular</span>
                </div>
                <div className="card-body p-4">
                  <h4 className="fw-bold mb-3">Professional</h4>
                  <p className="text-muted">For growing businesses</p>
                  <div className="mb-4">
                    <h2 className="fw-bold mb-0">$79<small className="text-muted">/month</small></h2>
                    <small className="text-muted">or ZWL 2,500/month</small>
                  </div>
                  <ul className="list-unstyled mb-4">
                    <li className="mb-2">✓ Up to 50 employees</li>
                    <li className="mb-2">✓ 5 user accounts</li>
                    <li className="mb-2">✓ All Starter features</li>
                    <li className="mb-2">✓ Approval workflows</li>
                    <li className="mb-2">✓ Leave management</li>
                    <li className="mb-2">✓ Advanced reports</li>
                    <li className="mb-2">✓ Priority support</li>
                  </ul>
                  <button className="btn btn-dark w-100" onClick={() => navigate('/register?plan=professional')}>
                    Start Free Trial
                  </button>
                </div>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="col-md-4">
              <div className="card border-0 shadow h-100">
                <div className="card-body p-4">
                  <h4 className="fw-bold mb-3">Enterprise</h4>
                  <p className="text-muted">For large organizations</p>
                  <div className="mb-4">
                    <h2 className="fw-bold mb-0">Custom</h2>
                    <small className="text-muted">Contact for pricing</small>
                  </div>
                  <ul className="list-unstyled mb-4">
                    <li className="mb-2">✓ Unlimited employees</li>
                    <li className="mb-2">✓ Unlimited users</li>
                    <li className="mb-2">✓ All Professional features</li>
                    <li className="mb-2">✓ Custom integrations</li>
                    <li className="mb-2">✓ Dedicated account manager</li>
                    <li className="mb-2">✓ 24/7 phone support</li>
                    <li className="mb-2">✓ SLA guarantee</li>
                  </ul>
                  <button className="btn btn-outline-dark w-100" onClick={() => navigate('/contact')}>
                    Contact Sales
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-5">
            <p className="text-muted">All plans include 14-day free trial • No credit card required</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-dark text-white">
        <div className="container py-5 text-center">
          <h2 className="display-5 fw-bold mb-4">Ready to Simplify Your Payroll?</h2>
          <p className="lead mb-4">Join hundreds of Zimbabwean businesses already using ECHARA HRMS</p>
          <button className="btn btn-light btn-lg fw-semibold" onClick={() => navigate('/register')}>
            Start Your Free Trial Today
          </button>
          <p className="mt-3 small text-muted">14 days free • No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-light py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-0 text-muted">&copy; 2025 ECHARA HRMS. All rights reserved.</p>
            </div>
            <div className="col-md-6 text-md-end">
              <a href="/privacy" className="text-muted text-decoration-none me-3">Privacy Policy</a>
              <a href="/terms" className="text-muted text-decoration-none me-3">Terms of Service</a>
              <a href="/contact" className="text-muted text-decoration-none">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
