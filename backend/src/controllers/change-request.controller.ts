import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class ChangeRequestController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const status = (req.query.status as string) || 'Pending';
      const requests = await prisma.subjectChangeRequest.findMany({
        where: { status },
        include: {
          student: {
            include: { user: true, stream: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, count: requests.length, requests });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch change requests', error: err.message });
    }
  }

  static async studentSubmit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const { requestType, details } = req.body;
      if (!requestType || !details) {
        res.status(400).json({ success: false, message: 'Request type and details are required.' });
        return;
      }

      const request = await prisma.subjectChangeRequest.create({
        data: {
          studentId: student.id,
          requestType: requestType.trim(),
          details: details.trim(),
          status: 'Pending'
        }
      });

      res.status(201).json({ success: true, message: 'Change request submitted to mentor for review.', request });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to submit change request', error: err.message });
    }
  }

  static async handleAction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const reqId = Number(req.params.id);
      const { action, mentorRemarks } = req.body; // 'approve' or 'reject'

      const changeReq = await prisma.subjectChangeRequest.findUnique({
        where: { id: reqId },
        include: { student: true }
      });

      if (!changeReq) {
        res.status(404).json({ success: false, message: 'Change request not found.' });
        return;
      }

      const isApprove = action === 'approve';

      await prisma.$transaction(async (tx) => {
        await tx.subjectChangeRequest.update({
          where: { id: reqId },
          data: {
            status: isApprove ? 'Approved' : 'Rejected',
            mentorRemarks: mentorRemarks?.trim() || null
          }
        });

        if (isApprove) {
          // Unlock student's stream and subject selection
          await tx.studentProfile.update({
            where: { id: changeReq.studentId },
            data: {
              isStreamLocked: false,
              isSubjectLocked: false
            }
          });
        }
      });

      res.json({
        success: true,
        message: isApprove
          ? `Request #${reqId} approved. Student unlocked for stream/subject re-selection.`
          : `Request #${reqId} rejected.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to process request', error: err.message });
    }
  }

  static async getStudentRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const requests = await prisma.subjectChangeRequest.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, requests });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch requests', error: err.message });
    }
  }
}
