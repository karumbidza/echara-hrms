import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const employees = await prisma.employee.findMany({
      where: { tenantId },
      include: {
        department: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ employees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

export const getEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const employee = await prisma.employee.findFirst({
      where: { id, tenantId },
      include: {
        department: true,
        payslips: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ employee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const employeeData = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Log incoming data for debugging
    console.log('Creating employee with data:', { 
      tenantId, 
      hasFirstName: !!employeeData.firstName,
      hasLastName: !!employeeData.lastName,
      hasJobTitle: !!employeeData.jobTitle,
      currency: employeeData.currency,
      payFrequency: employeeData.payFrequency,
      hasFiles: !!files,
      fileFields: files ? Object.keys(files) : []
    });

    // Generate unique employee number by checking existing employees
    const existingCount = await prisma.employee.count({
      where: { tenantId }
    });
    
    // Generate employee number with tenant prefix and sequential number
    let employeeNumber = `EMP${String(existingCount + 1).padStart(4, '0')}`;
    
    // Ensure uniqueness by checking if it exists and incrementing if needed
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.employee.findUnique({
        where: { employeeNumber }
      });
      
      if (!existing) break;
      
      // If exists, add random suffix
      employeeNumber = `EMP${String(existingCount + 1).padStart(4, '0')}-${Math.floor(Math.random() * 1000)}`;
      attempts++;
    }

    // Handle file uploads
    const filePaths: any = {};
    if (files) {
      if (files.photo && files.photo[0]) {
        filePaths.photoPath = `/uploads/${files.photo[0].filename}`;
      }
      if (files.nationalId && files.nationalId[0]) {
        filePaths.nationalIdPath = `/uploads/${files.nationalId[0].filename}`;
      }
      if (files.driversLicense && files.driversLicense[0]) {
        filePaths.driversLicensePath = `/uploads/${files.driversLicense[0].filename}`;
      }
    }

    // Ensure contractCurrency is set (defaults to currency if not provided)
    const dataToCreate = {
      ...employeeData,
      ...filePaths,
      contractCurrency: employeeData.contractCurrency || employeeData.currency || 'USD',
      tenantId,
      employeeNumber
    };
    
    // Parse numeric fields from strings to floats
    const numericFields = [
      'basicSalary',
      'defaultHousingAllowance',
      'defaultTransportAllowance',
      'defaultMealAllowance',
      'defaultOtherAllowances',
      'defaultPensionContribution',
      'defaultMedicalAid',
      'defaultMonthlyLeaveRate'
    ];
    
    numericFields.forEach(field => {
      if (dataToCreate[field] !== undefined && dataToCreate[field] !== null && dataToCreate[field] !== '') {
        dataToCreate[field] = parseFloat(dataToCreate[field]);
      }
    });
    
    // Parse boolean fields
    if (dataToCreate.isActive !== undefined) {
      dataToCreate.isActive = dataToCreate.isActive === 'true' || dataToCreate.isActive === true;
    }
    
    if (dataToCreate.noticeGiven !== undefined) {
      dataToCreate.noticeGiven = dataToCreate.noticeGiven === 'true' || dataToCreate.noticeGiven === true;
    }

    const employee = await prisma.employee.create({
      data: dataToCreate,
      include: {
        department: true
      }
    });

    // Auto-create leave balance for the new employee
    try {
      const currentYear = new Date().getFullYear();
      const currentDate = new Date();
      const hireDate = employee.hireDate ? new Date(employee.hireDate) : currentDate;
      
      // Get or create leave policy for tenant
      let policy = await prisma.leavePolicy.findUnique({
        where: { tenantId }
      });

      if (!policy) {
        // Create default leave policy
        policy = await prisma.leavePolicy.create({
          data: {
            tenantId,
            annualLeaveDays: 22,
            sickLeaveDaysBeforeCert: 2,
            maternityLeaveDays: 98,
            paternityLeaveDays: 7,
            carryOverDays: 5
          }
        });
      }

      // Calculate leave accrued based on hire date
      // Leave accumulates at 1.83 days per month (22 days / 12 months)
      const monthlyAccrual = policy.annualLeaveDays / 12;
      
      let accruedLeave = policy.annualLeaveDays;
      let startDate = hireDate;
      
      // If hired this year, calculate prorated leave
      if (hireDate.getFullYear() === currentYear) {
        const monthsWorked = Math.max(0, 
          (currentDate.getFullYear() - hireDate.getFullYear()) * 12 + 
          (currentDate.getMonth() - hireDate.getMonth())
        );
        
        // Add partial month if more than 15 days into current month
        const daysIntoMonth = currentDate.getDate();
        const additionalMonthFraction = daysIntoMonth >= 15 ? 1 : 0;
        
        accruedLeave = (monthsWorked + additionalMonthFraction) * monthlyAccrual;
        
        console.log(`📊 Leave calculation for ${employee.firstName}:`, {
          hireDate: hireDate.toISOString().split('T')[0],
          currentDate: currentDate.toISOString().split('T')[0],
          monthsWorked,
          additionalMonthFraction,
          monthlyAccrual: monthlyAccrual.toFixed(2),
          accruedLeave: accruedLeave.toFixed(2)
        });
      }

      // Create leave balance for the employee
      await prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          year: currentYear,
          annualTotal: policy.annualLeaveDays,
          annualUsed: 0,
          annualBalance: Math.round(accruedLeave * 10) / 10, // Round to 1 decimal
          annualCarryOver: 0,
          sickUsed: 0,
          maternityUsed: 0,
          paternityUsed: 0
        }
      });

      console.log('✅ Leave balance created for employee:', employee.employeeNumber, 'with', accruedLeave.toFixed(1), 'days');
    } catch (leaveError) {
      console.error('Failed to create leave balance:', leaveError);
      // Don't fail employee creation if leave balance fails
    }

    res.status(201).json({ employee, message: 'Employee created successfully' });
  } catch (error: any) {
    console.error('Create employee error:', error);
    console.error('Error details:', {
      code: error.code,
      meta: error.meta,
      message: error.message,
      stack: error.stack
    });
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Employee with this unique identifier already exists. Please try again.',
        field: error.meta?.target 
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Invalid department or reference. Please check your selections.',
        field: error.meta?.field_name
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create employee',
      details: error.message,
      code: error.code
    });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const employeeData = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Handle file uploads
    const filePaths: any = {};
    if (files) {
      if (files.photo && files.photo[0]) {
        filePaths.photoPath = `/uploads/${files.photo[0].filename}`;
      }
      if (files.nationalId && files.nationalId[0]) {
        filePaths.nationalIdPath = `/uploads/${files.nationalId[0].filename}`;
      }
      if (files.driversLicense && files.driversLicense[0]) {
        filePaths.driversLicensePath = `/uploads/${files.driversLicense[0].filename}`;
      }
    }

    // Sanitize data - remove fields that shouldn't be updated
    const { employeeNumber, createdAt, updatedAt, ...updateData } = employeeData;

    // Parse numeric fields from strings to floats
    const parsedData: any = { ...updateData };
    
    const numericFields = [
      'basicSalary',
      'defaultHousingAllowance',
      'defaultTransportAllowance',
      'defaultMealAllowance',
      'defaultOtherAllowances',
      'defaultPensionContribution',
      'defaultMedicalAid',
      'defaultMonthlyLeaveRate'
    ];
    
    numericFields.forEach(field => {
      if (parsedData[field] !== undefined && parsedData[field] !== null && parsedData[field] !== '') {
        parsedData[field] = parseFloat(parsedData[field]);
      }
    });
    
    // Parse boolean fields
    if (parsedData.isActive !== undefined) {
      parsedData.isActive = parsedData.isActive === 'true' || parsedData.isActive === true;
    }
    
    if (parsedData.noticeGiven !== undefined) {
      parsedData.noticeGiven = parsedData.noticeGiven === 'true' || parsedData.noticeGiven === true;
    }

    const employee = await prisma.employee.updateMany({
      where: { id, tenantId },
      data: {
        ...parsedData,
        ...filePaths
      }
    });

    if (employee.count === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updatedEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { department: true }
    });

    res.json({ employee: updatedEmployee, message: 'Employee updated successfully' });
  } catch (error: any) {
    console.error('Update employee error:', error);
    console.error('Error details:', {
      code: error.code,
      meta: error.meta,
      message: error.message
    });
    res.status(500).json({ 
      error: 'Failed to update employee',
      details: error.message,
      code: error.code
    });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const result = await prisma.employee.deleteMany({
      where: { id, tenantId }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};
