import { Response } from 'express';
import { prisma } from '../config/prisma';
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
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: ident } },
            { email: { equals: ident } }
          ]
        },
        include: {
          stream: true,
          studentProfile: {
            include: { stream: true }
          },
          assignedSubjects: true
        }
      });

      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
        return;
      }

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
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: username.trim() } },
            { email: { equals: email.trim() } }
          ]
        }
      });

      if (existingUser) {
        res.status(400).json({ success: false, message: 'Username or email already exists.' });
        return;
      }

      const passwordHash = await AuthService.hashPassword(password);

      // Unique enrollment number NT-2026-XXX
      const totalCount = await prisma.studentProfile.count();
      let count = totalCount + 1;
      let enrollmentNo = `NT-2026-${String(count).padStart(3, '0')}`;
      while (await prisma.studentProfile.findUnique({ where: { enrollmentNo } })) {
        count++;
        enrollmentNo = `NT-2026-${String(count).padStart(3, '0')}`;
      }

      const chosenClass = Number(targetClass);
      const chosenStreamId = (chosenClass === 10 || !streamId || streamId === 0) ? null : Number(streamId);

      // Create User & StudentProfile in transaction
      const newUser = await prisma.$transaction(async (tx) => {
        const u = await tx.user.create({
          data: {
            username: username.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
            role: 'student',
            isActive: true
          }
        });

        const sp = await tx.studentProfile.create({
          data: {
            userId: u.id,
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
          }
        });

        // Default annual fee
        const classFeeMap: Record<number, number> = { 10: 22000, 11: 28000, 12: 32000 };
        const annualFee = classFeeMap[chosenClass] || 25000;

        await tx.feeStructure.create({
          data: {
            studentId: sp.id,
            academicYear: '2026-2027',
            totalAnnualFee: annualFee,
            discountAmount: 0.0,
            finalFee: annualFee,
            paidAmount: 0.0,
            dueAmount: annualFee,
            status: 'Pending'
          }
        });

        // Auto-enroll in default subjects for this class/stream
        const defaultSubjects = await tx.subject.findMany({
          where: {
            targetClass: chosenClass,
            isActive: true,
            ...(chosenClass !== 10 && chosenStreamId ? {
              OR: [
                { streamId: chosenStreamId },
                { streamId: null }
              ]
            } : {})
          }
        });

        for (const subj of defaultSubjects) {
          await tx.studentSubject.create({
            data: {
              studentId: sp.id,
              subjectId: subj.id,
              status: 'Active'
            }
          });
        }

        return u;
      });

      const token = AuthService.generateToken({
        userId: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
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

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: username.trim() } },
            { email: { equals: email.trim() } }
          ]
        }
      });

      if (existingUser) {
        res.status(400).json({ success: false, message: 'Username or email already exists.' });
        return;
      }

      const passwordHash = await AuthService.hashPassword(password);
      const chosenStreamId = streamId && Number(streamId) > 0 ? Number(streamId) : null;

      let connectSubjects: { id: number }[] = [];
      if (Array.isArray(subjectIds) && subjectIds.length > 0) {
        connectSubjects = subjectIds.map((id: number) => ({ id: Number(id) }));
      } else if (chosenStreamId) {
        // Auto-connect subjects belonging to selected stream plus universal subjects
        const streamSubjects = await prisma.subject.findMany({
          where: {
            isActive: true,
            OR: [
              { streamId: chosenStreamId },
              { streamId: null }
            ]
          },
          select: { id: true }
        });
        connectSubjects = streamSubjects.map(s => ({ id: s.id }));
      }

      const user = await prisma.user.create({
        data: {
          username: username.trim(),
          email: email.trim().toLowerCase(),
          passwordHash,
          role: 'mentor',
          isActive: true,
          streamId: chosenStreamId,
          designation: designation?.trim() || null,
          ...(connectSubjects.length > 0 && {
            assignedSubjects: {
              connect: connectSubjects
            }
          })
        },
        include: {
          assignedSubjects: true,
          stream: true
        }
      });

      const token = AuthService.generateToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      });

      res.status(201).json({
        success: true,
        message: `Mentor registration successful for ${user.username}!`,
        token,
        stream: user.stream?.name || null
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

      const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const isMatch = await AuthService.comparePassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Incorrect current password.' });
        return;
      }

      const newHash = await AuthService.hashPassword(newPassword);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash }
      });

      res.json({ success: true, message: 'Your password has been updated successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to change password', error: err.message });
    }
  }

  static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: {
          stream: true,
          studentProfile: {
            include: {
              stream: true,
              subjectEnrollments: {
                include: { subject: true }
              }
            }
          },
          assignedSubjects: true
        }
      });

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

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
