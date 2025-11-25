import React, { useState, useEffect } from 'react';
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
  defaultHousingAllowance: number;
  defaultTransportAllowance: number;
  defaultMealAllowance: number;
  defaultOtherAllowances: number;
  defaultPensionContribution: number;
  defaultMedicalAid: number;
  defaultMonthlyLeaveRate: number;
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
    monthlyLeaveRate: number;
    leaveDaysTaken: number;
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
  const [submitting, setSubmitting] = useState(false);
  const [createdPayrollRunId, setCreatedPayrollRunId] = useState<string | null>(null);
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
      
      // Initialize payroll inputs with basic salary and default allowances
      const initialInputs: PayrollInputs = {};
      activeEmployees.forEach((emp: Employee) => {
        initialInputs[emp.id] = {
          basicSalary: emp.basicSalary,
          housingAllowance: emp.defaultHousingAllowance || 0,
          transportAllowance: emp.defaultTransportAllowance || 0,
          mealAllowance: emp.defaultMealAllowance || 0,
          otherAllowances: emp.defaultOtherAllowances || 0,
          monthlyLeaveRate: emp.defaultMonthlyLeaveRate || 0,
          leaveDaysTaken: 0,
          overtimePay: 0,
          bonus: 0,
          commission: 0,
          pensionContribution: emp.defaultPensionContribution || 0,
          medicalAid: emp.defaultMedicalAid || 0,
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
    if (!inputs) return { gross: 0, preTaxDeductions: 0, taxable: 0, leaveDeduction: 0 };

    // Calculate leave deduction: (Monthly Leave Rate / 30) × Leave Days Taken
    const dailyLeaveRate = inputs.monthlyLeaveRate / 30;
    const leaveDeduction = dailyLeaveRate * inputs.leaveDaysTaken;
    const netLeaveAmount = inputs.monthlyLeaveRate - leaveDeduction;

    const earnings = 
      inputs.basicSalary + 
      inputs.housingAllowance + 
      inputs.transportAllowance + 
      inputs.mealAllowance + 
      inputs.otherAllowances + 
      netLeaveAmount + // Add net leave amount (after deduction)
      inputs.overtimePay + 
      inputs.bonus + 
      inputs.commission;

    const preTaxDeductions = inputs.pensionContribution + inputs.medicalAid;
    const taxable = earnings - preTaxDeductions;

    return { gross: earnings, preTaxDeductions, taxable, leaveDeduction };
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

      const payrollRunId = response.data.payrollRun.id;
      setCreatedPayrollRunId(payrollRunId);
      setMessage({
        type: 'success',
        text: `Payroll created successfully! ${response.data.payrollRun.employeesProcessed} employees processed. Status: DRAFT`
      });

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

  const handleSubmitForApproval = async () => {
    if (!createdPayrollRunId) return;

    if (!window.confirm('Submit this payroll for approval? It cannot be edited after submission.')) {
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      
      await axios.post(
        `${API_URL}/payroll/approval/${createdPayrollRunId}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({
        type: 'success',
        text: 'Payroll submitted for approval! Redirecting...'
      });

      setTimeout(() => {
        window.location.href = '/payroll-runs';
      }, 1500);

    } catch (error: any) {
      console.error('Error submitting payroll:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to submit payroll for approval'
      });
    } finally {
      setSubmitting(false);
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
          <div className="d-flex justify-content-between align-items-center">
            <span>{message.text}</span>
            {message.type === 'success' && createdPayrollRunId && (
              <div>
                <button 
                  className="btn btn-primary btn-sm me-2" 
                  onClick={handleSubmitForApproval}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit for Approval'}
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm" 
                  onClick={() => window.location.href = '/payroll-runs'}
                >
                  View Payroll Runs
                </button>
              </div>
            )}
          </div>
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
                    const fullPayroll = calculateFullPayroll(employee.id, employee.contractCurrency);
                    
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
                            <td colSpan={9} style={{ backgroundColor: '#f8f9fa', padding: 0 }}>
                              <div className="p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                                  <h5 className="mb-0 fw-bold">Payroll Details: {employee.firstName} {employee.lastName}</h5>
                                  <span className="badge bg-dark">{employee.employeeNumber}</span>
                                </div>
                                
                                <div className="row g-4">
                                  {/* LEFT: Allowances (Monthly Recurring) */}
                                  <div className="col-lg-4">
                                    <div className="card border h-100">
                                      <div className="card-header bg-light border-bottom">
                                        <h6 className="mb-0 fw-semibold">Monthly Allowances</h6>
                                        <small className="text-muted">Recurring earnings from employee defaults</small>
                                      </div>
                                      <div className="card-body">
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Housing Allowance</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.housingAllowance || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'housingAllowance', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Transport Allowance</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.transportAllowance || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'transportAllowance', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Meal Allowance</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.mealAllowance || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'mealAllowance', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Other Allowances</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.otherAllowances || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'otherAllowances', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>

                                        <div className="mb-2 pb-2 border-top border-bottom pt-3">
                                          <small className="text-muted fw-bold d-block text-uppercase" style={{fontSize: '0.7rem'}}>Leave Allowance</small>
                                        </div>
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Monthly Leave Rate</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.monthlyLeaveRate || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'monthlyLeaveRate', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                        <div className="mb-0">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Leave Days Taken</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">Days</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.leaveDaysTaken || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'leaveDaysTaken', e.target.value)}
                                              min="0"
                                              max="30"
                                              step="0.5"
                                              placeholder="0"
                                            />
                                          </div>
                                          <small className="text-muted">
                                            Deduction: {employee.contractCurrency} {totals.leaveDeduction.toFixed(2)} 
                                            {inputs?.leaveDaysTaken > 0 && ` (${inputs.leaveDaysTaken} days × ${(inputs.monthlyLeaveRate / 30).toFixed(2)}/day)`}
                                          </small>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* MIDDLE: Variable Pay + Deductions */}
                                  <div className="col-lg-4">
                                    <div className="card border mb-3">
                                      <div className="card-header bg-light border-bottom">
                                        <h6 className="mb-0 fw-semibold">Variable Pay</h6>
                                        <small className="text-muted">One-time or irregular earnings</small>
                                      </div>
                                      <div className="card-body">
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Overtime Pay</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.overtimePay || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'overtimePay', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Bonus</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.bonus || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'bonus', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                        <div className="mb-0">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Commission</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.commission || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'commission', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="card border">
                                      <div className="card-header bg-light border-bottom">
                                        <h6 className="mb-0 fw-semibold">Deductions</h6>
                                        <small className="text-muted">Pre-tax and post-tax deductions</small>
                                      </div>
                                      <div className="card-body">
                                        <div className="mb-2 pb-2 border-bottom">
                                          <small className="text-muted fw-bold d-block text-uppercase" style={{fontSize: '0.7rem'}}>Pre-tax (Reduce Taxable Income)</small>
                                        </div>
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Pension Contribution</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.pensionContribution || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'pensionContribution', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Medical Aid</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.medicalAid || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'medicalAid', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                        
                                        <div className="mb-2 pb-2 border-top border-bottom pt-3">
                                          <small className="text-muted fw-bold d-block text-uppercase" style={{fontSize: '0.7rem'}}>Post-tax</small>
                                        </div>
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Loan Repayment</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.loanRepayment || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'loanRepayment', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                        <div className="mb-3">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Salary Advance</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
                                              value={inputs?.salaryAdvance || ''}
                                              onChange={(e) => handleInputChange(employee.id, 'salaryAdvance', e.target.value)}
                                              min="0"
                                              step="0.01"
                                              placeholder="0.00"
                                            />
                                          </div>
                                        </div>
                                        <div className="mb-0">
                                          <label className="form-label fw-semibold small text-muted text-uppercase">Other Deductions</label>
                                          <div className="input-group input-group-sm">
                                            <span className="input-group-text bg-light">{employee.contractCurrency}</span>
                                            <input
                                              type="number"
                                              className="form-control"
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
                                  </div>

                                  {/* RIGHT: Live Calculation Summary */}
                                  <div className="col-lg-4">
                                    <div className="card border sticky-top" style={{ top: '20px' }}>
                                      <div className="card-header bg-dark text-white border-0">
                                        <h6 className="mb-0 fw-semibold">Payroll Calculation</h6>
                                        <small className="opacity-75">Live preview</small>
                                      </div>
                                      <div className="card-body">
                                        {/* Main Summary Numbers */}
                                        <div className="mb-3 pb-3 border-bottom">
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-muted small text-uppercase fw-semibold">Gross Earnings</span>
                                            <span className="h5 mb-0 fw-bold">{employee.contractCurrency} {totals.gross.toFixed(2)}</span>
                                          </div>
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-muted small">Pre-tax Deductions</span>
                                            <span className="fw-semibold">-{employee.contractCurrency} {totals.preTaxDeductions.toFixed(2)}</span>
                                          </div>
                                          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                                            <span className="text-muted small text-uppercase fw-semibold">Taxable Income</span>
                                            <span className="h6 mb-0 fw-bold">{employee.contractCurrency} {totals.taxable.toFixed(2)}</span>
                                          </div>
                                        </div>

                                        {/* Statutory Deductions */}
                                        <div className="mb-3 pb-3 border-bottom">
                                          <h6 className="text-muted small mb-2 fw-bold text-uppercase" style={{fontSize: '0.7rem'}}>Statutory Deductions</h6>
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="small">PAYE Tax</span>
                                            <span className="fw-semibold">{employee.contractCurrency} {fullPayroll.paye.toFixed(2)}</span>
                                          </div>
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="small">AIDS Levy (3%)</span>
                                            <span className="fw-semibold">{employee.contractCurrency} {fullPayroll.aidsLevy.toFixed(2)}</span>
                                          </div>
                                          <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="small">NSSA Employee (4.5%)</span>
                                            <span className="fw-semibold">{employee.contractCurrency} {fullPayroll.nssaEmployee.toFixed(2)}</span>
                                          </div>
                                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                                            <span className="small fw-semibold">NSSA Employer (4.5%)</span>
                                            <span className="fw-bold">{employee.contractCurrency} {fullPayroll.nssaEmployer.toFixed(2)}</span>
                                          </div>
                                          <div className="d-flex justify-content-between align-items-center mt-2">
                                            <span className="small">Post-tax Deductions</span>
                                            <span className="fw-semibold">{employee.contractCurrency} {fullPayroll.postTaxDeductions.toFixed(2)}</span>
                                          </div>
                                        </div>

                                        {/* Total & Net Pay */}
                                        <div className="bg-light border p-3 rounded">
                                          <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span className="fw-semibold text-uppercase small">Total Deductions</span>
                                            <span className="h6 mb-0 fw-bold">{employee.contractCurrency} {fullPayroll.totalDeductions.toFixed(2)}</span>
                                          </div>
                                          <div className="d-flex justify-content-between align-items-center p-3 bg-dark text-white rounded">
                                            <span className="fw-bold text-uppercase">Net Pay</span>
                                            <span className="h4 mb-0 fw-bold">{employee.contractCurrency} {fullPayroll.netPay.toFixed(2)}</span>
                                          </div>
                                        </div>

                                        {/* Leave Information */}
                                        <div className="alert alert-info border mt-3 mb-0">
                                          <h6 className="text-muted small mb-2 fw-bold text-uppercase" style={{fontSize: '0.7rem'}}>
                                            <i className="bi bi-calendar-check me-1"></i> Leave Balance
                                          </h6>
                                          <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="small">Accrued this month</span>
                                            <span className="fw-semibold">1.83 days</span>
                                          </div>
                                          <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="small">Used YTD</span>
                                            <span className="fw-semibold">0.0 days</span>
                                          </div>
                                          <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                                            <span className="small fw-bold">Balance Remaining</span>
                                            <span className="fw-bold text-success">22.0 days</span>
                                          </div>
                                          <small className="text-muted d-block mt-2" style={{fontSize: '0.75rem'}}>
                                            <i className="bi bi-info-circle me-1"></i>
                                            Zimbabwe standard: 22 days/year (1.83/month)
                                          </small>
                                        </div>

                                        <div className="alert alert-light border mt-3 mb-0 small">
                                          <strong>Note:</strong> Estimates only. Final calculations include YTD adjustments.
                                        </div>
                                      </div>
                                    </div>
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
