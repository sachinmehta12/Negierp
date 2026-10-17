import { prisma } from '../config/prisma';

export class FeeService {
  /**
   * Recalculates fee structure totals and status.
   * Crucial rule: ONLY verified payments (isVerified: true) reduce dueAmount and increase paidAmount.
   */
  static async recalculateFeeStructure(feeStructureId: number) {
    const feeStructure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
      include: { payments: true }
    });

    if (!feeStructure) {
      throw new Error(`FeeStructure with id ${feeStructureId} not found`);
    }

    const discount = feeStructure.discountAmount || 0;
    const finalFee = Math.max(0, feeStructure.totalAnnualFee - discount);

    // Sum ONLY verified payments
    const verifiedPayments = feeStructure.payments.filter(p => p.isVerified);
    const paidAmount = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
    const dueAmount = Math.max(0, finalFee - paidAmount);

    let status = 'Pending';
    if (dueAmount <= 0) {
      status = 'Paid';
    } else if (paidAmount > 0) {
      status = 'Partial';
    } else {
      status = 'Pending';
    }

    return prisma.feeStructure.update({
      where: { id: feeStructureId },
      data: {
        finalFee,
        paidAmount,
        dueAmount,
        status
      }
    });
  }
}
