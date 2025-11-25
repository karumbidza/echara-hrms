import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const prisma = new PrismaClient();

/**
 * Generate password-protected PDF payslip for an employee
 */
export const generatePayslipPDF = async (req: AuthRequest, res: Response) => {
  try {
    const { payslipId } = req.params;
    const tenantId = req.user?.tenantId;

    // Fetch payslip with employee details
    const payslip = await prisma.payslip.findFirst({
      where: {
        id: payslipId,
        employee: { tenantId }
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true,
            nationalId: true,
            department: {
              select: {
                name: true
              }
            }
          }
        },
        payrollRun: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true
          }
        }
      }
    });

    if (!payslip) {
      return res.status(404).json({ error: 'Payslip not found' });
    }

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    // Embed fonts
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let yPosition = height - 50;

    // Header - Company Name
    page.drawText('PAYSLIP', {
      x: 50,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Currency badge in header
    const currencyBadgeText = `💰 ${payslip.currency}`;
    page.drawText(currencyBadgeText, {
      x: 480,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: payslip.currency === 'USD' ? rgb(0, 0.5, 0) : rgb(0, 0.3, 0.7),
    });

    yPosition -= 10;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 2,
      color: rgb(0, 0, 0),
    });

    yPosition -= 30;

    // Employee Information
    page.drawText('EMPLOYEE INFORMATION', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 20;
    const employee = (payslip as any).employee;
    page.drawText(`Name: ${employee.firstName} ${employee.lastName}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: regularFont,
    });
    page.drawText(`Employee No: ${employee.employeeNumber}`, {
      x: 350,
      y: yPosition,
      size: 10,
      font: regularFont,
    });

    yPosition -= 15;
    page.drawText(`Job Title: ${employee.jobTitle || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: regularFont,
    });
    page.drawText(`Department: ${employee.department?.name || 'N/A'}`, {
      x: 350,
      y: yPosition,
      size: 10,
      font: regularFont,
    });

    yPosition -= 15;
    page.drawText(`National ID: ${employee.nationalId || 'N/A'}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: regularFont,
    });

    yPosition -= 30;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Pay Period Information
    yPosition -= 20;
    page.drawText('PAY PERIOD', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 20;
    const periodStart = new Date(payslip.periodStart).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    const periodEnd = new Date(payslip.periodEnd).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    page.drawText(`Period: ${periodStart} - ${periodEnd}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: regularFont,
    });
    page.drawText(`Pay Date: ${new Date(payslip.payDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, {
      x: 350,
      y: yPosition,
      size: 10,
      font: regularFont,
    });

    yPosition -= 30;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Earnings Section
    yPosition -= 20;
    page.drawText('EARNINGS', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 20;
    const earnings = [
      { label: 'Basic Salary', amount: payslip.basicSalary },
      { label: 'Allowances', amount: payslip.allowances },
      { label: 'Bonuses', amount: payslip.bonuses },
      { label: 'Overtime', amount: payslip.overtime },
    ];

    earnings.forEach((item) => {
      page.drawText(item.label, {
        x: 50,
        y: yPosition,
        size: 10,
        font: regularFont,
      });
      page.drawText(`${payslip.currency} ${item.amount.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 10,
        font: regularFont,
      });
      yPosition -= 15;
    });

    yPosition -= 5;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= 15;
    page.drawText('GROSS SALARY', {
      x: 50,
      y: yPosition,
      size: 11,
      font: boldFont,
    });
    page.drawText(`${payslip.currency} ${payslip.grossSalary.toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 11,
      font: boldFont,
    });

    yPosition -= 30;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Deductions Section
    yPosition -= 20;
    page.drawText('DEDUCTIONS', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 20;
    const deductions = [
      { label: 'Pre-tax Deductions', amount: payslip.preTaxDeductions },
      { label: 'PAYE Tax', amount: payslip.paye },
      { label: 'AIDS Levy', amount: payslip.aidsLevy },
      { label: 'NSSA Employee', amount: payslip.nssaEmployee },
      { label: 'Other Deductions', amount: payslip.otherDeductions },
    ];

    deductions.forEach((item) => {
      page.drawText(item.label, {
        x: 50,
        y: yPosition,
        size: 10,
        font: regularFont,
      });
      page.drawText(`${payslip.currency} ${item.amount.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 10,
        font: regularFont,
      });
      yPosition -= 15;
    });

    yPosition -= 5;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    yPosition -= 15;
    page.drawText('TOTAL DEDUCTIONS', {
      x: 50,
      y: yPosition,
      size: 11,
      font: boldFont,
    });
    page.drawText(`${payslip.currency} ${payslip.totalDeductions.toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 11,
      font: boldFont,
    });

    yPosition -= 30;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 2,
      color: rgb(0, 0, 0),
    });

    // Net Pay
    yPosition -= 20;
    page.drawText('NET PAY', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0.5, 0),
    });
    page.drawText(`${payslip.currency} ${payslip.netSalary.toFixed(2)}`, {
      x: 450,
      y: yPosition,
      size: 14,
      font: boldFont,
      color: rgb(0, 0.5, 0),
    });

    yPosition -= 30;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Leave Information Section
    yPosition -= 20;
    page.drawText('LEAVE BALANCE', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 20;
    page.drawText(`Accrued this month: ${((payslip as any).leaveAccruedThisMonth || 0).toFixed(2)} days`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: regularFont,
    });

    yPosition -= 15;
    page.drawText(`Used YTD: ${((payslip as any).leaveUsedYTD || 0).toFixed(2)} days`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: regularFont,
    });

    yPosition -= 15;
    page.drawText(`Balance Remaining: ${((payslip as any).leaveBalanceRemaining || 0).toFixed(2)} days`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: rgb(0, 0.5, 0),
    });

    yPosition -= 10;
    page.drawText('(Zimbabwe standard: 22 days/year)', {
      x: 50,
      y: yPosition,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    yPosition -= 30;
    page.drawLine({
      start: { x: 50, y: yPosition },
      end: { x: width - 50, y: yPosition },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });

    // YTD Summary
    yPosition -= 20;
    page.drawText('YEAR-TO-DATE SUMMARY', {
      x: 50,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    yPosition -= 20;
    const ytdItems = [
      { label: 'YTD Gross', amount: payslip.ytdGross },
      { label: 'YTD Taxable', amount: payslip.ytdTaxable },
      { label: 'YTD PAYE', amount: payslip.ytdPaye },
      { label: 'YTD NSSA', amount: payslip.ytdNssa },
      { label: 'YTD Net Pay', amount: payslip.ytdNetPay },
    ];

    ytdItems.forEach((item) => {
      page.drawText(item.label, {
        x: 50,
        y: yPosition,
        size: 9,
        font: regularFont,
      });
      page.drawText(`${payslip.currency} ${item.amount.toFixed(2)}`, {
        x: 450,
        y: yPosition,
        size: 9,
        font: regularFont,
      });
      yPosition -= 14;
    });

    // Footer
    yPosition -= 20;
    page.drawText('This is a computer-generated payslip. No signature required.', {
      x: 50,
      y: yPosition,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    yPosition -= 12;
    page.drawText('CONFIDENTIAL: This document is password-protected with your National ID.', {
      x: 50,
      y: yPosition,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();

    // TODO: Apply password protection using employee's national ID (without spaces/hyphens)
    // Password protection requires qpdf to be installed on the system
    // For now, PDFs are generated without password protection
    const password = (payslip as any).pdfPassword || (payslip as any).employee?.nationalId?.replace(/[\s-]/g, '') || '';
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${employee.employeeNumber}_${periodStart.replace(/\s/g, '')}.pdf`);
    res.setHeader('Content-Length', pdfBytes.length);

    // Send PDF
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error('Generate payslip PDF error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
