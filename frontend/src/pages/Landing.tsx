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
                <button className="btn btn-light fw-semibold" onClick={() => navigate('/request-quote')}>
                  Get Quote
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
                <button className="btn btn-light btn-lg fw-semibold" onClick={() => navigate('/request-quote')}>
                  Get Custom Quote
                </button>
                <button className="btn btn-outline-light btn-lg" onClick={() => navigate('/login')}>
                  Login
                </button>
              </div>
              <p className="mt-3 small text-muted">Personalized pricing • 14-day trial • No obligation</p>
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
            <h2 className="display-5 fw-bold mb-3">Flexible Pricing for Your Business</h2>
            <p className="lead text-muted">We create custom plans tailored to your needs</p>
          </div>

          <div className="row g-4 align-items-center">
            <div className="col-lg-6">
              <div className="card border-0 shadow-lg p-4">
                <div className="card-body">
                  <h3 className="fw-bold mb-4">Why Quote-Based Pricing?</h3>
                  <p className="text-muted mb-4">
                    Every business is unique. Instead of one-size-fits-all pricing, we analyze your specific requirements and create a plan that fits your budget and needs.
                  </p>
                  <ul className="list-unstyled">
                    <li className="mb-3">
                      <h5 className="mb-1">💰 Fair & Transparent</h5>
                      <p className="text-muted mb-0">Pay only for what you need. No hidden fees.</p>
                    </li>
                    <li className="mb-3">
                      <h5 className="mb-1">🎯 Customized Features</h5>
                      <p className="text-muted mb-0">Choose the features that matter to your business.</p>
                    </li>
                    <li className="mb-3">
                      <h5 className="mb-1">💵 Multiple Payment Options</h5>
                      <p className="text-muted mb-0">Pay in USD or ZWL. Bank transfer, Ecocash, or other methods.</p>
                    </li>
                    <li className="mb-3">
                      <h5 className="mb-1">📞 Personalized Support</h5>
                      <p className="text-muted mb-0">Get a dedicated account manager for your setup.</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card border-0 shadow-lg p-4 bg-dark text-white">
                <div className="card-body text-center">
                  <h1 className="mb-4">📋</h1>
                  <h3 className="fw-bold mb-3">Request Your Custom Quote</h3>
                  <p className="mb-4">
                    Fill out a quick form about your business needs, and we'll send you a personalized quote within 24 hours.
                  </p>
                  <ul className="list-unstyled text-start mb-4">
                    <li className="mb-2">✓ Free consultation & demo</li>
                    <li className="mb-2">✓ 14-day trial period included</li>
                    <li className="mb-2">✓ No obligation to purchase</li>
                    <li className="mb-2">✓ Flexible payment terms</li>
                  </ul>
                  <button className="btn btn-light btn-lg w-100 fw-semibold mb-2" onClick={() => navigate('/request-quote')}>
                    Get Custom Quote
                  </button>
                  <small className="text-muted">Response within 24 hours</small>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-5">
            <div className="row g-4 justify-content-center">
              <div className="col-md-3">
                <h4 className="fw-bold mb-2">Small Teams</h4>
                <p className="text-muted mb-0">10-50 employees</p>
                <p className="fw-semibold">From $29/month</p>
              </div>
              <div className="col-md-3">
                <h4 className="fw-bold mb-2">Growing Business</h4>
                <p className="text-muted mb-0">50-200 employees</p>
                <p className="fw-semibold">From $79/month</p>
              </div>
              <div className="col-md-3">
                <h4 className="fw-bold mb-2">Large Enterprise</h4>
                <p className="text-muted mb-0">200+ employees</p>
                <p className="fw-semibold">Custom pricing</p>
              </div>
            </div>
            <p className="text-muted mt-4">
              <em>Final pricing depends on number of employees, users, and selected features</em>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-5 bg-dark text-white">
        <div className="container py-5 text-center">
          <h2 className="display-5 fw-bold mb-4">Ready to Simplify Your Payroll?</h2>
          <p className="lead mb-4">Join hundreds of Zimbabwean businesses already using ECHARA HRMS</p>
          <button className="btn btn-light btn-lg fw-semibold" onClick={() => navigate('/request-quote')}>
            Request Your Custom Quote
          </button>
          <p className="mt-3 small text-muted">Free consultation • 24-hour response • No obligation</p>
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
