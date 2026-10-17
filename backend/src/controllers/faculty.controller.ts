import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AuthService } from '../services/auth.service';

export class FacultyController {
  static async list(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const faculty = await prisma.user.findMany({
        where: {
          role: { in: ['mentor', 'owner'] }
        },
        include: {
          assignedSubjects: {
            include: { stream: true }
          }
        },
        orderBy: { id: 'asc' }
      });

      res.json({ success: true, count: faculty.length, faculty });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch faculty members', error: err.message });
    }
  }

  static async publicList(_req: any, res: Response): Promise<void> {
    try {
      const faculty = await prisma.user.findMany({
        where: {
          role: { in: ['mentor', 'owner'] },
          isActive: true
        },
        select: {
          id: true,
          username: true,
          role: true,
          designation: true,
          bio: true,
          assignedSubjects: {
            select: { id: true, name: true, targetClass: true }
          }
        },
        orderBy: { id: 'asc' }
      });

      res.json({ success: true, count: faculty.length, faculty });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch public mentors', error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, subjectIds, designation, bio } = req.body;
      if (!username || !email || !password) {
        res.status(400).json({ success: false, message: 'Username, email, and password are required.' });
        return;
      }

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: username.trim() } },
            { email: { equals: email.trim() } }
          ]
        }
      });

      if (existing) {
        res.status(400).json({ success: false, message: 'Username or email already in use.' });
        return;
      }

      const passwordHash = await AuthService.hashPassword(password);
      const chosenSubjectIds = Array.isArray(subjectIds) ? subjectIds.map((id: number) => ({ id: Number(id) })) : [];

      const mentor = await prisma.user.create({
        data: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          role: 'mentor',
          isActive: true,
          designation: designation ? designation.trim() : null,
          bio: bio ? bio.trim() : null,
          assignedSubjects: {
            connect: chosenSubjectIds
          }
        },
        include: { assignedSubjects: true }
      });

      res.status(201).json({ success: true, message: `Faculty member "${mentor.username}" created.`, mentor });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create faculty member', error: err.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const mentorId = Number(req.params.id);
      const { username, email, password, subjectIds, isActive, designation, bio } = req.body;

      const target = await prisma.user.findUnique({ where: { id: mentorId } });
      if (!target) {
        res.status(404).json({ success: false, message: 'Faculty member not found.' });
        return;
      }

      const dataToUpdate: any = {};
      if (username) dataToUpdate.username = username.trim();
      if (email) dataToUpdate.email = email.trim().toLowerCase();
      if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
      if (designation !== undefined) dataToUpdate.designation = designation ? designation.trim() : null;
      if (bio !== undefined) dataToUpdate.bio = bio ? bio.trim() : null;

      if (password && password.trim()) {
        dataToUpdate.passwordHash = await AuthService.hashPassword(password.trim());
      }

      if (Array.isArray(subjectIds)) {
        dataToUpdate.assignedSubjects = {
          set: subjectIds.map((id: number) => ({ id: Number(id) }))
        };
      }

      const updated = await prisma.user.update({
        where: { id: mentorId },
        data: dataToUpdate,
        include: { assignedSubjects: true }
      });

      res.json({ success: true, message: `Faculty member "${updated.username}" updated.`, mentor: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update faculty member', error: err.message });
    }
  }

  static async toggleActive(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const mentorId = Number(req.params.id);
      if (mentorId === req.user?.id) {
        res.status(400).json({ success: false, message: 'Cannot deactivate your own administrator account.' });
        return;
      }

      const target = await prisma.user.findUnique({ where: { id: mentorId } });
      if (!target) {
        res.status(404).json({ success: false, message: 'Faculty member not found.' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: mentorId },
        data: { isActive: !target.isActive }
      });

      res.json({
        success: true,
        message: `Faculty member "${updated.username}" ${updated.isActive ? 'activated' : 'deactivated'}.`,
        isActive: updated.isActive
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to toggle status', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const mentorId = Number(req.params.id);
      if (mentorId === req.user?.id) {
        res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
        return;
      }

      const target = await prisma.user.findUnique({ where: { id: mentorId } });
      if (!target || target.role === 'owner') {
        res.status(400).json({ success: false, message: 'Cannot delete institute owner account.' });
        return;
      }

      await prisma.user.delete({ where: { id: mentorId } });

      res.json({ success: true, message: `Faculty member "${target.username}" deleted.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete faculty member', error: err.message });
    }
  }
}
