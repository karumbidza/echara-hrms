import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const departments = await prisma.department.findMany({
      where: { tenantId },
      include: {
        organization: true,
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

export const getDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const department = await prisma.department.findFirst({
      where: { id, tenantId },
      include: {
        organization: true,
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            email: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ department });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { name, code, organizationId } = req.body;

    const department = await prisma.department.create({
      data: {
        name,
        code,
        tenantId: tenantId!,
        organizationId
      },
      include: {
        organization: true
      }
    });

    res.status(201).json({ department, message: 'Department created successfully' });
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const { name, code, organizationId } = req.body;

    const department = await prisma.department.updateMany({
      where: { id, tenantId },
      data: { name, code, organizationId }
    });

    if (department.count === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const updatedDepartment = await prisma.department.findUnique({
      where: { id },
      include: { organization: true }
    });

    res.json({ department: updatedDepartment, message: 'Department updated successfully' });
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    // Check if department has employees
    const employeeCount = await prisma.employee.count({
      where: { departmentId: id }
    });

    if (employeeCount > 0) {
      return res.status(400).json({ 
        error: `Cannot delete department with ${employeeCount} employee(s). Please reassign or remove employees first.` 
      });
    }

    const result = await prisma.department.deleteMany({
      where: { id, tenantId }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};
