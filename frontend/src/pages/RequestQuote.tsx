import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RequestQuote: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    companyPhone: '',
    contactPerson: '',
    estimatedEmployees: '',
    estimatedUsers: '',
    industry: '',
    additionalNotes: '',
    preferredPlan: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/quotes/submit`, {
        ...formData,
        estimatedEmployees: parseInt(formData.estimatedEmployees),
        estimatedUsers: parseInt(formData.estimatedUsers)
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting quote request:', err);
      setError(err.response?.data?.error || 'Failed to submit quote request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-0 shadow-lg text-center p-5">
                <div className="mb-4">
                  <h1 className="display-1">✓</h1>
                </div>
                <h2 className="fw-bold mb-3">Quote Request Submitted!</h2>
                <p className="lead text-muted mb-4">
                  Thank you for your interest in ECHARA HRMS. Our team will review your requirements and get back to you within 24 hours with a customized quote.
                </p>
                <p className="text-muted">
                  We'll send the quote to <strong>{formData.companyEmail}</strong>
                </p>
                <button className="btn btn-dark mt-3" onClick={() => navigate('/')}>
                  Return to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Navigation */}
      <nav className="navbar navbar-dark bg-dark sticky-top">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">
            <span className="fs-4">ECHARA</span> <span className="text-muted">HRMS</span>
          </a>
          <button className="btn btn-outline-light btn-sm" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
      </nav>

      {/* Form Section */}
      <section className="py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card border-0 shadow-lg">
                <div className="card-body p-5">
                  <div className="text-center mb-4">
                    <h2 className="fw-bold mb-2">Request a Custom Quote</h2>
                    <p className="text-muted">
                      Tell us about your business and we'll create a tailored pricing plan for you
                    </p>
                  </div>

                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    {/* Company Information */}
                    <h5 className="fw-bold mb-3 border-bottom pb-2">Company Information</h5>
                    
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label">Company Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          required
                          placeholder="Acme Corporation"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Contact Person *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleChange}
                          required
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Company Email *</label>
                        <input
                          type="email"
                          className="form-control"
                          name="companyEmail"
                          value={formData.companyEmail}
                          onChange={handleChange}
                          required
                          placeholder="contact@company.com"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone Number</label>
                        <input
                          type="tel"
                          className="form-control"
                          name="companyPhone"
                          value={formData.companyPhone}
                          onChange={handleChange}
                          placeholder="+263 77 123 4567"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Industry</label>
                        <input
                          type="text"
                          className="form-control"
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          placeholder="e.g., Manufacturing, Retail, Finance"
                        />
                      </div>
                    </div>

                    {/* Requirements */}
                    <h5 className="fw-bold mb-3 border-bottom pb-2 mt-4">Your Requirements</h5>
                    
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label">Estimated Employees *</label>
                        <input
                          type="number"
                          className="form-control"
                          name="estimatedEmployees"
                          value={formData.estimatedEmployees}
                          onChange={handleChange}
                          required
                          min="1"
                          placeholder="e.g., 50"
                        />
                        <small className="text-muted">How many employees will be on payroll?</small>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Estimated System Users *</label>
                        <input
                          type="number"
                          className="form-control"
                          name="estimatedUsers"
                          value={formData.estimatedUsers}
                          onChange={handleChange}
                          required
                          min="1"
                          placeholder="e.g., 5"
                        />
                        <small className="text-muted">HR staff, managers, finance team, etc.</small>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Preferred Plan</label>
                        <select
                          className="form-select"
                          name="preferredPlan"
                          value={formData.preferredPlan}
                          onChange={handleChange}
                        >
                          <option value="">Select a plan (optional)</option>
                          <option value="Starter">Starter - Small teams</option>
                          <option value="Professional">Professional - Growing businesses</option>
                          <option value="Enterprise">Enterprise - Large organizations</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Preferred Currency *</label>
                        <select
                          className="form-select"
                          name="currency"
                          value={formData.currency}
                          onChange={handleChange}
                          required
                        >
                          <option value="USD">US Dollar (USD)</option>
                          <option value="ZWL">Zimbabwe Dollar (ZWL)</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label">Additional Notes</label>
                        <textarea
                          className="form-control"
                          name="additionalNotes"
                          value={formData.additionalNotes}
                          onChange={handleChange}
                          rows={4}
                          placeholder="Any specific requirements, questions, or features you need? e.g., integration with existing systems, training needs, etc."
                        />
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="alert alert-light border mb-4">
                      <h6 className="fw-bold mb-2">✓ What happens next?</h6>
                      <ul className="mb-0 small">
                        <li>Our team reviews your requirements within 24 hours</li>
                        <li>We prepare a customized quote tailored to your needs</li>
                        <li>You receive pricing for setup, monthly fees, and training</li>
                        <li>Free demo and consultation included</li>
                        <li>14-day trial period to test the system</li>
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-dark btn-lg" disabled={loading}>
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Submitting...
                          </>
                        ) : (
                          'Request Quote'
                        )}
                      </button>
                      <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RequestQuote;
