import { Response } from 'express';
import { FeeStructure, FeePayment, StudentProfile, User, Stream, InstituteSettings } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { FeeService } from '../services/fee.service';

export class FeeController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const classFilter = req.query.class ? Number(req.query.class) : undefined;
      const statusFilter = (req.query.status as string) || 'all';

      const studentWhere: any = {};
      if (classFilter && [10, 11, 12].includes(classFilter)) {
        studentWhere.targetClass = classFilter;
      }

      const structureWhere: any = {};
      if (statusFilter !== 'all') {
        structureWhere.status = statusFilter;
      }

      const structuresData = await FeeStructure.findAll({
        where: structureWhere,
        include: [
          {
            model: StudentProfile,
            as: 'student',
            where: studentWhere,
            include: [
              { model: User, as: 'user', where: { isActive: true } },
              { model: Stream, as: 'stream' }
            ]
          },
          {
            model: FeePayment,
            as: 'payments'
          }
        ],
        order: [['dueAmount', 'DESC']]
      });

      const structures = structuresData.map(s => s.get({ plain: true }));

      // Pending payments awaiting verification
      const pendingData = await FeePayment.findAll({
        where: { isVerified: false },
        include: [
          {
            model: StudentProfile,
            as: 'student',
            where: studentWhere,
            include: [{ model: User, as: 'user', where: { isActive: true } }]
          },
          { model: FeeStructure, as: 'feeStructure' }
        ],
        order: [['paymentDate', 'DESC']]
      });

      const pendingPayments = pendingData.map(p => p.get({ plain: true }));

      const totalExpected = structures.reduce((sum: number, s: any) => sum + Number(s.finalFee), 0);
      const totalCollected = structures.reduce((sum: number, s: any) => sum + Number(s.paidAmount), 0);
      const totalDue = structures.reduce((sum: number, s: any) => sum + Number(s.dueAmount), 0);
      const totalPendingVerification = pendingPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

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

      const feeStructure = await FeeStructure.findOne({
        where: { studentId },
        order: [['id', 'DESC']]
      });

      if (!feeStructure) {
        res.status(404).json({ success: false, message: 'No fee structure found for student.' });
        return;
      }

      const totalPayments = await FeePayment.count();
      let count = totalPayments + 1;
      let receiptNo = `REC-2026-${String(count).padStart(4, '0')}`;
      while (await FeePayment.findOne({ where: { receiptNo } })) {
        count++;
        receiptNo = `REC-2026-${String(count).padStart(4, '0')}`;
      }

      const payment = await FeePayment.create({
        receiptNo,
        feeStructureId: feeStructure.get('id'),
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
      });

      await FeeService.recalculateFeeStructure(feeStructure.get('id'));

      res.status(201).json({
        success: true,
        message: `Payment of ₹${payment.get('amount')} recorded. Official Receipt No: ${receiptNo}`,
        payment: payment.get({ plain: true })
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

      const feeStructure = await FeeStructure.findOne({
        where: { studentId: student.id },
        order: [['id', 'DESC']]
      });

      if (!feeStructure) {
        res.status(404).json({ success: false, message: 'No fee account found for your profile.' });
        return;
      }

      const totalPayments = await FeePayment.count();
      let count = totalPayments + 1;
      let receiptNo = `REC-2026-${String(count).padStart(4, '0')}`;
      while (await FeePayment.findOne({ where: { receiptNo } })) {
        count++;
        receiptNo = `REC-2026-${String(count).padStart(4, '0')}`;
      }

      const payment = await FeePayment.create({
        receiptNo,
        feeStructureId: feeStructure.get('id'),
        studentId: student.id,
        amount: Number(amount),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMode: paymentMode || 'UPI',
        referenceNo: referenceNo?.trim() || null,
        remarks: remarks?.trim() || null,
        isVerified: false,
        submittedByStudent: true
      });

      res.status(201).json({
        success: true,
        message: `Fee payment of ₹${payment.get('amount')} submitted! Receipt will unlock once verified by mentor.`,
        payment: payment.get({ plain: true })
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to submit payment', error: err.message });
    }
  }

  static async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paymentId = Number(req.params.id);
      const payment = await FeePayment.findByPk(paymentId);

      if (!payment) {
        res.status(404).json({ success: false, message: 'Payment record not found.' });
        return;
      }

      await payment.update({
        isVerified: true,
        verifiedAt: new Date(),
        receivedById: req.user?.id || null
      });

      await FeeService.recalculateFeeStructure(payment.get('feeStructureId'));

      res.json({
        success: true,
        message: `Fee payment #${payment.get('receiptNo')} of ₹${payment.get('amount')} verified successfully!`
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

      const payments = await FeePayment.findAll({
        where: {
          id: paymentIds.map(Number),
          isVerified: false
        }
      });

      const affectedStructures = new Set<number>();
      for (const p of payments) {
        await p.update({
          isVerified: true,
          verifiedAt: new Date(),
          receivedById: req.user?.id || null
        });
        affectedStructures.add(p.get('feeStructureId'));
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
      const payment = await FeePayment.findByPk(paymentId);

      if (!payment) {
        res.status(404).json({ success: false, message: 'Payment record not found.' });
        return;
      }

      const fsId = payment.get('feeStructureId');
      const amount = payment.get('amount');
      await payment.destroy();
      await FeeService.recalculateFeeStructure(fsId);

      res.json({ success: true, message: `Fee submission of ₹${amount} rejected and removed.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to reject payment', error: err.message });
    }
  }

  static async adjustStructure(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = Number(req.params.studentId);
      const { totalAnnualFee, discountAmount, discountReason } = req.body;

      let structure = await FeeStructure.findOne({
        where: { studentId },
        order: [['id', 'DESC']]
      });

      if (!structure) {
        const student = await StudentProfile.findByPk(studentId);
        structure = await FeeStructure.create({
          studentId,
          academicYear: student?.get('academicYear') || '2026-2027',
          totalAnnualFee: Number(totalAnnualFee) || 25000,
          finalFee: Number(totalAnnualFee) || 25000,
          dueAmount: Number(totalAnnualFee) || 25000
        });
      }

      await structure.update({
        totalAnnualFee: Number(totalAnnualFee),
        discountAmount: Number(discountAmount) || 0,
        discountReason: discountReason?.trim() || null
      });

      const updated = await FeeService.recalculateFeeStructure(structure.get('id'));

      res.json({ success: true, message: 'Fee structure updated successfully.', structure: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to adjust fee structure', error: err.message });
    }
  }

  static async getReceipt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const paymentId = Number(req.params.id);
      const paymentData = await FeePayment.findByPk(paymentId, {
        include: [
          {
            model: StudentProfile,
            as: 'student',
            include: [{ model: Stream, as: 'stream' }, { model: User, as: 'user' }]
          },
          { model: FeeStructure, as: 'feeStructure' },
          {
            model: User,
            as: 'receivedBy',
            attributes: ['username', 'role']
          }
        ]
      });

      if (!paymentData) {
        res.status(404).json({ success: false, message: 'Receipt not found.' });
        return;
      }

      const payment = paymentData.get({ plain: true });

      // If student user is requesting, enforce ownership and verified status
      if (req.user?.role === 'student' && payment.studentId !== req.user.studentProfile?.id) {
        res.status(403).json({ success: false, message: 'Access denied to other students receipts.' });
        return;
      }

      if (req.user?.role === 'student' && !payment.isVerified) {
        res.status(403).json({ success: false, message: 'Receipt is locked awaiting mentor verification.' });
        return;
      }

      const settingsInstance = await InstituteSettings.findOne();
      const settings = settingsInstance ? settingsInstance.get({ plain: true }) : {
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

      const feeStructures = await FeeStructure.findAll({
        where: { studentId: student.id },
        include: [
          {
            model: FeePayment,
            as: 'payments'
          }
        ],
        order: [['id', 'DESC']]
      });

      const payments = await FeePayment.findAll({
        where: { studentId: student.id },
        order: [['paymentDate', 'DESC']]
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
