import { Response } from 'express';
import { SubjectChangeRequest, StudentProfile, User, Stream, sequelize } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class ChangeRequestController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const status = (req.query.status as string) || 'Pending';
      const requests = await SubjectChangeRequest.findAll({
        where: { status },
        include: [
          {
            model: StudentProfile,
            as: 'student',
            include: [
              { model: User, as: 'user' },
              { model: Stream, as: 'stream' }
            ]
          }
        ],
        order: [['createdAt', 'DESC']]
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

      const request = await SubjectChangeRequest.create({
        studentId: student.id,
        requestType: requestType.trim(),
        details: details.trim(),
        status: 'Pending'
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

      const changeReq = await SubjectChangeRequest.findByPk(reqId, {
        include: [{ model: StudentProfile, as: 'student' }]
      });

      if (!changeReq) {
        res.status(404).json({ success: false, message: 'Change request not found.' });
        return;
      }

      const isApprove = action === 'approve';

      await sequelize.transaction(async (t) => {
        await changeReq.update(
          {
            status: isApprove ? 'Approved' : 'Rejected',
            mentorRemarks: mentorRemarks?.trim() || null
          },
          { transaction: t }
        );

        if (isApprove) {
          await StudentProfile.update(
            {
              isStreamLocked: false,
              isSubjectLocked: false
            },
            {
              where: { id: changeReq.get('studentId') },
              transaction: t
            }
          );
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

      const requests = await SubjectChangeRequest.findAll({
        where: { studentId: student.id },
        order: [['createdAt', 'DESC']]
      });

      res.json({ success: true, requests });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch requests', error: err.message });
    }
  }
}
