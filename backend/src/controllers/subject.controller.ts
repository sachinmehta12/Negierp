import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class SubjectController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const targetClass = req.query.class ? Number(req.query.class) : undefined;
      const streamId = req.query.streamId ? Number(req.query.streamId) : undefined;

      const where: any = {};
      if (targetClass && [10, 11, 12].includes(targetClass)) {
        where.targetClass = targetClass;
      }
      if (streamId !== undefined) {
        if (streamId === 0) {
          where.streamId = null;
        } else {
          where.OR = [
            { streamId: streamId },
            { streamId: null }
          ];
        }
      }

      const subjects = await prisma.subject.findMany({
        where,
        include: {
          stream: true,
          assignedMentors: {
            select: { id: true, username: true, email: true }
          },
          _count: {
            select: { studentAssociations: true, exams: true }
          }
        },
        orderBy: [
          { targetClass: 'asc' },
          { name: 'asc' }
        ]
      });

      res.json({ success: true, count: subjects.length, subjects });
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

      const existing = await prisma.subject.findUnique({
        where: { code: code.trim().toUpperCase() }
      });

      if (existing) {
        res.status(400).json({ success: false, message: 'Subject code already exists.' });
        return;
      }

      const chosenStreamId = streamId && streamId !== 0 ? Number(streamId) : null;

      const subject = await prisma.subject.create({
        data: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          targetClass: Number(targetClass),
          streamId: chosenStreamId,
          monthlyFee: Number(monthlyFee) || 1500.0,
          description: description?.trim() || null,
          isActive: isActive !== undefined ? Boolean(isActive) : true
        }
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

      const chosenStreamId = streamId !== undefined ? (streamId === 0 ? null : Number(streamId)) : undefined;

      const subject = await prisma.subject.update({
        where: { id: subjectId },
        data: {
          ...(name && { name: name.trim() }),
          ...(code && { code: code.trim().toUpperCase() }),
          ...(targetClass && { targetClass: Number(targetClass) }),
          ...(chosenStreamId !== undefined && { streamId: chosenStreamId }),
          ...(monthlyFee !== undefined && { monthlyFee: Number(monthlyFee) }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) })
        }
      });

      res.json({ success: true, message: `Subject "${subject.name}" updated.`, subject });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update subject', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const subjectId = Number(req.params.id);
      await prisma.subject.delete({ where: { id: subjectId } });
      res.json({ success: true, message: 'Subject deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete subject', error: err.message });
    }
  }

  static async getMySubjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          assignedSubjects: {
            include: { stream: true }
          }
        }
      });

      res.json({ success: true, assignedSubjects: user?.assignedSubjects || [] });
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

      await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          assignedSubjects: {
            set: subjectIds.map((id: number) => ({ id: Number(id) }))
          }
        }
      });

      res.json({ success: true, message: `Teaching subjects updated (${subjectIds.length} subjects selected).` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update teaching subjects', error: err.message });
    }
  }
}
