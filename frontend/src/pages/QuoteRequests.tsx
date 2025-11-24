import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface QuoteRequest {
  id: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string | null;
  contactPerson: string;
  estimatedEmployees: number;
  estimatedUsers: number;
  industry: string | null;
  additionalNotes: string | null;
  preferredPlan: string | null;
  currency: string;
  status: string;
  createdAt: string;
  quoteAmount: number | null;
  quoteCurrency: string | null;
  quoteNotes: string | null;
  respondedAt: string | null;
  convertedToTenant: boolean;
}

const QuoteRequests: React.FC = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseForm, setResponseForm] = useState({
    status: 'SENT',
    quoteAmount: '',
    quoteCurrency: 'USD',
    quoteNotes: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchQuotes();
  }, [filter]);

  const fetchQuotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/quotes`, {
        params: { status: filter !== 'ALL' ? filter : undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuotes(response.data.quoteRequests);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setLoading(false);
    }
  };

  const handleRespond = (quote: QuoteRequest) => {
    setSelectedQuote(quote);
    setResponseForm({
      status: 'SENT',
      quoteAmount: quote.quoteAmount?.toString() || '',
      quoteCurrency: quote.quoteCurrency || quote.currency,
      quoteNotes: quote.quoteNotes || ''
    });
    setShowResponseModal(true);
  };

  const submitResponse = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/quotes/${selectedQuote?.id}/respond`,
        {
          ...responseForm,
          quoteAmount: parseFloat(responseForm.quoteAmount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowResponseModal(false);
      fetchQuotes();
    } catch (error) {
      console.error('Error responding to quote:', error);
    }
  };

  const handleConvert = async (quoteId: string) => {
    if (!window.confirm('Convert this quote to a new tenant? This will create a company account.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/quotes/${quoteId}/convert`,
        {
          trialDays: 14,
          subscriptionStatus: 'TRIAL'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Quote converted successfully! Tenant created.');
      fetchQuotes();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to convert quote');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      PENDING: 'bg-warning text-dark',
      REVIEWED: 'bg-info',
      SENT: 'bg-primary',
      ACCEPTED: 'bg-success',
      REJECTED: 'bg-danger'
    };
    return badges[status] || 'bg-secondary';
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border" role="status"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Quote Requests</h2>
          <p className="text-muted mb-0">Manage incoming quote requests from potential customers</p>
        </div>
        <button className="btn btn-outline-dark" onClick={() => navigate('/super-admin')}>
          ← Back to Dashboard
        </button>
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="btn-group" role="group">
            {['ALL', 'PENDING', 'REVIEWED', 'SENT', 'ACCEPTED', 'REJECTED'].map((status) => (
              <button
                key={status}
                type="button"
                className={`btn btn-sm ${filter === status ? 'btn-dark' : 'btn-outline-dark'}`}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          {quotes.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="bg-light">
                  <tr>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>Requirements</th>
                    <th>Preferred Plan</th>
                    <th>Status</th>
                    <th>Quote Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id}>
                      <td>
                        <div>
                          <strong>{quote.companyName}</strong>
                          {quote.industry && (
                            <div className="small text-muted">{quote.industry}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{quote.contactPerson}</div>
                          <div className="small text-muted">{quote.companyEmail}</div>
                          {quote.companyPhone && (
                            <div className="small text-muted">{quote.companyPhone}</div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className="badge bg-light text-dark">
                            {quote.estimatedEmployees} employees
                          </span>
                          <br />
                          <span className="badge bg-light text-dark mt-1">
                            {quote.estimatedUsers} users
                          </span>
                        </div>
                      </td>
                      <td>
                        {quote.preferredPlan ? (
                          <span className="badge bg-secondary">{quote.preferredPlan}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(quote.status)}`}>
                          {quote.status}
                        </span>
                        {quote.convertedToTenant && (
                          <div className="small text-success mt-1">✓ Converted</div>
                        )}
                      </td>
                      <td>
                        {quote.quoteAmount ? (
                          <div>
                            <strong>
                              {quote.quoteCurrency === 'USD' ? '$' : 'ZWL '}
                              {quote.quoteAmount.toFixed(2)}
                            </strong>
                            <div className="small text-muted">/month</div>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <small>{new Date(quote.createdAt).toLocaleDateString()}</small>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-primary"
                            onClick={() => handleRespond(quote)}
                            disabled={quote.convertedToTenant}
                          >
                            {quote.status === 'PENDING' ? 'Respond' : 'Update'}
                          </button>
                          {quote.status === 'SENT' && !quote.convertedToTenant && (
                            <button
                              className="btn btn-outline-success"
                              onClick={() => handleConvert(quote.id)}
                            >
                              Convert
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No quote requests found</p>
            </div>
          )}
        </div>
      </div>

      {/* Response Modal */}
      {showResponseModal && selectedQuote && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Respond to Quote Request</h5>
                <button className="btn-close" onClick={() => setShowResponseModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 p-3 bg-light rounded">
                  <h6 className="fw-bold">{selectedQuote.companyName}</h6>
                  <p className="mb-1">
                    <strong>Requirements:</strong> {selectedQuote.estimatedEmployees} employees, {selectedQuote.estimatedUsers} users
                  </p>
                  {selectedQuote.additionalNotes && (
                    <p className="mb-0">
                      <strong>Notes:</strong> {selectedQuote.additionalNotes}
                    </p>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Quote Amount *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={responseForm.quoteAmount}
                      onChange={(e) => setResponseForm({ ...responseForm, quoteAmount: e.target.value })}
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Currency *</label>
                    <select
                      className="form-select"
                      value={responseForm.quoteCurrency}
                      onChange={(e) => setResponseForm({ ...responseForm, quoteCurrency: e.target.value })}
                    >
                      <option value="USD">US Dollar (USD)</option>
                      <option value="ZWL">Zimbabwe Dollar (ZWL)</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Status *</label>
                    <select
                      className="form-select"
                      value={responseForm.status}
                      onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
                    >
                      <option value="REVIEWED">Reviewed (internal)</option>
                      <option value="SENT">Send Quote to Customer</option>
                      <option value="REJECTED">Reject Request</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Notes / Quote Details</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={responseForm.quoteNotes}
                      onChange={(e) => setResponseForm({ ...responseForm, quoteNotes: e.target.value })}
                      placeholder="Include: Monthly price, setup fees, included features, payment terms, trial period details, etc."
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowResponseModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={submitResponse}>
                  Save Response
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteRequests;
