import { FeeStructure, FeePayment } from '../models';

export class FeeService {
  /**
   * Recalculates fee structure totals and status.
   * Crucial rule: ONLY verified payments (isVerified: true) reduce dueAmount and increase paidAmount.
   */
  static async recalculateFeeStructure(feeStructureId: number) {
    const feeStructure = await FeeStructure.findByPk(feeStructureId, {
      include: [{ model: FeePayment, as: 'payments' }]
    });

    if (!feeStructure) {
      throw new Error(`FeeStructure with id ${feeStructureId} not found`);
    }

    const fs = feeStructure.get({ plain: true });
    const discount = fs.discountAmount || 0;
    const finalFee = Math.max(0, fs.totalAnnualFee - discount);

    // Sum ONLY verified payments
    const verifiedPayments = (fs.payments || []).filter((p: any) => p.isVerified);
    const paidAmount = verifiedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const dueAmount = Math.max(0, finalFee - paidAmount);

    let status = 'Pending';
    if (dueAmount <= 0) {
      status = 'Paid';
    } else if (paidAmount > 0) {
      status = 'Partial';
    } else {
      status = 'Pending';
    }

    await feeStructure.update({
      finalFee,
      paidAmount,
      dueAmount,
      status
    });

    return feeStructure.get({ plain: true });
  }
}
