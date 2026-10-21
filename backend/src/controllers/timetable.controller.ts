import { Response } from 'express';
import { Timetable, Subject, User, StudentSubject, Op } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class TimetableController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const viewMode = (req.query.view as string) || (req.user?.role === 'owner' ? 'class' : 'my');
      const targetClass = Number(req.query.class) || 10;

      const where: any = {};
      if (viewMode === 'my' && req.user?.role !== 'owner') {
        const assignedSubjectIds = req.user?.assignedSubjects?.map((s: any) => s.id) || [];
        where[Op.or] = [
          { subjectId: { [Op.in]: assignedSubjectIds } },
          { mentorId: req.user!.id },
          { mentorName: { [Op.like]: `%${req.user!.username}%` } }
        ];
      } else {
        where.targetClass = targetClass;
      }

      const slots = await Timetable.findAll({
        where,
        include: [
          { model: Subject, as: 'subject' },
          {
            model: User,
            as: 'mentor',
            attributes: ['username', 'email']
          }
        ],
        order: [['startTime', 'ASC']]
      });

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timetableByDay: Record<string, any[]> = {};
      for (const d of days) {
        timetableByDay[d] = slots.filter(s => s.get('dayOfWeek') === d);
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

      const slot = await Timetable.create({
        targetClass: Number(targetClass),
        dayOfWeek,
        subjectId: Number(subjectId),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        roomNo: roomNo?.trim() || 'Classroom A',
        mentorName: mentorName?.trim() || 'Er. S. Negi',
        mentorId: mentorId ? Number(mentorId) : req.user?.id || null
      });

      const fullSlot = await Timetable.findByPk(slot.get('id'), {
        include: [{ model: Subject, as: 'subject' }]
      });

      res.status(201).json({ success: true, message: 'Timetable slot created.', slot: fullSlot });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create timetable slot', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const slotId = Number(req.params.id);
      await Timetable.destroy({ where: { id: slotId } });
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

      const activeEnrollments = await StudentSubject.findAll({
        where: { studentId: student.id, status: 'Active' },
        attributes: ['subjectId']
      });
      const activeSubjIds = activeEnrollments.map(e => e.get('subjectId'));

      const where: any = { targetClass: student.targetClass };
      if (activeSubjIds.length > 0) {
        where.subjectId = { [Op.in]: activeSubjIds };
      }

      const slots = await Timetable.findAll({
        where,
        include: [{ model: Subject, as: 'subject' }],
        order: [['startTime', 'ASC']]
      });

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const timetableByDay: Record<string, any[]> = {};
      for (const d of days) {
        timetableByDay[d] = slots.filter(s => s.get('dayOfWeek') === d);
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
