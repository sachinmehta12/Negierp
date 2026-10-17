import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AnnouncementController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const targetClass = req.query.class as string;
      const where: any = { isActive: true };

      if (targetClass && targetClass !== 'All') {
        where.targetClass = { in: ['All', targetClass] };
      }

      const announcements = await prisma.announcement.findMany({
        where,
        include: {
          createdBy: { select: { username: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ success: true, count: announcements.length, announcements });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch announcements', error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, content, targetClass, priority } = req.body;
      if (!title || !content) {
        res.status(400).json({ success: false, message: 'Title and content are required.' });
        return;
      }

      const announcement = await prisma.announcement.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          targetClass: targetClass || 'All',
          priority: priority || 'Normal',
          createdById: req.user?.id || null
        }
      });

      res.status(201).json({ success: true, message: 'Announcement published successfully.', announcement });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create announcement', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const annId = Number(req.params.id);
      await prisma.announcement.delete({ where: { id: annId } });
      res.json({ success: true, message: 'Announcement deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete announcement', error: err.message });
    }
  }
}
