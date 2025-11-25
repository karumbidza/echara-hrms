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

    const employee = await prisma.employee.create({
      data: {
        ...employeeData,
        tenantId,
        employeeNumber
      },
      include: {
        department: true
      }
    });

    res.status(201).json({ employee, message: 'Employee created successfully' });
  } catch (error: any) {
    console.error('Create employee error:', error);
    
    // Provide more specific error messages
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Employee with this unique identifier already exists. Please try again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create employee',
      details: error.message 
    });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const employeeData = req.body;

    const employee = await prisma.employee.updateMany({
      where: { id, tenantId },
      data: employeeData
    });

    if (employee.count === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const updatedEmployee = await prisma.employee.findUnique({
      where: { id },
      include: { department: true }
    });

    res.json({ employee: updatedEmployee, message: 'Employee updated successfully' });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Failed to update employee' });
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
