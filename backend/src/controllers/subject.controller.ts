import { Response } from 'express';
import { Subject, Stream, User, StudentSubject, Exam, Op } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class SubjectController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const targetClass = req.query.class ? Number(req.query.class) : undefined;
      const streamId = req.query.streamId !== undefined && req.query.streamId !== '' ? Number(req.query.streamId) : undefined;

      const where: any = {};
      if (targetClass && [10, 11, 12].includes(targetClass)) {
        where.targetClass = targetClass;
      }
      if (streamId !== undefined && !isNaN(streamId)) {
        if (streamId === 0) {
          where.streamId = null;
        } else {
          where[Op.or] = [
            { streamId: streamId },
            { streamId: null }
          ];
        }
      }

      const subjects = await Subject.findAll({
        where,
        include: [
          { model: Stream, as: 'stream' },
          {
            model: User,
            as: 'assignedMentors',
            attributes: ['id', 'username', 'email'],
            through: { attributes: [] }
          },
          { model: StudentSubject, as: 'studentAssociations', attributes: ['id'] },
          { model: Exam, as: 'exams', attributes: ['id'] }
        ],
        order: [
          ['targetClass', 'ASC'],
          ['name', 'ASC']
        ]
      });

      const formatted = subjects.map(s => {
        const plain = s.get({ plain: true });
        return {
          ...plain,
          _count: {
            studentAssociations: plain.studentAssociations ? plain.studentAssociations.length : 0,
            exams: plain.exams ? plain.exams.length : 0
          }
        };
      });

      res.json({ success: true, count: formatted.length, subjects: formatted });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch subjects', error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, code, targetClass, streamId, monthlyFee, description, isActive } = req.body;
      if (!name || !code || !targetClass) {
        res.status(400).json({ success: false, message: 'Name, unique code, and class are required.' });
        return;
      }

      const existing = await Subject.findOne({
        where: { code: code.trim().toUpperCase() }
      });

      if (existing) {
        res.status(400).json({ success: false, message: 'Subject code already exists.' });
        return;
      }

      const chosenStreamId = streamId && streamId !== 0 ? Number(streamId) : null;

      const subject = await Subject.create({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        targetClass: Number(targetClass),
        streamId: chosenStreamId,
        monthlyFee: Number(monthlyFee) || 1500.0,
        description: description?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      });

      res.status(201).json({ success: true, message: `Subject "${subject.name}" added.`, subject });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create subject', error: err.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const subjectId = Number(req.params.id);
      const { name, code, targetClass, streamId, monthlyFee, description, isActive } = req.body;

      const subject = await Subject.findByPk(subjectId);
      if (!subject) {
        res.status(404).json({ success: false, message: 'Subject not found.' });
        return;
      }

      const chosenStreamId = streamId !== undefined ? (streamId === 0 ? null : Number(streamId)) : undefined;

      await subject.update({
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(targetClass && { targetClass: Number(targetClass) }),
        ...(chosenStreamId !== undefined && { streamId: chosenStreamId }),
        ...(monthlyFee !== undefined && { monthlyFee: Number(monthlyFee) }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      });

      res.json({ success: true, message: `Subject "${subject.name}" updated.`, subject });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update subject', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const subjectId = Number(req.params.id);
      await Subject.destroy({ where: { id: subjectId } });
      res.json({ success: true, message: 'Subject deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete subject', error: err.message });
    }
  }

  static async getMySubjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await User.findByPk(req.user!.id, {
        include: [
          {
            model: Subject,
            as: 'assignedSubjects',
            include: [{ model: Stream, as: 'stream' }]
          }
        ]
      });

      const plainUser = user ? user.get({ plain: true }) : null;
      res.json({ success: true, assignedSubjects: plainUser?.assignedSubjects || [] });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch assigned subjects', error: err.message });
    }
  }

  static async updateMySubjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { subjectIds } = req.body;
      if (!Array.isArray(subjectIds)) {
        res.status(400).json({ success: false, message: 'subjectIds must be an array.' });
        return;
      }

      const user = await User.findByPk(req.user!.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      await (user as any).setAssignedSubjects(subjectIds.map(Number));

      res.json({ success: true, message: `Teaching subjects updated (${subjectIds.length} subjects selected).` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update teaching subjects', error: err.message });
    }
  }
}
