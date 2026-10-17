import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AuthService } from '../services/auth.service';

export class StudentController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const classFilter = req.query.class ? Number(req.query.class) : undefined;
      const streamFilter = req.query.stream ? Number(req.query.stream) : undefined;
      const subjectFilter = req.query.subjectId ? Number(req.query.subjectId) : undefined;
      const statusFilter = (req.query.status as string) || 'active';
      const search = (req.query.q as string)?.trim();

      const where: any = {};

      if (statusFilter === 'active') {
        where.user = { isActive: true };
      } else if (statusFilter === 'archived') {
        where.user = { isActive: false };
      }

      if (classFilter && [10, 11, 12].includes(classFilter)) {
        where.targetClass = classFilter;
      }

      if (streamFilter) {
        where.streamId = streamFilter;
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search } },
          { lastName: { contains: search } },
          { enrollmentNo: { contains: search } },
          { user: { email: { contains: search } } }
        ];
      }

      let mentorAssignedSubjects: any[] = [];
      const isMentor = req.user?.role === 'mentor';

      if (isMentor) {
        const mentor = await prisma.user.findUnique({
          where: { id: req.user!.id },
          include: {
            assignedSubjects: {
              where: { isActive: true },
              include: { stream: true },
              orderBy: [
                { targetClass: 'asc' },
                { name: 'asc' }
              ]
            }
          }
        });

        mentorAssignedSubjects = mentor?.assignedSubjects || [];
        const mentorSubjectIds = mentorAssignedSubjects.map(s => s.id);

        if (mentorSubjectIds.length === 0) {
          res.json({
            success: true,
            count: 0,
            students: [],
            mentorSubjects: [],
            isMentor: true,
            message: 'You have not been assigned to teach any subjects yet.'
          });
          return;
        }

        if (subjectFilter) {
          if (!mentorSubjectIds.includes(subjectFilter)) {
            res.status(403).json({
              success: false,
              message: 'Access Denied: You are not assigned as the mentor for this subject.'
            });
            return;
          }
          where.subjectEnrollments = {
            some: {
              subjectId: subjectFilter,
              status: 'Active'
            }
          };
        } else {
          where.subjectEnrollments = {
            some: {
              subjectId: { in: mentorSubjectIds },
              status: 'Active'
            }
          };
        }
      } else if (subjectFilter) {
        where.subjectEnrollments = {
          some: {
            subjectId: subjectFilter,
            status: 'Active'
          }
        };
      }

      const students = await prisma.studentProfile.findMany({
        where,
        include: {
          user: true,
          stream: true,
          subjectEnrollments: {
            where: { status: 'Active' },
            include: { subject: true }
          },
          feeStructures: {
            orderBy: { id: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { targetClass: 'asc' },
          { enrollmentNo: 'asc' }
        ]
      });

      res.json({
        success: true,
        count: students.length,
        students,
        mentorSubjects: mentorAssignedSubjects,
        isMentor
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch students', error: err.message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = Number(req.params.id);

      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId },
        include: {
          user: true,
          stream: true,
          subjectEnrollments: {
            where: { status: 'Active' },
            include: { subject: true }
          },
          attendanceRecords: {
            include: { subject: true },
            orderBy: { date: 'desc' }
          },
          feeStructures: {
            include: { payments: true },
            orderBy: { id: 'desc' }
          },
          feePayments: {
            orderBy: { paymentDate: 'desc' }
          },
          examMarks: {
            include: { exam: { include: { subject: true } } },
            orderBy: { exam: { examDate: 'desc' } }
          }
        }
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      if (req.user?.role === 'mentor') {
        const mentor = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { assignedSubjects: { select: { id: true } } }
        });
        const mentorSubjectIds = mentor?.assignedSubjects.map(s => s.id) || [];
        const isEnrolledInMentorSubject = student.subjectEnrollments.some(
          se => se.status === 'Active' && mentorSubjectIds.includes(se.subjectId)
        );

        if (!isEnrolledInMentorSubject) {
          res.status(403).json({
            success: false,
            message: 'Access Denied: This student is not enrolled in any of your assigned subjects.'
          });
          return;
        }
      }

      res.json({ success: true, student });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch student details', error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        username,
        email,
        password,
        firstName,
        lastName,
        gender,
        dob,
        contactNumber,
        parentName,
        parentContact,
        parentEmail,
        address,
        emergencyContact,
        targetClass,
        academicYear,
        streamId,
        totalAnnualFee,
        discountAmount,
        discountReason,
        notes
      } = req.body;

      if (!username || !email || !password || !firstName || !lastName || !targetClass || !totalAnnualFee) {
        res.status(400).json({ success: false, message: 'Required fields are missing.' });
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
        res.status(400).json({ success: false, message: 'Username or email already in use.' });
        return;
      }

      const passwordHash = await AuthService.hashPassword(password);

      // Generate unique enrollment number: NT-2026-XXX
      const totalCount = await prisma.studentProfile.count();
      let count = totalCount + 1;
      let enrollmentNo = `NT-2026-${String(count).padStart(3, '0')}`;
      while (await prisma.studentProfile.findUnique({ where: { enrollmentNo } })) {
        count++;
        enrollmentNo = `NT-2026-${String(count).padStart(3, '0')}`;
      }

      const chosenClass = Number(targetClass);
      const chosenStreamId = (chosenClass === 10 || !streamId || streamId === 0) ? null : Number(streamId);
      const totalFee = Number(totalAnnualFee);
      const discount = Number(discountAmount) || 0;
      const finalFee = Math.max(0, totalFee - discount);

      const student = await prisma.$transaction(async (tx) => {
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
            dob: dob ? new Date(dob) : null,
            contactNumber: contactNumber?.trim() || null,
            parentName: parentName?.trim() || null,
            parentContact: parentContact?.trim() || null,
            parentEmail: parentEmail?.trim().toLowerCase() || null,
            address: address?.trim() || null,
            emergencyContact: emergencyContact?.trim() || null,
            targetClass: chosenClass,
            academicYear: academicYear || '2026-2027',
            streamId: chosenStreamId,
            notes: notes || null
          }
        });

        await tx.feeStructure.create({
          data: {
            studentId: sp.id,
            academicYear: academicYear || '2026-2027',
            totalAnnualFee: totalFee,
            discountAmount: discount,
            discountReason: discountReason || null,
            finalFee,
            paidAmount: 0.0,
            dueAmount: finalFee,
            status: 'Pending'
          }
        });

        // Auto enroll in default subjects
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

        return sp;
      });

      res.status(201).json({
        success: true,
        message: `Student enrolled successfully with Enrollment No: ${enrollmentNo}`,
        studentId: student.id,
        enrollmentNo
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create student', error: err.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = Number(req.params.id);
      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId },
        include: { user: true }
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const {
        firstName,
        lastName,
        gender,
        dob,
        contactNumber,
        parentName,
        parentContact,
        parentEmail,
        address,
        emergencyContact,
        targetClass,
        academicYear,
        streamId,
        isStreamLocked,
        isSubjectLocked,
        notes,
        isActive
      } = req.body;

      const chosenStreamId = streamId !== undefined ? (streamId === 0 ? null : Number(streamId)) : student.streamId;

      await prisma.$transaction(async (tx) => {
        if (isActive !== undefined) {
          await tx.user.update({
            where: { id: student.userId },
            data: { isActive: Boolean(isActive) }
          });
        }

        await tx.studentProfile.update({
          where: { id: studentId },
          data: {
            ...(firstName && { firstName: firstName.trim() }),
            ...(lastName && { lastName: lastName.trim() }),
            ...(gender !== undefined && { gender }),
            ...(dob !== undefined && { dob: dob ? new Date(dob) : null }),
            ...(contactNumber !== undefined && { contactNumber: contactNumber?.trim() || null }),
            ...(parentName !== undefined && { parentName: parentName?.trim() || null }),
            ...(parentContact !== undefined && { parentContact: parentContact?.trim() || null }),
            ...(parentEmail !== undefined && { parentEmail: parentEmail?.trim().toLowerCase() || null }),
            ...(address !== undefined && { address: address?.trim() || null }),
            ...(emergencyContact !== undefined && { emergencyContact: emergencyContact?.trim() || null }),
            ...(targetClass !== undefined && { targetClass: Number(targetClass) }),
            ...(academicYear !== undefined && { academicYear }),
            streamId: chosenStreamId,
            ...(isStreamLocked !== undefined && { isStreamLocked: Boolean(isStreamLocked) }),
            ...(isSubjectLocked !== undefined && { isSubjectLocked: Boolean(isSubjectLocked) }),
            ...(notes !== undefined && { notes })
          }
        });
      });

      res.json({ success: true, message: 'Student profile updated successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update student', error: err.message });
    }
  }

  static async toggleActive(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = Number(req.params.id);
      const student = await prisma.studentProfile.findUnique({
        where: { id: studentId },
        include: { user: true }
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found.' });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: student.userId },
        data: { isActive: !student.user.isActive }
      });

      res.json({
        success: true,
        message: `Student account has been ${updatedUser.isActive ? 'activated' : 'archived'}.`,
        isActive: updatedUser.isActive
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to toggle status', error: err.message });
    }
  }

  static async assignSubjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = Number(req.params.id);
      const { subjectIds, lockSubjects } = req.body;

      if (!Array.isArray(subjectIds)) {
        res.status(400).json({ success: false, message: 'subjectIds must be an array.' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Delete old
        await tx.studentSubject.deleteMany({ where: { studentId } });

        // Add new
        for (const sid of subjectIds) {
          await tx.studentSubject.create({
            data: {
              studentId,
              subjectId: Number(sid),
              status: 'Active'
            }
          });
        }

        if (lockSubjects !== undefined) {
          await tx.studentProfile.update({
            where: { id: studentId },
            data: { isSubjectLocked: Boolean(lockSubjects) }
          });
        }
      });

      res.json({ success: true, message: 'Student subject enrollments updated successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to assign subjects', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = Number(req.params.id);
      const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      // Deleting user will cascade delete StudentProfile and all linked records
      await prisma.user.delete({ where: { id: student.userId } });

      res.json({ success: true, message: `Student (${student.enrollmentNo}) has been deleted.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete student', error: err.message });
    }
  }

  static async updateSelfProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not associated with this account.' });
        return;
      }

      const { contactNumber, address, emergencyContact } = req.body;

      await prisma.studentProfile.update({
        where: { id: student.id },
        data: {
          ...(contactNumber !== undefined && { contactNumber: contactNumber?.trim() || null }),
          ...(address !== undefined && { address: address?.trim() || null }),
          ...(emergencyContact !== undefined && { emergencyContact: emergencyContact?.trim() || null })
        }
      });

      res.json({ success: true, message: 'Profile contact details updated successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
    }
  }

  static async getSelfProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const fullProfile = await prisma.studentProfile.findUnique({
        where: { id: student.id },
        include: {
          user: { select: { id: true, username: true, email: true, role: true, profilePicture: true, isActive: true } },
          stream: true,
          subjectEnrollments: {
            where: { status: 'Active' },
            include: { subject: true }
          },
          feeStructures: {
            orderBy: { id: 'desc' },
            take: 1,
            include: { payments: true }
          }
        }
      });

      const studentResponse = fullProfile ? {
        ...fullProfile,
        studentSubjects: fullProfile.subjectEnrollments
      } : null;

      res.json({ success: true, student: studentResponse });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch self profile', error: err.message });
    }
  }

  static async selectStream(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const current = await prisma.studentProfile.findUnique({ where: { id: student.id } });
      if (current?.isStreamLocked) {
        res.status(400).json({ success: false, message: 'Stream selection is locked. Submit a change request to modify.' });
        return;
      }

      const { streamId, lockStream } = req.body;
      if (!streamId) {
        res.status(400).json({ success: false, message: 'streamId is required.' });
        return;
      }

      const updated = await prisma.studentProfile.update({
        where: { id: student.id },
        data: {
          streamId: Number(streamId),
          ...(lockStream !== undefined && { isStreamLocked: Boolean(lockStream) })
        },
        include: { stream: true }
      });

      res.json({ success: true, message: 'Academic stream selected successfully.', student: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to select stream', error: err.message });
    }
  }

  static async selectSubjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const current = await prisma.studentProfile.findUnique({ where: { id: student.id } });
      if (current?.isSubjectLocked) {
        res.status(400).json({ success: false, message: 'Subject choices are locked. Submit a change request to modify.' });
        return;
      }

      const { subjectIds, lockSubjects } = req.body;
      if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
        res.status(400).json({ success: false, message: 'Select at least one coaching subject.' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        await tx.studentSubject.deleteMany({ where: { studentId: student.id } });
        for (const sid of subjectIds) {
          await tx.studentSubject.create({
            data: {
              studentId: student.id,
              subjectId: Number(sid),
              status: 'Active'
            }
          });
        }

        if (lockSubjects) {
          await tx.studentProfile.update({
            where: { id: student.id },
            data: { isSubjectLocked: true }
          });
        }
      });

      res.json({ success: true, message: 'Coaching subjects enrolled successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to enroll in subjects', error: err.message });
    }
  }

  static async submitEnquiry(req: any, res: Response): Promise<void> {
    try {
      const { name, phone, email, targetClass, stream, message } = req.body;
      if (!name || !phone) {
        res.status(400).json({ success: false, message: 'Student name and contact phone are required.' });
        return;
      }

      const ownerUser = await prisma.user.findFirst({ where: { role: 'owner' } });
      if (ownerUser) {
        await prisma.announcement.create({
          data: {
            title: `New Admission Lead: ${name} (Class ${targetClass || 10})`,
            content: `Contact: ${phone} | Email: ${email || 'None'} | Stream: ${stream || 'General'} | Message: ${message || 'Looking for admission'}`,
            targetClass: 'All',
            priority: 'Important',
            createdById: ownerUser.id
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Thank you! Your admission enquiry has been received. Our counselor will contact you within 24 hours.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to submit enquiry', error: err.message });
    }
  }
}
