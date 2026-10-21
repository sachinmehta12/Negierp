import { Response } from 'express';
import { User, StudentProfile, Stream, Subject, StudentSubject, FeeStructure, sequelize, Op } from '../models';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { usernameOrEmail, password } = req.body;
      if (!usernameOrEmail || !password) {
        res.status(400).json({ success: false, message: 'Username/email and password are required.' });
        return;
      }

      const ident = usernameOrEmail.trim().toLowerCase();
      const userInstance = await User.findOne({
        where: {
          [Op.or]: [
            { username: ident },
            { email: ident }
          ]
        },
        include: [
          { model: Stream, as: 'stream' },
          {
            model: StudentProfile,
            as: 'studentProfile',
            include: [{ model: Stream, as: 'stream' }]
          },
          { model: Subject, as: 'assignedSubjects' }
        ]
      });

      if (!userInstance) {
        res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
        return;
      }

      const user = userInstance.get({ plain: true });

      const isMatch = await AuthService.comparePassword(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact administration.' });
        return;
      }

      const token = AuthService.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });

      res.json({
        success: true,
        message: `Welcome back, ${user.username}!`,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          designation: user.designation,
          stream: user.stream,
          studentProfile: user.studentProfile,
          assignedSubjects: user.assignedSubjects
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Login failed', error: err.message });
    }
  }

  static async registerStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        gender,
        contactNumber,
        parentName,
        parentContact,
        address,
        targetClass,
        streamId
      } = req.body;

      if (!username || !email || !password || !firstName || !lastName || !targetClass) {
        res.status(400).json({ success: false, message: 'Missing required student registration fields.' });
        return;
      }

      // Check duplicates
      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: username.trim() },
            { email: email.trim().toLowerCase() }
          ]
        }
      });

      if (existingUser) {
        res.status(400).json({ success: false, message: 'Username or email already exists.' });
        return;
      }

      const passwordHash = await AuthService.hashPassword(password);

      // Unique enrollment number NT-2026-XXX
      const totalCount = await StudentProfile.count();
      let count = totalCount + 1;
      let enrollmentNo = `NT-2026-${String(count).padStart(3, '0')}`;
      while (await StudentProfile.findOne({ where: { enrollmentNo } })) {
        count++;
        enrollmentNo = `NT-2026-${String(count).padStart(3, '0')}`;
      }

      const chosenClass = Number(targetClass);
      const chosenStreamId = (chosenClass === 10 || !streamId || streamId === 0) ? null : Number(streamId);

      // Create User & StudentProfile in transaction
      const newUser = await sequelize.transaction(async (t) => {
        const u = await User.create({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          role: 'student',
          isActive: true
        }, { transaction: t });

        const sp = await StudentProfile.create({
          userId: u.get('id'),
          enrollmentNo,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender: gender || null,
          contactNumber: contactNumber ? contactNumber.trim() : null,
          parentName: parentName ? parentName.trim() : null,
          parentContact: parentContact ? parentContact.trim() : null,
          address: address ? address.trim() : null,
          targetClass: chosenClass,
          academicYear: '2026-2027',
          streamId: chosenStreamId,
          notes: 'Self-registered via portal.'
        }, { transaction: t });

        // Default annual fee
        const classFeeMap: Record<number, number> = { 10: 22000, 11: 28000, 12: 32000 };
        const annualFee = classFeeMap[chosenClass] || 25000;

        await FeeStructure.create({
          studentId: sp.get('id'),
          academicYear: '2026-2027',
          totalAnnualFee: annualFee,
          discountAmount: 0.0,
          finalFee: annualFee,
          paidAmount: 0.0,
          dueAmount: annualFee,
          status: 'Pending'
        }, { transaction: t });

        // Auto-enroll in default subjects for this class/stream
        const subjectWhere: any = {
          targetClass: chosenClass,
          isActive: true
        };
        if (chosenClass !== 10 && chosenStreamId) {
          subjectWhere[Op.or] = [
            { streamId: chosenStreamId },
            { streamId: null }
          ];
        }

        const defaultSubjects = await Subject.findAll({
          where: subjectWhere,
          transaction: t
        });

        for (const subj of defaultSubjects) {
          await StudentSubject.create({
            studentId: sp.get('id'),
            subjectId: subj.get('id'),
            status: 'Active'
          }, { transaction: t });
        }

        return u;
      });

      const token = AuthService.generateToken({
        userId: newUser.get('id'),
        username: newUser.get('username'),
        email: newUser.get('email'),
        role: newUser.get('role')
      });

      res.status(201).json({
        success: true,
        message: `Student registration successful! Enrollment Number is ${enrollmentNo}.`,
        token,
        enrollmentNo
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
    }
  }

  static async registerMentor(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, streamId, subjectIds, designation } = req.body;
      if (!username || !email || !password) {
        res.status(400).json({ success: false, message: 'Username, email, and password are required.' });
        return;
      }

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: username.trim() },
            { email: email.trim().toLowerCase() }
          ]
        }
      });

      if (existingUser) {
        res.status(400).json({ success: false, message: 'Username or email already exists.' });
        return;
      }

      const passwordHash = await AuthService.hashPassword(password);
      const chosenStreamId = streamId && Number(streamId) > 0 ? Number(streamId) : null;

      let connectSubjectIds: number[] = [];
      if (Array.isArray(subjectIds) && subjectIds.length > 0) {
        connectSubjectIds = subjectIds.map((id: number) => Number(id));
      } else if (chosenStreamId) {
        const streamSubjects = await Subject.findAll({
          where: {
            isActive: true,
            [Op.or]: [
              { streamId: chosenStreamId },
              { streamId: null }
            ]
          },
          attributes: ['id']
        });
        connectSubjectIds = streamSubjects.map(s => s.get('id'));
      }

      const user = await User.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: 'mentor',
        isActive: true,
        streamId: chosenStreamId,
        designation: designation?.trim() || null
      });

      if (connectSubjectIds.length > 0) {
        await (user as any).setAssignedSubjects(connectSubjectIds);
      }

      const fullUser = await User.findByPk(user.get('id'), {
        include: [
          { model: Subject, as: 'assignedSubjects' },
          { model: Stream, as: 'stream' }
        ]
      });

      const token = AuthService.generateToken({
        userId: user.get('id'),
        username: user.get('username'),
        email: user.get('email'),
        role: user.get('role')
      });

      const streamName = fullUser && fullUser.get('stream') ? fullUser.get('stream').name : null;

      res.status(201).json({
        success: true,
        message: `Mentor registration successful for ${user.get('username')}!`,
        token,
        stream: streamName
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Mentor registration failed', error: err.message });
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Current and new password are required.' });
        return;
      }

      const user = await User.findByPk(req.user!.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const isMatch = await AuthService.comparePassword(currentPassword, user.get('passwordHash'));
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Incorrect current password.' });
        return;
      }

      const newHash = await AuthService.hashPassword(newPassword);
      await user.update({ passwordHash: newHash });

      res.json({ success: true, message: 'Your password has been updated successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to change password', error: err.message });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userInstance = await User.findByPk(req.user!.id, {
        include: [
          { model: Stream, as: 'stream' },
          {
            model: StudentProfile,
            as: 'studentProfile',
            include: [
              { model: Stream, as: 'stream' },
              {
                model: StudentSubject,
                as: 'subjectEnrollments',
                include: [{ model: Subject, as: 'subject' }]
              }
            ]
          },
          { model: Subject, as: 'assignedSubjects' }
        ]
      });

      if (!userInstance) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const user = userInstance.get({ plain: true });

      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          designation: user.designation,
          stream: user.stream,
          studentProfile: user.studentProfile,
          assignedSubjects: user.assignedSubjects
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Error fetching profile', error: err.message });
    }
  }
}
