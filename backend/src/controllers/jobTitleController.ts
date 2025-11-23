import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Predefined job titles
const defaultJobTitles = [
  'CEO', 'Managing Director', 'General Manager',
  'HR Manager', 'HR Officer', 'Recruiter',
  'Finance Manager', 'Accountant', 'Financial Analyst',
  'Operations Manager', 'Operations Officer',
  'IT Manager', 'Software Developer', 'System Administrator',
  'Sales Manager', 'Sales Representative', 'Marketing Manager',
  'Driver', 'Security Guard', 'Cleaner', 'Receptionist',
  'Administrator', 'Office Assistant', 'Executive Assistant'
];

export const getJobTitles = async (req: AuthRequest, res: Response) => {
  try {
    // Return predefined job titles
    // In future, you could store these in database with tenant customization
    res.json({ jobTitles: defaultJobTitles.sort() });
  } catch (error) {
    console.error('Get job titles error:', error);
    res.status(500).json({ error: 'Failed to fetch job titles' });
  }
};
