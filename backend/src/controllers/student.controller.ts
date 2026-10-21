import { Response } from 'express';
import {
  StudentProfile,
  User,
  Stream,
  Subject,
  StudentSubject,
  FeeStructure,
  FeePayment,
  Attendance,
  ExamMark,
  Exam,
  Announcement,
  sequelize,
  Op
} from '../models';
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

      const userWhere: any = {};
      if (statusFilter === 'active') {
        userWhere.isActive = true;
      } else if (statusFilter === 'archived') {
        userWhere.isActive = false;
      }

      const where: any = {};

      if (classFilter && [10, 11, 12].includes(classFilter)) {
        where.targetClass = classFilter;
      }

      if (streamFilter) {
        where.streamId = streamFilter;
      }

      if (search) {
        where[Op.or] = [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { enrollmentNo: { [Op.like]: `%${search}%` } },
          { '$user.email$': { [Op.like]: `%${search}%` } }
        ];
      }

      let mentorAssignedSubjects: any[] = [];
      const isMentor = req.user?.role === 'mentor';

      if (isMentor) {
        const mentor = await User.findByPk(req.user!.id, {
          include: [
            {
              model: Subject,
              as: 'assignedSubjects',
              where: { isActive: true },
              required: false,
              include: [{ model: Stream, as: 'stream' }]
            }
          ]
        });

        mentorAssignedSubjects = mentor ? mentor.get('assignedSubjects') || [] : [];
        const mentorSubjectIds = mentorAssignedSubjects.map((s: any) => s.id);

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
          const enrollments = await StudentSubject.findAll({
            where: { subjectId: subjectFilter, status: 'Active' },
            attributes: ['studentId']
          });
          where.id = { [Op.in]: enrollments.map(e => e.get('studentId')) };
        } else {
          const enrollments = await StudentSubject.findAll({
            where: { subjectId: { [Op.in]: mentorSubjectIds }, status: 'Active' },
            attributes: ['studentId']
          });
          where.id = { [Op.in]: enrollments.map(e => e.get('studentId')) };
        }
      } else if (subjectFilter) {
        const enrollments = await StudentSubject.findAll({
          where: { subjectId: subjectFilter, status: 'Active' },
          attributes: ['studentId']
        });
        where.id = { [Op.in]: enrollments.map(e => e.get('studentId')) };
      }

      const studentsData = await StudentProfile.findAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            where: userWhere
          },
          { model: Stream, as: 'stream' },
          {
            model: StudentSubject,
            as: 'subjectEnrollments',
            where: { status: 'Active' },
            required: false,
            include: [{ model: Subject, as: 'subject' }]
          },
          {
            model: FeeStructure,
            as: 'feeStructures',
            required: false
          }
        ],
        order: [
          ['targetClass', 'ASC'],
          ['enrollmentNo', 'ASC']
        ]
      });

      const students = studentsData.map(s => {
        const plain = s.get({ plain: true });
        return {
          ...plain,
          feeStructures: plain.feeStructures ? plain.feeStructures.slice(-1) : []
        };
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

      const studentData = await StudentProfile.findByPk(studentId, {
        include: [
          { model: User, as: 'user' },
          { model: Stream, as: 'stream' },
          {
            model: StudentSubject,
            as: 'subjectEnrollments',
            where: { status: 'Active' },
            required: false,
            include: [{ model: Subject, as: 'subject' }]
          },
          {
            model: Attendance,
            as: 'attendanceRecords',
            required: false,
            include: [{ model: Subject, as: 'subject' }]
          },
          {
            model: FeeStructure,
            as: 'feeStructures',
            required: false,
            include: [{ model: FeePayment, as: 'payments' }]
          },
          {
            model: FeePayment,
            as: 'feePayments',
            required: false
          },
          {
            model: ExamMark,
            as: 'examMarks',
            required: false,
            include: [{ model: Exam, as: 'exam', include: [{ model: Subject, as: 'subject' }] }]
          }
        ]
      });

      if (!studentData) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const student = studentData.get({ plain: true });

      if (req.user?.role === 'mentor') {
        const mentor = await User.findByPk(req.user.id, {
          include: [{ model: Subject, as: 'assignedSubjects', attributes: ['id'] }]
        });
        const mentorSubjects = mentor ? mentor.get('assignedSubjects') || [] : [];
        const mentorSubjectIds = mentorSubjects.map((s: any) => s.id);
        const isEnrolledInMentorSubject = (student.subjectEnrollments || []).some(
          (se: any) => se.status === 'Active' && mentorSubjectIds.includes(se.subjectId)
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

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { username: username.trim() },
            { email: email.trim().toLowerCase() }
          ]
        }
      });

      if (existingUser) {
        res.status(400).json({ success: false, message: 'Username or email already in use.' });
        return;
      }

      const passwordHash = await AuthService.hashPassword(password);

      // Generate unique enrollment number: NT-2026-XXX
      const totalCount = await StudentProfile.count();
      let count = totalCount + 1;
      let enrollmentNo = `NT-2026-${String(count).padStart(3, '0')}`;
      while (await StudentProfile.findOne({ where: { enrollmentNo } })) {
        count++;
        enrollmentNo = `NT-2026-${String(count).padStart(3, '0')}`;
      }

      const chosenClass = Number(targetClass);
      const chosenStreamId = (chosenClass === 10 || !streamId || streamId === 0) ? null : Number(streamId);
      const totalFee = Number(totalAnnualFee);
      const discount = Number(discountAmount) || 0;
      const finalFee = Math.max(0, totalFee - discount);

      const student = await sequelize.transaction(async (t) => {
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
        }, { transaction: t });

        await FeeStructure.create({
          studentId: sp.get('id'),
          academicYear: academicYear || '2026-2027',
          totalAnnualFee: totalFee,
          discountAmount: discount,
          discountReason: discountReason || null,
          finalFee,
          paidAmount: 0.0,
          dueAmount: finalFee,
          status: 'Pending'
        }, { transaction: t });

        // Auto enroll in default subjects
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

        return sp;
      });

      res.status(201).json({
        success: true,
        message: `Student enrolled successfully with Enrollment No: ${enrollmentNo}`,
        studentId: student.get('id'),
        enrollmentNo
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create student', error: err.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = Number(req.params.id);
      const student = await StudentProfile.findByPk(studentId, {
        include: [{ model: User, as: 'user' }]
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

      const chosenStreamId = streamId !== undefined ? (streamId === 0 ? null : Number(streamId)) : student.get('streamId');

      await sequelize.transaction(async (t) => {
        if (isActive !== undefined) {
          await User.update(
            { isActive: Boolean(isActive) },
            { where: { id: student.get('userId') }, transaction: t }
          );
        }

        await student.update({
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
        }, { transaction: t });
      });

      res.json({ success: true, message: 'Student profile updated successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update student', error: err.message });
    }
  }

  static async toggleActive(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const studentId = Number(req.params.id);
      const student = await StudentProfile.findByPk(studentId, {
        include: [{ model: User, as: 'user' }]
      });

      if (!student) {
        res.status(404).json({ success: false, message: 'Student not found.' });
        return;
      }

      const user = student.get('user');
      const newStatus = !user.isActive;
      await User.update({ isActive: newStatus }, { where: { id: student.get('userId') } });

      res.json({
        success: true,
        message: `Student account has been ${newStatus ? 'activated' : 'archived'}.`,
        isActive: newStatus
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

      await sequelize.transaction(async (t) => {
        // Delete old
        await StudentSubject.destroy({ where: { studentId }, transaction: t });

        // Add new
        for (const sid of subjectIds) {
          await StudentSubject.create({
            studentId,
            subjectId: Number(sid),
            status: 'Active'
          }, { transaction: t });
        }

        if (lockSubjects !== undefined) {
          await StudentProfile.update(
            { isSubjectLocked: Boolean(lockSubjects) },
            { where: { id: studentId }, transaction: t }
          );
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
      const student = await StudentProfile.findByPk(studentId);

      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const enrollmentNo = student.get('enrollmentNo');
      // Deleting user will cascade delete StudentProfile and all linked records
      await User.destroy({ where: { id: student.get('userId') } });

      res.json({ success: true, message: `Student (${enrollmentNo}) has been deleted.` });
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

      await StudentProfile.update(
        {
          ...(contactNumber !== undefined && { contactNumber: contactNumber?.trim() || null }),
          ...(address !== undefined && { address: address?.trim() || null }),
          ...(emergencyContact !== undefined && { emergencyContact: emergencyContact?.trim() || null })
        },
        { where: { id: student.id } }
      );

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

      const fullProfile = await StudentProfile.findByPk(student.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'email', 'role', 'profilePicture', 'isActive']
          },
          { model: Stream, as: 'stream' },
          {
            model: StudentSubject,
            as: 'subjectEnrollments',
            where: { status: 'Active' },
            required: false,
            include: [{ model: Subject, as: 'subject' }]
          },
          {
            model: FeeStructure,
            as: 'feeStructures',
            required: false,
            include: [{ model: FeePayment, as: 'payments' }]
          }
        ]
      });

      const plain = fullProfile ? fullProfile.get({ plain: true }) : null;
      const studentResponse = plain ? {
        ...plain,
        studentSubjects: plain.subjectEnrollments,
        feeStructures: plain.feeStructures ? plain.feeStructures.slice(-1) : []
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

      const current = await StudentProfile.findByPk(student.id);
      if (current?.get('isStreamLocked')) {
        res.status(400).json({ success: false, message: 'Stream selection is locked. Submit a change request to modify.' });
        return;
      }

      const { streamId, lockStream } = req.body;
      if (!streamId) {
        res.status(400).json({ success: false, message: 'streamId is required.' });
        return;
      }

      await current!.update({
        streamId: Number(streamId),
        ...(lockStream !== undefined && { isStreamLocked: Boolean(lockStream) })
      });

      const updated = await StudentProfile.findByPk(student.id, {
        include: [{ model: Stream, as: 'stream' }]
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

      const current = await StudentProfile.findByPk(student.id);
      if (current?.get('isSubjectLocked')) {
        res.status(400).json({ success: false, message: 'Subject choices are locked. Submit a change request to modify.' });
        return;
      }

      const { subjectIds, lockSubjects } = req.body;
      if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
        res.status(400).json({ success: false, message: 'Select at least one coaching subject.' });
        return;
      }

      await sequelize.transaction(async (t) => {
        await StudentSubject.destroy({ where: { studentId: student.id }, transaction: t });
        for (const sid of subjectIds) {
          await StudentSubject.create({
            studentId: student.id,
            subjectId: Number(sid),
            status: 'Active'
          }, { transaction: t });
        }

        if (lockSubjects) {
          await current!.update({ isSubjectLocked: true }, { transaction: t });
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

      const ownerUser = await User.findOne({ where: { role: 'owner' } });
      if (ownerUser) {
        await Announcement.create({
          title: `New Admission Lead: ${name} (Class ${targetClass || 10})`,
          content: `Contact: ${phone} | Email: ${email || 'None'} | Stream: ${stream || 'General'} | Message: ${message || 'Looking for admission'}`,
          targetClass: 'All',
          priority: 'Important',
          createdById: ownerUser.get('id')
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
