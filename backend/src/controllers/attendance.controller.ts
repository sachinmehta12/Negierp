import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AttendanceService } from '../services/attendance.service';

export class AttendanceController {
  static async getRegister(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const targetClass = Number(req.query.class) || 10;
      const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const subjectId = req.query.subjectId ? Number(req.query.subjectId) : null;

      const dateObj = new Date(dateStr);
      dateObj.setUTCHours(0, 0, 0, 0);

      let mentorSubjectIds: number[] | null = null;
      if (req.user?.role === 'mentor') {
        const mentor = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { assignedSubjects: { select: { id: true } } }
        });
        mentorSubjectIds = mentor?.assignedSubjects.map(s => s.id) || [];

        if (subjectId && !mentorSubjectIds.includes(subjectId)) {
          res.status(403).json({
            success: false,
            message: 'Access Denied: You are not assigned to take attendance for this subject.'
          });
          return;
        }
      }

      // Fetch students in this class actively enrolled in this subject (or mentor's subjects)
      const studentWhere: any = {
        targetClass,
        user: { isActive: true }
      };

      if (subjectId && subjectId !== 0) {
        studentWhere.subjectEnrollments = {
          some: { subjectId, status: 'Active' }
        };
      } else if (mentorSubjectIds && mentorSubjectIds.length > 0) {
        studentWhere.subjectEnrollments = {
          some: { subjectId: { in: mentorSubjectIds }, status: 'Active' }
        };
      }

      const students = await prisma.studentProfile.findMany({
        where: studentWhere,
        include: {
          user: true,
          subjectEnrollments: {
            where: { status: 'Active' },
            include: { subject: true }
          }
        },
        orderBy: { enrollmentNo: 'asc' }
      });

      // Existing records for this date/class/subject
      const records = await prisma.attendance.findMany({
        where: {
          targetClass,
          date: dateObj,
          subjectId: subjectId && subjectId !== 0 ? subjectId : null
        }
      });

      const recordsMap: Record<number, any> = {};
      for (const r of records) {
        recordsMap[r.studentId] = r;
      }

      res.json({
        success: true,
        targetClass,
        date: dateStr,
        subjectId,
        students,
        recordsMap
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch attendance register', error: err.message });
    }
  }

  static async recordAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { targetClass, date, subjectId, entries } = req.body;
      if (!targetClass || !date || !Array.isArray(entries)) {
        res.status(400).json({ success: false, message: 'targetClass, date, and entries array are required.' });
        return;
      }

      const dateObj = new Date(date);
      dateObj.setUTCHours(0, 0, 0, 0);
      const chosenSubjectId = subjectId && subjectId !== 0 ? Number(subjectId) : null;

      if (req.user?.role === 'mentor' && chosenSubjectId) {
        const mentor = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { assignedSubjects: { select: { id: true } } }
        });
        const mentorSubjectIds = mentor?.assignedSubjects.map(s => s.id) || [];
        if (!mentorSubjectIds.includes(chosenSubjectId)) {
          res.status(403).json({
            success: false,
            message: 'Access Denied: You cannot record attendance for a subject you do not teach.'
          });
          return;
        }
      }

      const markedById = req.user?.id || null;

      for (const entry of entries) {
        const studentId = Number(entry.studentId);
        const status = entry.status || 'Present';
        const remarks = entry.remarks?.trim() || null;

        await prisma.attendance.upsert({
          where: {
            uq_student_date_subject: {
              studentId,
              date: dateObj,
              subjectId: chosenSubjectId as any
            }
          },
          update: {
            status,
            remarks,
            markedById
          },
          create: {
            studentId,
            date: dateObj,
            targetClass: Number(targetClass),
            subjectId: chosenSubjectId,
            status,
            remarks,
            markedById
          }
        });
      }

      res.json({
        success: true,
        message: `Attendance recorded for Class ${targetClass} on ${date}.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to save attendance', error: err.message });
    }
  }

  static async getStudentAttendance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const records = await prisma.attendance.findMany({
        where: { studentId: student.id },
        include: { subject: true },
        orderBy: { date: 'desc' }
      });

      const percentage = AttendanceService.calculatePercentage(records);
      const totalClasses = records.length;
      const presentCount = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
      const absentCount = records.filter(r => r.status === 'Absent').length;

      res.json({
        success: true,
        percentage,
        totalClasses,
        presentCount,
        absentCount,
        records
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch student attendance', error: err.message });
    }
  }
}
