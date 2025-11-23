import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { calculatePayroll } from '../utils/payrollCalculations';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  basicSalary: number;
  currency: string;
  contractCurrency: string;
  department: {
    name: string;
  };
}

interface PayrollInputs {
  [employeeId: string]: {
    // Base amount
    basicSalary: number;
    
    // Earnings (Taxable)
    housingAllowance: number;
    transportAllowance: number;
    mealAllowance: number;
    otherAllowances: number;
    overtimePay: number;
    bonus: number;
    commission: number;
    
    // Pre-tax Deductions (reduce taxable income)
    pensionContribution: number;
    medicalAid: number;
    
    // Post-tax Deductions
    loanRepayment: number;
    salaryAdvance: number;
    otherDeductions: number;
    
    // Payment details
    paymentCurrency: string;
  };
}

const Payroll: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [payrollInputs, setPayrollInputs] = useState<PayrollInputs>({});
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [exchangeRate, setExchangeRate] = useState(30); // USD to ZWL rate
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEmployees();
    // Set default period to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setPeriodStart(firstDay.toISOString().split('T')[0]);
    setPeriodEnd(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const activeEmployees = response.data.employees.filter((emp: Employee) => emp.basicSalary > 0);
      setEmployees(activeEmployees);
      
      // Initialize payroll inputs with basic salary
      const initialInputs: PayrollInputs = {};
      activeEmployees.forEach((emp: Employee) => {
        initialInputs[emp.id] = {
          basicSalary: emp.basicSalary,
          housingAllowance: 0,
          transportAllowance: 0,
          mealAllowance: 0,
          otherAllowances: 0,
          overtimePay: 0,
          bonus: 0,
          commission: 0,
          pensionContribution: 0,
          medicalAid: 0,
          loanRepayment: 0,
          salaryAdvance: 0,
          otherDeductions: 0,
          paymentCurrency: emp.currency || 'USD'
        };
      });
      setPayrollInputs(initialInputs);
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      setMessage({ type: 'error', text: 'Failed to load employees' });
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map(emp => emp.id));
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const toggleEmployeeExpanded = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const handleInputChange = (employeeId: string, field: keyof PayrollInputs[string], value: string) => {
    setPayrollInputs(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: field === 'paymentCurrency' ? value : (parseFloat(value) || 0)
      }
    }));
  };

  const calculateTotals = (employeeId: string) => {
    const inputs = payrollInputs[employeeId];
    if (!inputs) return { gross: 0, preTaxDeductions: 0, taxable: 0 };

    const earnings = 
      inputs.basicSalary + 
      inputs.housingAllowance + 
      inputs.transportAllowance + 
      inputs.mealAllowance + 
      inputs.otherAllowances + 
      inputs.overtimePay + 
      inputs.bonus + 
      inputs.commission;

    const preTaxDeductions = inputs.pensionContribution + inputs.medicalAid;
    const taxable = earnings - preTaxDeductions;

    return { gross: earnings, preTaxDeductions, taxable };
  };

  const calculateFullPayroll = (employeeId: string, currency: string) => {
    const inputs = payrollInputs[employeeId];
    if (!inputs) {
      return {
        grossEarnings: 0,
        preTaxDeductions: 0,
        taxableIncome: 0,
        paye: 0,
        aidsLevy: 0,
        nssaEmployee: 0,
        nssaEmployer: 0,
        postTaxDeductions: 0,
        totalDeductions: 0,
        netPay: 0
      };
    }

    const totalAllowances = 
      inputs.housingAllowance + 
      inputs.transportAllowance + 
      inputs.mealAllowance + 
      inputs.otherAllowances;
    
    const totalBonuses = inputs.bonus + inputs.commission;

    return calculatePayroll(
      inputs.basicSalary,
      totalAllowances,
      totalBonuses,
      inputs.overtimePay,
      inputs.pensionContribution,
      inputs.medicalAid,
      inputs.loanRepayment,
      inputs.salaryAdvance,
      inputs.otherDeductions,
      currency
    );
  };

  const handleRunPayroll = async () => {
    if (selectedEmployees.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one employee' });
      return;
    }

    if (!periodStart || !periodEnd) {
      setMessage({ type: 'error', text: 'Please select payroll period' });
      return;
    }

    if (exchangeRate <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid exchange rate' });
      return;
    }

    setProcessing(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      
      // Format data for API - send detailed breakdown per employee
      const employeeData = selectedEmployees.map(empId => {
        const inputs = payrollInputs[empId];
        return {
          employeeId: empId,
          basicSalary: inputs.basicSalary,
          housingAllowance: inputs.housingAllowance,
          transportAllowance: inputs.transportAllowance,
          mealAllowance: inputs.mealAllowance,
          otherAllowances: inputs.otherAllowances,
          overtimePay: inputs.overtimePay,
          bonus: inputs.bonus,
          commission: inputs.commission,
          pensionContribution: inputs.pensionContribution,
          medicalAid: inputs.medicalAid,
          loanRepayment: inputs.loanRepayment,
          salaryAdvance: inputs.salaryAdvance,
          otherDeductions: inputs.otherDeductions,
          paymentCurrency: inputs.paymentCurrency
        };
      });

      const response = await axios.post(
        `${API_URL}/payroll/run`,
        {
          periodStart,
          periodEnd,
          exchangeRate,
          employees: employeeData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({
        type: 'success',
        text: `Payroll processed successfully! ${response.data.payrollRun.employeesProcessed} employees processed.`
      });

      // Redirect to payroll runs after 2 seconds
      setTimeout(() => {
        window.location.href = '/payroll-runs';
      }, 2000);

    } catch (error: any) {
      console.error('Error running payroll:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to process payroll'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Process Payroll</h2>
        <div>
          <span className="badge bg-info me-2">v1.1.0</span>
          <button className="btn btn-outline-secondary" onClick={() => window.location.href = '/payroll-runs'}>
            View Payroll Runs
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Payroll Period & Exchange Rate</h5>
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Period Start *</label>
              <input
                type="date"
                className="form-control"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Period End *</label>
              <input
                type="date"
                className="form-control"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Exchange Rate (1 USD = ? ZWL) *</label>
              <input
                type="number"
                className="form-control"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                min="1"
                step="0.01"
                required
              />
              <small className="text-muted">Current interbank rate for this payroll run</small>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Select Employees & Enter Details</h5>
            <div>
              <span className="text-muted me-3">
                {selectedEmployees.length} of {employees.length} selected
              </span>
              <button className="btn btn-sm btn-outline-primary" onClick={handleSelectAll}>
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

          {employees.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No employees with basic salary configured</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{width: '50px'}}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedEmployees.length === employees.length && employees.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th>Employee</th>
                    <th>Contract Currency</th>
                    <th>Payment Currency</th>
                    <th className="text-end">Basic Salary</th>
                    <th className="text-end">Gross Earnings</th>
                    <th className="text-end">Total Deductions</th>
                    <th className="text-end">Est. Net Pay</th>
                    <th style={{width: '100px'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => {
                    const isSelected = selectedEmployees.includes(employee.id);
                    const isExpanded = expandedEmployees.has(employee.id);
                    const inputs = payrollInputs[employee.id];
                    const totals = calculateTotals(employee.id);
                    const fullPayroll = useMemo(() => 
                      calculateFullPayroll(employee.id, employee.contractCurrency), 
                      [employee.id, employee.contractCurrency, JSON.stringify(inputs)]
                    );
                    
                    return (
                      <React.Fragment key={employee.id}>
                        <tr className={isSelected ? 'table-active' : ''}>
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={isSelected}
                              onChange={() => handleEmployeeSelect(employee.id)}
                            />
                          </td>
                          <td>
                            <div>
                              <strong>{employee.firstName} {employee.lastName}</strong>
                              <div className="small text-muted">{employee.employeeNumber}</div>
                              <div className="small text-muted">{employee.department?.name}</div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-info">{employee.contractCurrency}</span>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={inputs?.paymentCurrency || employee.currency}
                              onChange={(e) => handleInputChange(employee.id, 'paymentCurrency', e.target.value)}
                              disabled={!isSelected}
                              style={{ width: '90px' }}
                            >
                              <option value="USD">USD</option>
                              <option value="ZWL">ZWL</option>
                            </select>
                          </td>
                          <td className="text-end">
                            <input
                              type="number"
                              className="form-control form-control-sm text-end"
                              value={inputs?.basicSalary || employee.basicSalary}
                              onChange={(e) => handleInputChange(employee.id, 'basicSalary', e.target.value)}
                              disabled={!isSelected}
                              min="0"
                              step="0.01"
                              style={{ width: '120px' }}
                            />
                          </td>
                          <td className="text-end">
                            <strong>{employee.contractCurrency} {totals.gross.toFixed(2)}</strong>
                          </td>
                          <td className="text-end text-danger">
                            -{employee.contractCurrency} {fullPayroll.totalDeductions.toFixed(2)}
                          </td>
                          <td className="text-end">
                            <strong className="text-success">{employee.contractCurrency} {fullPayroll.netPay.toFixed(2)}</strong>
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => toggleEmployeeExpanded(employee.id)}
                              disabled={!isSelected}
                            >
                              {isExpanded ? 'Hide' : 'Details'}
                            </button>
                          </td>
                        </tr>
                        
                        {isExpanded && isSelected && (
                          <tr>
                            <td colSpan={9} style={{ backgroundColor: '#f8f9fa' }}>
                              <div className="p-4">
                                <h5 className="mb-4 text-center">Earnings & Deductions for {employee.firstName} {employee.lastName}</h5>
                                <div className="row g-4">
                                  {/* Earnings Section */}
                                  <div className="col-md-4">
                                    <h6 className="text-success mb-3">📈 Earnings (Taxable)</h6>
                                    <div className="row g-3 mb-2">
                                      <div className="col-6">
                                        <label className="form-label small">Housing Allowance</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.housingAllowance || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'housingAllowance', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="col-6">
                                        <label className="form-label small">Transport Allowance</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.transportAllowance || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'transportAllowance', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="col-6">
                                        <label className="form-label small">Meal Allowance</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.mealAllowance || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'mealAllowance', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="col-6">
                                        <label className="form-label small">Other Allowances</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.otherAllowances || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'otherAllowances', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="col-6">
                                        <label className="form-label small">Overtime Pay</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.overtimePay || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'overtimePay', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="col-6">
                                        <label className="form-label small">Bonus</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.bonus || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'bonus', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="col-6">
                                        <label className="form-label small">Commission</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.commission || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'commission', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Deductions Section */}
                                  <div className="col-md-6">
                                    <h6 className="text-warning">📉 Pre-tax Deductions (Reduce Taxable Income)</h6>
                                    <div className="row g-2 mb-3">
                                      <div className="col-6">
                                        <label className="form-label small">Pension Contribution</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.pensionContribution || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'pensionContribution', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="col-6">
                                        <label className="form-label small">Medical Aid</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.medicalAid || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'medicalAid', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>

                                    <h6 className="text-danger">💸 Post-tax Deductions</h6>
                                    <div className="row g-2">
                                      <div className="col-6">
                                        <label className="form-label small">Loan Repayment</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.loanRepayment || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'loanRepayment', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="col-6">
                                        <label className="form-label small">Salary Advance</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.salaryAdvance || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'salaryAdvance', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      <div className="col-6">
                                        <label className="form-label small">Other Deductions</label>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={inputs?.otherDeductions || ''}
                                          onChange={(e) => handleInputChange(employee.id, 'otherDeductions', e.target.value)}
                                          min="0"
                                          step="0.01"
                                          placeholder="0.00"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 p-3 bg-white border rounded shadow-sm">
                                  <h6 className="text-center mb-3">📊 Payroll Summary</h6>
                                  <div className="row g-3">
                                    <div className="col-3 text-center">
                                      <small className="text-muted d-block">Gross Earnings</small>
                                      <div className="h5 mb-0 text-success">{employee.contractCurrency} {totals.gross.toFixed(2)}</div>
                                    </div>
                                    <div className="col-3 text-center">
                                      <small className="text-muted d-block">Pre-tax Ded.</small>
                                      <div className="h5 mb-0 text-warning">-{employee.contractCurrency} {totals.preTaxDeductions.toFixed(2)}</div>
                                    </div>
                                    <div className="col-3 text-center border-start">
                                      <small className="text-muted d-block">Taxable Income</small>
                                      <div className="h5 mb-0 text-primary">{employee.contractCurrency} {totals.taxable.toFixed(2)}</div>
                                    </div>
                                    <div className="col-3 text-center border-start">
                                      <small className="text-muted d-block">Est. Net Pay</small>
                                      <div className="h4 mb-0 text-success"><strong>{employee.contractCurrency} {fullPayroll.netPay.toFixed(2)}</strong></div>
                                    </div>
                                  </div>
                                  <hr className="my-3"/>
                                  <div className="row g-2 small">
                                    <div className="col-6">
                                      <div className="d-flex justify-content-between">
                                        <span className="text-muted">PAYE:</span>
                                        <strong>{employee.contractCurrency} {fullPayroll.paye.toFixed(2)}</strong>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="d-flex justify-content-between">
                                        <span className="text-muted">AIDS Levy:</span>
                                        <strong>{employee.contractCurrency} {fullPayroll.aidsLevy.toFixed(2)}</strong>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="d-flex justify-content-between">
                                        <span className="text-muted">NSSA (Employee):</span>
                                        <strong>{employee.contractCurrency} {fullPayroll.nssaEmployee.toFixed(2)}</strong>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="d-flex justify-content-between">
                                        <span className="text-info">NSSA (Employer):</span>
                                        <strong className="text-info">{employee.contractCurrency} {fullPayroll.nssaEmployer.toFixed(2)}</strong>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="d-flex justify-content-between">
                                        <span className="text-muted">Post-tax Ded.:</span>
                                        <strong>{employee.contractCurrency} {fullPayroll.postTaxDeductions.toFixed(2)}</strong>
                                      </div>
                                    </div>
                                    <div className="col-6">
                                      <div className="d-flex justify-content-between">
                                        <span className="text-muted">Total Deductions:</span>
                                        <strong className="text-danger">{employee.contractCurrency} {fullPayroll.totalDeductions.toFixed(2)}</strong>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="alert alert-info mt-3 mb-0 small">
                                    <strong>ℹ️ Note:</strong> These are estimates. Final amounts will be calculated when payroll is processed with YTD adjustments.
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 d-flex justify-content-end">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleRunPayroll}
          disabled={processing || selectedEmployees.length === 0}
        >
          {processing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Processing Payroll...
            </>
          ) : (
            `Process Payroll for ${selectedEmployees.length} Employee(s)`
          )}
        </button>
      </div>
    </div>
  );
};

export default Payroll;
