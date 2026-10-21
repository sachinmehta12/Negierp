import { Response } from 'express';
import { Stream, Subject, StudentProfile } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class StreamController {
  static async list(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const streams = await Stream.findAll({
        include: [
          { model: Subject, as: 'subjects' },
          { model: StudentProfile, as: 'students', attributes: ['id'] }
        ],
        order: [['name', 'ASC']]
      });

      const formatted = streams.map(s => {
        const plain = s.get({ plain: true });
        return {
          ...plain,
          _count: {
            students: plain.students ? plain.students.length : 0,
            subjects: plain.subjects ? plain.subjects.length : 0
          }
        };
      });

      res.json({ success: true, streams: formatted });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch streams', error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, code, applicableClasses, description, isActive } = req.body;
      if (!name || !code) {
        res.status(400).json({ success: false, message: 'Stream name and unique code are required.' });
        return;
      }

      const stream = await Stream.create({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        applicableClasses: applicableClasses || '11,12',
        description: description?.trim() || null,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      });

      res.status(201).json({ success: true, message: `Stream "${stream.name}" created.`, stream });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create stream', error: err.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const streamId = Number(req.params.id);
      const { name, code, applicableClasses, description, isActive } = req.body;

      const stream = await Stream.findByPk(streamId);
      if (!stream) {
        res.status(404).json({ success: false, message: 'Stream not found.' });
        return;
      }

      await stream.update({
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        ...(applicableClasses !== undefined && { applicableClasses }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      });

      res.json({ success: true, message: `Stream "${stream.name}" updated.`, stream });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update stream', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const streamId = Number(req.params.id);
      await Stream.destroy({ where: { id: streamId } });
      res.json({ success: true, message: 'Stream deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete stream', error: err.message });
    }
  }
}
