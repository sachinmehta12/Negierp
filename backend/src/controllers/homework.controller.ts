import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class HomeworkController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const classFilter = req.query.class ? Number(req.query.class) : undefined;
      const subjectFilter = req.query.subjectId ? Number(req.query.subjectId) : undefined;

      const where: any = {};
      if (classFilter && [10, 11, 12].includes(classFilter)) {
        where.targetClass = classFilter;
      }

      if (req.user?.role === 'mentor') {
        const mentor = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { assignedSubjects: { select: { id: true } } }
        });
        const mentorSubjectIds = mentor?.assignedSubjects.map(s => s.id) || [];
        if (subjectFilter) {
          if (!mentorSubjectIds.includes(subjectFilter)) {
            res.status(403).json({ success: false, message: 'Access Denied: You are not assigned to this subject.' });
            return;
          }
          where.subjectId = subjectFilter;
        } else {
          where.subjectId = { in: mentorSubjectIds };
        }
      } else if (subjectFilter) {
        where.subjectId = subjectFilter;
      }

      const homework = await prisma.homework.findMany({
        where,
        include: {
          subject: true,
          assignedBy: { select: { username: true } },
          statuses: {
            include: { student: true }
          }
        },
        orderBy: { dueDate: 'desc' }
      });

      res.json({ success: true, count: homework.length, homework });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch homework', error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, description, targetClass, subjectId, dueDate } = req.body;
      if (!title || !description || !targetClass || !subjectId || !dueDate) {
        res.status(400).json({ success: false, message: 'All homework fields are required.' });
        return;
      }

      if (req.user?.role === 'mentor') {
        const mentor = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { assignedSubjects: { select: { id: true } } }
        });
        const mentorSubjectIds = mentor?.assignedSubjects.map(s => s.id) || [];
        if (!mentorSubjectIds.includes(Number(subjectId))) {
          res.status(403).json({
            success: false,
            message: 'Access Denied: You cannot assign homework for a subject you do not teach.'
          });
          return;
        }
      }

      const hw = await prisma.homework.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          targetClass: Number(targetClass),
          subjectId: Number(subjectId),
          dueDate: new Date(dueDate),
          assignedById: req.user?.id || null
        },
        include: { subject: true }
      });

      res.status(201).json({ success: true, message: 'Homework assigned successfully.', homework: hw });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to assign homework', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const hwId = Number(req.params.id);
      await prisma.homework.delete({ where: { id: hwId } });
      res.json({ success: true, message: 'Homework deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete homework', error: err.message });
    }
  }

  static async toggleStudentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const hwId = Number(req.params.id);
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const hw = await prisma.homework.findUnique({ where: { id: hwId } });
      if (!hw) {
        res.status(404).json({ success: false, message: 'Homework assignment not found.' });
        return;
      }

      const isLate = new Date() > new Date(hw.dueDate);
      const statusStr = isLate ? 'Late' : 'Completed';

      const status = await prisma.studentHomeworkStatus.upsert({
        where: {
          uq_student_homework: {
            homeworkId: hwId,
            studentId: student.id
          }
        },
        update: {
          status: statusStr,
          completionDate: new Date()
        },
        create: {
          homeworkId: hwId,
          studentId: student.id,
          status: statusStr,
          completionDate: new Date()
        }
      });

      res.json({ success: true, message: `Assignment marked as ${statusStr}!`, status });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update assignment status', error: err.message });
    }
  }

  static async getStudentHomework(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const activeEnrollments = await prisma.studentSubject.findMany({
        where: { studentId: student.id, status: 'Active' },
        select: { subjectId: true }
      });
      const activeSubjIds = activeEnrollments.map(e => e.subjectId);

      const where: any = { targetClass: student.targetClass };
      if (activeSubjIds.length > 0) {
        where.subjectId = { in: activeSubjIds };
      }

      const homework = await prisma.homework.findMany({
        where,
        include: {
          subject: true,
          statuses: {
            where: { studentId: student.id }
          }
        },
        orderBy: { dueDate: 'desc' }
      });

      const formatted = homework.map(h => ({
        ...h,
        myStatus: h.statuses[0] || null
      }));

      res.json({ success: true, homework: formatted });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch homework', error: err.message });
    }
  }
}
