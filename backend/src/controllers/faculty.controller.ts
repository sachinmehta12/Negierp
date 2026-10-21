import { Response } from 'express';
import { User, Subject, Stream, Op } from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AuthService } from '../services/auth.service';

export class FacultyController {
  static async list(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const faculty = await User.findAll({
        where: {
          role: { [Op.in]: ['mentor', 'owner'] }
        },
        include: [
          {
            model: Subject,
            as: 'assignedSubjects',
            include: [{ model: Stream, as: 'stream' }]
          }
        ],
        order: [['id', 'ASC']]
      });

      res.json({ success: true, count: faculty.length, faculty });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch faculty members', error: err.message });
    }
  }

  static async publicList(_req: any, res: Response): Promise<void> {
    try {
      const faculty = await User.findAll({
        where: {
          role: { [Op.in]: ['mentor', 'owner'] },
          isActive: true
        },
        attributes: ['id', 'username', 'role', 'designation', 'bio'],
        include: [
          {
            model: Subject,
            as: 'assignedSubjects',
            attributes: ['id', 'name', 'targetClass'],
            through: { attributes: [] }
          }
        ],
        order: [['id', 'ASC']]
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

      const existing = await User.findOne({
        where: {
          [Op.or]: [
            { username: username.trim() },
            { email: email.trim().toLowerCase() }
          ]
        }
      });

      if (existing) {
        res.status(400).json({ success: false, message: 'Username or email already in use.' });
        return;
      }

      const passwordHash = await AuthService.hashPassword(password);
      const chosenSubjectIds = Array.isArray(subjectIds) ? subjectIds.map((id: number) => Number(id)) : [];

      const mentor = await User.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: 'mentor',
        isActive: true,
        designation: designation ? designation.trim() : null,
        bio: bio ? bio.trim() : null
      });

      if (chosenSubjectIds.length > 0) {
        await (mentor as any).setAssignedSubjects(chosenSubjectIds);
      }

      const fullMentor = await User.findByPk(mentor.get('id'), {
        include: [{ model: Subject, as: 'assignedSubjects' }]
      });

      res.status(201).json({ success: true, message: `Faculty member "${mentor.get('username')}" created.`, mentor: fullMentor });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create faculty member', error: err.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const mentorId = Number(req.params.id);
      const { username, email, password, subjectIds, isActive, designation, bio } = req.body;

      const target = await User.findByPk(mentorId);
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

      await target.update(dataToUpdate);

      if (Array.isArray(subjectIds)) {
        await (target as any).setAssignedSubjects(subjectIds.map(Number));
      }

      const updated = await User.findByPk(mentorId, {
        include: [{ model: Subject, as: 'assignedSubjects' }]
      });

      res.json({ success: true, message: `Faculty member "${target.get('username')}" updated.`, mentor: updated });
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

      const target = await User.findByPk(mentorId);
      if (!target) {
        res.status(404).json({ success: false, message: 'Faculty member not found.' });
        return;
      }

      const newStatus = !target.get('isActive');
      await target.update({ isActive: newStatus });

      res.json({
        success: true,
        message: `Faculty member "${target.get('username')}" ${newStatus ? 'activated' : 'deactivated'}.`,
        isActive: newStatus
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

      const target = await User.findByPk(mentorId);
      if (!target || target.get('role') === 'owner') {
        res.status(400).json({ success: false, message: 'Cannot delete institute owner account.' });
        return;
      }

      const username = target.get('username');
      await target.destroy();

      res.json({ success: true, message: `Faculty member "${username}" deleted.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete faculty member', error: err.message });
    }
  }
}
