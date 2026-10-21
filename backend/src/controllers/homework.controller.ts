import { Response } from 'express';
import { Homework, Subject, User, StudentHomeworkStatus, StudentProfile, StudentSubject, Op } from '../models';
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
        const mentor = await User.findByPk(req.user.id, {
          include: [{ model: Subject, as: 'assignedSubjects', attributes: ['id'] }]
        });
        const mentorSubjects = mentor ? mentor.get('assignedSubjects') || [] : [];
        const mentorSubjectIds = mentorSubjects.map((s: any) => s.id);

        if (subjectFilter) {
          if (!mentorSubjectIds.includes(subjectFilter)) {
            res.status(403).json({ success: false, message: 'Access Denied: You are not assigned to this subject.' });
            return;
          }
          where.subjectId = subjectFilter;
        } else {
          where.subjectId = { [Op.in]: mentorSubjectIds };
        }
      } else if (subjectFilter) {
        where.subjectId = subjectFilter;
      }

      const homework = await Homework.findAll({
        where,
        include: [
          { model: Subject, as: 'subject' },
          {
            model: User,
            as: 'assignedBy',
            attributes: ['username']
          },
          {
            model: StudentHomeworkStatus,
            as: 'statuses',
            include: [{ model: StudentProfile, as: 'student' }]
          }
        ],
        order: [['dueDate', 'DESC']]
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
        const mentor = await User.findByPk(req.user.id, {
          include: [{ model: Subject, as: 'assignedSubjects', attributes: ['id'] }]
        });
        const mentorSubjects = mentor ? mentor.get('assignedSubjects') || [] : [];
        const mentorSubjectIds = mentorSubjects.map((s: any) => s.id);

        if (!mentorSubjectIds.includes(Number(subjectId))) {
          res.status(403).json({
            success: false,
            message: 'Access Denied: You cannot assign homework for a subject you do not teach.'
          });
          return;
        }
      }

      const hw = await Homework.create({
        title: title.trim(),
        description: description.trim(),
        targetClass: Number(targetClass),
        subjectId: Number(subjectId),
        dueDate: new Date(dueDate),
        assignedById: req.user?.id || null
      });

      const fullHw = await Homework.findByPk(hw.get('id'), {
        include: [{ model: Subject, as: 'subject' }]
      });

      res.status(201).json({ success: true, message: 'Homework assigned successfully.', homework: fullHw });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to assign homework', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const hwId = Number(req.params.id);
      await Homework.destroy({ where: { id: hwId } });
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

      const hw = await Homework.findByPk(hwId);
      if (!hw) {
        res.status(404).json({ success: false, message: 'Homework assignment not found.' });
        return;
      }

      const isLate = new Date() > new Date(hw.get('dueDate'));
      const statusStr = isLate ? 'Late' : 'Completed';

      let statusRecord = await StudentHomeworkStatus.findOne({
        where: {
          homeworkId: hwId,
          studentId: student.id
        }
      });

      if (statusRecord) {
        await statusRecord.update({
          status: statusStr,
          completionDate: new Date()
        });
      } else {
        statusRecord = await StudentHomeworkStatus.create({
          homeworkId: hwId,
          studentId: student.id,
          status: statusStr,
          completionDate: new Date()
        });
      }

      res.json({ success: true, message: `Assignment marked as ${statusStr}!`, status: statusRecord });
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

      const activeEnrollments = await StudentSubject.findAll({
        where: { studentId: student.id, status: 'Active' },
        attributes: ['subjectId']
      });
      const activeSubjIds = activeEnrollments.map(e => e.get('subjectId'));

      const where: any = { targetClass: student.targetClass };
      if (activeSubjIds.length > 0) {
        where.subjectId = { [Op.in]: activeSubjIds };
      }

      const homework = await Homework.findAll({
        where,
        include: [
          { model: Subject, as: 'subject' },
          {
            model: StudentHomeworkStatus,
            as: 'statuses',
            where: { studentId: student.id },
            required: false
          }
        ],
        order: [['dueDate', 'DESC']]
      });

      const formatted = homework.map(h => {
        const plain = h.get({ plain: true });
        return {
          ...plain,
          myStatus: plain.statuses && plain.statuses.length > 0 ? plain.statuses[0] : null
        };
      });

      res.json({ success: true, homework: formatted });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch homework', error: err.message });
    }
  }
}
