import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  basicSalary: number;
  currency: string;
  department: {
    name: string;
  };
}

interface PayrollInputs {
  [employeeId: string]: {
    allowances: number;
    bonuses: number;
    overtime: number;
    deductions: number;
  };
}

const Payroll: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [payrollInputs, setPayrollInputs] = useState<PayrollInputs>({});
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data.employees.filter((emp: Employee) => emp.basicSalary > 0));
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

  const handleInputChange = (employeeId: string, field: keyof PayrollInputs[string], value: string) => {
    setPayrollInputs(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const calculateGross = (employee: Employee) => {
    const inputs = payrollInputs[employee.id] || { allowances: 0, bonuses: 0, overtime: 0, deductions: 0 };
    return employee.basicSalary + inputs.allowances + inputs.bonuses + inputs.overtime;
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

    setProcessing(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      
      // Format inputs for API
      const allowances: any = {};
      const bonuses: any = {};
      const overtime: any = {};
      const deductions: any = {};

      selectedEmployees.forEach(empId => {
        const inputs = payrollInputs[empId] || { allowances: 0, bonuses: 0, overtime: 0, deductions: 0 };
        allowances[empId] = inputs.allowances;
        bonuses[empId] = inputs.bonuses;
        overtime[empId] = inputs.overtime;
        deductions[empId] = inputs.deductions;
      });

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/payroll/run`,
        {
          periodStart,
          periodEnd,
          employeeIds: selectedEmployees,
          allowances,
          bonuses,
          overtime,
          deductions
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({
        type: 'success',
        text: `Payroll processed successfully! ${response.data.payrollRun.employeesProcessed} employees processed.`
      });

      // Reset form
      setSelectedEmployees([]);
      setPayrollInputs({});

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
        <button className="btn btn-outline-secondary" onClick={() => window.location.href = '/payroll-runs'}>
          View Payroll Runs
        </button>
      </div>

      {message && (
        <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Payroll Period</h5>
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Period Start</label>
              <input
                type="date"
                className="form-control"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Period End</label>
              <input
                type="date"
                className="form-control"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Select Employees</h5>
            <div>
              <span className="text-muted me-3">
                {selectedEmployees.length} of {employees.length} selected
              </span>
              <button className="btn btn-sm btn-outline-primary" onClick={handleSelectAll}>
                {selectedEmployees.length === employees.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>

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
                  <th>Department</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Bonuses</th>
                  <th>Overtime</th>
                  <th>Deductions</th>
                  <th>Gross Salary</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const isSelected = selectedEmployees.includes(employee.id);
                  const inputs = payrollInputs[employee.id] || { allowances: 0, bonuses: 0, overtime: 0, deductions: 0 };
                  
                  return (
                    <tr key={employee.id} className={isSelected ? 'table-active' : ''}>
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
                        </div>
                      </td>
                      <td>{employee.department?.name || 'N/A'}</td>
                      <td>{employee.currency} {employee.basicSalary.toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: '100px' }}
                          value={inputs.allowances || ''}
                          onChange={(e) => handleInputChange(employee.id, 'allowances', e.target.value)}
                          disabled={!isSelected}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: '100px' }}
                          value={inputs.bonuses || ''}
                          onChange={(e) => handleInputChange(employee.id, 'bonuses', e.target.value)}
                          disabled={!isSelected}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: '100px' }}
                          value={inputs.overtime || ''}
                          onChange={(e) => handleInputChange(employee.id, 'overtime', e.target.value)}
                          disabled={!isSelected}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: '100px' }}
                          value={inputs.deductions || ''}
                          onChange={(e) => handleInputChange(employee.id, 'deductions', e.target.value)}
                          disabled={!isSelected}
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td>
                        <strong>{employee.currency} {calculateGross(employee).toFixed(2)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {employees.length === 0 && (
            <div className="text-center py-5">
              <p className="text-muted">No employees with basic salary configured</p>
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
