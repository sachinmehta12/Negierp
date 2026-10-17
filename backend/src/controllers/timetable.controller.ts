import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class TimetableController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const viewMode = (req.query.view as string) || (req.user?.role === 'owner' ? 'class' : 'my');
      const targetClass = Number(req.query.class) || 10;

      const where: any = {};
      if (viewMode === 'my' && req.user?.role !== 'owner') {
        const assignedSubjectIds = req.user?.assignedSubjects?.map((s: any) => s.id) || [];
        where.OR = [
          { subjectId: { in: assignedSubjectIds } },
          { mentorId: req.user!.id },
          { mentorName: { contains: req.user!.username } }
        ];
      } else {
        where.targetClass = targetClass;
      }

      const slots = await prisma.timetable.findMany({
        where,
        include: {
          subject: true,
          mentor: { select: { username: true, email: true } }
        },
        orderBy: { startTime: 'asc' }
      });

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timetableByDay: Record<string, any[]> = {};
      for (const d of days) {
        timetableByDay[d] = slots.filter(s => s.dayOfWeek === d);
      }

      res.json({
        success: true,
        viewMode,
        targetClass,
        days,
        timetableByDay
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch timetable', error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { targetClass, dayOfWeek, subjectId, startTime, endTime, roomNo, mentorName, mentorId } = req.body;
      if (!targetClass || !dayOfWeek || !subjectId || !startTime || !endTime) {
        res.status(400).json({ success: false, message: 'Required fields missing for timetable slot.' });
        return;
      }

      const slot = await prisma.timetable.create({
        data: {
          targetClass: Number(targetClass),
          dayOfWeek,
          subjectId: Number(subjectId),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          roomNo: roomNo?.trim() || 'Classroom A',
          mentorName: mentorName?.trim() || 'Er. S. Negi',
          mentorId: mentorId ? Number(mentorId) : req.user?.id || null
        },
        include: { subject: true }
      });

      res.status(201).json({ success: true, message: 'Timetable slot created.', slot });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create timetable slot', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const slotId = Number(req.params.id);
      await prisma.timetable.delete({ where: { id: slotId } });
      res.json({ success: true, message: 'Timetable slot deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete timetable slot', error: err.message });
    }
  }

  static async getStudentTimetable(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const slots = await prisma.timetable.findMany({
        where,
        include: { subject: true },
        orderBy: { startTime: 'asc' }
      });

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timetableByDay: Record<string, any[]> = {};
      for (const d of days) {
        timetableByDay[d] = slots.filter(s => s.dayOfWeek === d);
      }

      res.json({
        success: true,
        targetClass: student.targetClass,
        days,
        timetableByDay
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch student timetable', error: err.message });
    }
  }
}
