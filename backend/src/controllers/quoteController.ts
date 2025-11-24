import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

// Submit quote request (public - no auth required)
export const submitQuoteRequest = async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      contactPerson,
      estimatedEmployees,
      estimatedUsers,
      industry,
      additionalNotes,
      preferredPlan,
      currency
    } = req.body;

    // Validate required fields
    if (!companyName || !companyEmail || !contactPerson || !estimatedEmployees || !estimatedUsers) {
      return res.status(400).json({ 
        error: 'Missing required fields: companyName, companyEmail, contactPerson, estimatedEmployees, estimatedUsers' 
      });
    }

    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        companyName,
        companyEmail,
        companyPhone,
        contactPerson,
        estimatedEmployees,
        estimatedUsers,
        industry,
        additionalNotes,
        preferredPlan,
        currency: currency || 'USD'
      }
    });

    res.status(201).json({ 
      message: 'Quote request submitted successfully. We will get back to you within 24 hours.',
      quoteRequest: {
        id: quoteRequest.id,
        companyName: quoteRequest.companyName,
        status: quoteRequest.status
      }
    });
  } catch (error) {
    console.error('Error submitting quote request:', error);
    res.status(500).json({ error: 'Failed to submit quote request' });
  }
};

// Get all quote requests (Super Admin only)
export const getAllQuoteRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { status } = req.query;

    const quoteRequests = await prisma.quoteRequest.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: 'desc' }
    });

    res.json({ quoteRequests });
  } catch (error) {
    console.error('Error fetching quote requests:', error);
    res.status(500).json({ error: 'Failed to fetch quote requests' });
  }
};

// Get single quote request (Super Admin only)
export const getQuoteRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id } = req.params;

    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id }
    });

    if (!quoteRequest) {
      return res.status(404).json({ error: 'Quote request not found' });
    }

    res.json({ quoteRequest });
  } catch (error) {
    console.error('Error fetching quote request:', error);
    res.status(500).json({ error: 'Failed to fetch quote request' });
  }
};

// Respond to quote request (Super Admin only)
export const respondToQuoteRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id } = req.params;
    const { status, quoteAmount, quoteCurrency, quoteNotes } = req.body;

    const quoteRequest = await prisma.quoteRequest.update({
      where: { id },
      data: {
        status,
        quoteAmount,
        quoteCurrency,
        quoteNotes,
        respondedAt: new Date(),
        respondedBy: req.user.id
      }
    });

    res.json({ message: 'Quote response updated', quoteRequest });
  } catch (error) {
    console.error('Error responding to quote:', error);
    res.status(500).json({ error: 'Failed to respond to quote' });
  }
};

// Convert quote to tenant (Super Admin only)
export const convertQuoteToTenant = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { id } = req.params;
    const { planId, trialDays, subscriptionStatus } = req.body;

    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id }
    });

    if (!quoteRequest) {
      return res.status(404).json({ error: 'Quote request not found' });
    }

    if (quoteRequest.convertedToTenant) {
      return res.status(400).json({ error: 'This quote has already been converted to a tenant' });
    }

    // Create tenant
    const slug = quoteRequest.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const tenant = await prisma.tenant.create({
      data: {
        name: quoteRequest.companyName,
        slug,
        companyEmail: quoteRequest.companyEmail,
        companyPhone: quoteRequest.companyPhone,
        subscriptionStatus: subscriptionStatus || 'TRIAL',
        trialEndsAt: trialDays ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000) : null
      }
    });

    // Update quote request
    await prisma.quoteRequest.update({
      where: { id },
      data: {
        convertedToTenant: true,
        tenantId: tenant.id,
        status: 'ACCEPTED'
      }
    });

    res.json({ 
      message: 'Quote converted to tenant successfully',
      tenant
    });
  } catch (error) {
    console.error('Error converting quote to tenant:', error);
    res.status(500).json({ error: 'Failed to convert quote to tenant' });
  }
};
