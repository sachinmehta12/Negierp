import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { FeeService } from '../services/fee.service';

export class FeeController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const classFilter = req.query.class ? Number(req.query.class) : undefined;
      const statusFilter = (req.query.status as string) || 'all';

      const where: any = {
        student: {
          user: { isActive: true }
        }
      };

      if (classFilter && [10, 11, 12].includes(classFilter)) {
        where.student.targetClass = classFilter;
      }
      if (statusFilter !== 'all') {
        where.status = statusFilter;
      }

      const structures = await prisma.feeStructure.findMany({
        where,
        include: {
          student: {
            include: { user: true, stream: true }
          },
          payments: {
            orderBy: { paymentDate: 'desc' }
          }
        },
        orderBy: { dueAmount: 'desc' }
      });

      // Pending payments awaiting verification
      const pendingWhere: any = {
        isVerified: false,
        student: {
          user: { isActive: true }
        }
      };
      if (classFilter && [10, 11, 12].includes(classFilter)) {
        pendingWhere.student.targetClass = classFilter;
      }

      const pendingPayments = await prisma.feePayment.findMany({
        where: pendingWhere,
        include: {
          student: true,
          feeStructure: true
        },
        orderBy: { paymentDate: 'desc' }
      });

      const totalExpected = structures.reduce((sum, s) => sum + s.finalFee, 0);
      const totalCollected = structures.reduce((sum, s) => sum + s.paidAmount, 0);
      const totalDue = structures.reduce((sum, s) => sum + s.dueAmount, 0);
      const totalPendingVerification = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      res.json({
        success: true,
        structures,
        pendingPayments,
        totalExpected,
        totalCollected,
        totalDue,
        totalPendingVerification
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch fee data', error: err.message });
    }
  }

  static async recordPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = Number(req.params.studentId);
      const { amount, paymentDate, paymentMode, referenceNo, remarks } = req.body;

      if (!amount || Number(amount) <= 0) {
        res.status(400).json({ success: false, message: 'A positive payment amount is required.' });
        return;
      }

      const feeStructure = await prisma.feeStructure.findFirst({
        where: { studentId },
        orderBy: { id: 'desc' }
      });

      if (!feeStructure) {
        res.status(404).json({ success: false, message: 'No fee structure found for student.' });
        return;
      }

      const totalPayments = await prisma.feePayment.count();
      let count = totalPayments + 1;
      let receiptNo = `REC-2026-${String(count).padStart(4, '0')}`;
      while (await prisma.feePayment.findUnique({ where: { receiptNo } })) {
        count++;
        receiptNo = `REC-2026-${String(count).padStart(4, '0')}`;
      }

      const payment = await prisma.feePayment.create({
        data: {
          receiptNo,
          feeStructureId: feeStructure.id,
          studentId,
          amount: Number(amount),
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMode: paymentMode || 'UPI',
          referenceNo: referenceNo?.trim() || null,
          remarks: remarks?.trim() || null,
          receivedById: req.user?.id || null,
          isVerified: true,
          verifiedAt: new Date(),
          submittedByStudent: false
        }
      });

      await FeeService.recalculateFeeStructure(feeStructure.id);

      res.status(201).json({
        success: true,
        message: `Payment of ₹${payment.amount} recorded. Official Receipt No: ${receiptNo}`,
        payment
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to record payment', error: err.message });
    }
  }

  static async studentSubmitPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const { amount, paymentDate, paymentMode, referenceNo, remarks } = req.body;
      if (!amount || Number(amount) <= 0) {
        res.status(400).json({ success: false, message: 'A valid payment amount is required.' });
        return;
      }

      const feeStructure = await prisma.feeStructure.findFirst({
        where: { studentId: student.id },
        orderBy: { id: 'desc' }
      });

      if (!feeStructure) {
        res.status(404).json({ success: false, message: 'No fee account found for your profile.' });
        return;
      }

      const totalPayments = await prisma.feePayment.count();
      let count = totalPayments + 1;
      let receiptNo = `REC-2026-${String(count).padStart(4, '0')}`;
      while (await prisma.feePayment.findUnique({ where: { receiptNo } })) {
        count++;
        receiptNo = `REC-2026-${String(count).padStart(4, '0')}`;
      }

      const payment = await prisma.feePayment.create({
        data: {
          receiptNo,
          feeStructureId: feeStructure.id,
          studentId: student.id,
          amount: Number(amount),
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMode: paymentMode || 'UPI',
          referenceNo: referenceNo?.trim() || null,
          remarks: remarks?.trim() || null,
          isVerified: false,
          submittedByStudent: true
        }
      });

      res.status(201).json({
        success: true,
        message: `Fee payment of ₹${payment.amount} submitted! Receipt will unlock once verified by mentor.`,
        payment
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to submit payment', error: err.message });
    }
  }

  static async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paymentId = Number(req.params.id);
      const payment = await prisma.feePayment.findUnique({ where: { id: paymentId } });

      if (!payment) {
        res.status(404).json({ success: false, message: 'Payment record not found.' });
        return;
      }

      await prisma.feePayment.update({
        where: { id: paymentId },
        data: {
          isVerified: true,
          verifiedAt: new Date(),
          receivedById: req.user?.id || null
        }
      });

      await FeeService.recalculateFeeStructure(payment.feeStructureId);

      res.json({
        success: true,
        message: `Fee payment #${payment.receiptNo} of ₹${payment.amount} verified successfully!`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Verification failed', error: err.message });
    }
  }

  static async batchVerify(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { paymentIds } = req.body;
      if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
        res.status(400).json({ success: false, message: 'No payments selected for batch verification.' });
        return;
      }

      const payments = await prisma.feePayment.findMany({
        where: {
          id: { in: paymentIds.map(Number) },
          isVerified: false
        }
      });

      const affectedStructures = new Set<number>();
      for (const p of payments) {
        await prisma.feePayment.update({
          where: { id: p.id },
          data: {
            isVerified: true,
            verifiedAt: new Date(),
            receivedById: req.user?.id || null
          }
        });
        affectedStructures.add(p.feeStructureId);
      }

      for (const fsId of affectedStructures) {
        await FeeService.recalculateFeeStructure(fsId);
      }

      res.json({
        success: true,
        message: `Successfully verified ${payments.length} fee payment(s)!`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Batch verification failed', error: err.message });
    }
  }

  static async rejectPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paymentId = Number(req.params.id);
      const payment = await prisma.feePayment.findUnique({ where: { id: paymentId } });

      if (!payment) {
        res.status(404).json({ success: false, message: 'Payment record not found.' });
        return;
      }

      const fsId = payment.feeStructureId;
      await prisma.feePayment.delete({ where: { id: paymentId } });
      await FeeService.recalculateFeeStructure(fsId);

      res.json({ success: true, message: `Fee submission of ₹${payment.amount} rejected and removed.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to reject payment', error: err.message });
    }
  }

  static async adjustStructure(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = Number(req.params.studentId);
      const { totalAnnualFee, discountAmount, discountReason } = req.body;

      let structure = await prisma.feeStructure.findFirst({
        where: { studentId },
        orderBy: { id: 'desc' }
      });

      if (!structure) {
        const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });
        structure = await prisma.feeStructure.create({
          data: {
            studentId,
            academicYear: student?.academicYear || '2026-2027',
            totalAnnualFee: Number(totalAnnualFee) || 25000,
            finalFee: Number(totalAnnualFee) || 25000,
            dueAmount: Number(totalAnnualFee) || 25000
          }
        });
      }

      await prisma.feeStructure.update({
        where: { id: structure.id },
        data: {
          totalAnnualFee: Number(totalAnnualFee),
          discountAmount: Number(discountAmount) || 0,
          discountReason: discountReason?.trim() || null
        }
      });

      const updated = await FeeService.recalculateFeeStructure(structure.id);

      res.json({ success: true, message: 'Fee structure updated successfully.', structure: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to adjust fee structure', error: err.message });
    }
  }

  static async getReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paymentId = Number(req.params.id);
      const payment = await prisma.feePayment.findUnique({
        where: { id: paymentId },
        include: {
          student: {
            include: { stream: true, user: true }
          },
          feeStructure: true,
          receivedBy: {
            select: { username: true, role: true }
          }
        }
      });

      if (!payment) {
        res.status(404).json({ success: false, message: 'Receipt not found.' });
        return;
      }

      // If student user is requesting, enforce ownership and verified status
      if (req.user?.role === 'student' && payment.studentId !== req.user.studentProfile?.id) {
        res.status(403).json({ success: false, message: 'Access denied to other students receipts.' });
        return;
      }

      if (req.user?.role === 'student' && !payment.isVerified) {
        res.status(403).json({ success: false, message: 'Receipt is locked awaiting mentor verification.' });
        return;
      }

      const settings = await prisma.instituteSettings.findFirst() || {
        name: 'NEGI TUTORIALS',
        tagline: 'Learn • Grow • Succeed',
        phone: '+91 98765 43210',
        email: 'contact@negitutorials.com',
        address: 'Plot 12, Sector 4, Main Road, New Delhi, India'
      };

      res.json({ success: true, payment, institute: settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch receipt', error: err.message });
    }
  }

  static async getStudentFees(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const feeStructures = await prisma.feeStructure.findMany({
        where: { studentId: student.id },
        include: {
          payments: {
            orderBy: { paymentDate: 'desc' }
          }
        },
        orderBy: { id: 'desc' }
      });

      const payments = await prisma.feePayment.findMany({
        where: { studentId: student.id },
        orderBy: { paymentDate: 'desc' }
      });

      res.json({
        success: true,
        latestStructure: feeStructures[0] || null,
        feeStructures,
        payments
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch student fees', error: err.message });
    }
  }
}
