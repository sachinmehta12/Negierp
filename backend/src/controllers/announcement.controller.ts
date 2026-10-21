import { Response } from 'express';
import { Announcement, User, Op } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AnnouncementController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const targetClass = req.query.class as string;
      const where: any = { isActive: true };

      if (targetClass && targetClass !== 'All') {
        where.targetClass = { [Op.in]: ['All', targetClass] };
      }

      const announcements = await Announcement.findAll({
        where,
        include: [
          {
            model: User,
            as: 'createdBy',
            attributes: ['username', 'role']
          }
        ],
        order: [['createdAt', 'DESC']]
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

      const announcement = await Announcement.create({
        title: title.trim(),
        content: content.trim(),
        targetClass: targetClass || 'All',
        priority: priority || 'Normal',
        createdById: req.user?.id || null
      });

      res.status(201).json({ success: true, message: 'Announcement published successfully.', announcement });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create announcement', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const annId = Number(req.params.id);
      await Announcement.destroy({ where: { id: annId } });
      res.json({ success: true, message: 'Announcement deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete announcement', error: err.message });
    }
  }
}
