import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class StreamController {
  static async list(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const streams = await prisma.stream.findMany({
        include: {
          subjects: true,
          _count: {
            select: { students: true, subjects: true }
          }
        },
        orderBy: { name: 'asc' }
      });
      res.json({ success: true, streams });
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

      const stream = await prisma.stream.create({
        data: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          applicableClasses: applicableClasses || '11,12',
          description: description?.trim() || null,
          isActive: isActive !== undefined ? Boolean(isActive) : true
        }
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

      const stream = await prisma.stream.update({
        where: { id: streamId },
        data: {
          ...(name && { name: name.trim() }),
          ...(code && { code: code.trim().toUpperCase() }),
          ...(applicableClasses !== undefined && { applicableClasses }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) })
        }
      });

      res.json({ success: true, message: `Stream "${stream.name}" updated.`, stream });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update stream', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const streamId = Number(req.params.id);
      await prisma.stream.delete({ where: { id: streamId } });
      res.json({ success: true, message: 'Stream deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete stream', error: err.message });
    }
  }
}
