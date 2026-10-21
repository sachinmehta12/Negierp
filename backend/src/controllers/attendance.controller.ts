import { Response } from 'express';
import { Attendance, StudentProfile, User, Subject, StudentSubject, Op } from '../models';
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

      let mentorSubjectIds: number[] = [];
      if (req.user?.role === 'mentor') {
        const mentor = await User.findByPk(req.user.id, {
          include: [{ model: Subject, as: 'assignedSubjects', attributes: ['id'] }]
        });
        const mentorSubjects = mentor ? mentor.get('assignedSubjects') || [] : [];
        mentorSubjectIds = mentorSubjects.map((s: any) => s.id);

        if (subjectId && !mentorSubjectIds.includes(subjectId)) {
          res.status(403).json({
            success: false,
            message: 'Access Denied: You are not assigned to take attendance for this subject.'
          });
          return;
        }
      }

      // Find student IDs actively enrolled in this subject (or mentor's subjects)
      let studentIdFilter: number[] | null = null;
      if (subjectId && subjectId !== 0) {
        const enrollments = await StudentSubject.findAll({
          where: { subjectId, status: 'Active' },
          attributes: ['studentId']
        });
        studentIdFilter = enrollments.map(e => e.get('studentId'));
      } else if (mentorSubjectIds.length > 0) {
        const enrollments = await StudentSubject.findAll({
          where: { subjectId: { [Op.in]: mentorSubjectIds }, status: 'Active' },
          attributes: ['studentId']
        });
        studentIdFilter = enrollments.map(e => e.get('studentId'));
      }

      const studentWhere: any = {
        targetClass
      };
      if (studentIdFilter !== null) {
        studentWhere.id = { [Op.in]: studentIdFilter };
      }

      const students = await StudentProfile.findAll({
        where: studentWhere,
        include: [
          {
            model: User,
            as: 'user',
            where: { isActive: true }
          },
          {
            model: StudentSubject,
            as: 'subjectEnrollments',
            where: { status: 'Active' },
            required: false,
            include: [{ model: Subject, as: 'subject' }]
          }
        ],
        order: [['enrollmentNo', 'ASC']]
      });

      // Existing records for this date/class/subject
      const records = await Attendance.findAll({
        where: {
          targetClass,
          date: dateObj,
          subjectId: subjectId && subjectId !== 0 ? subjectId : null
        }
      });

      const recordsMap: Record<number, any> = {};
      for (const r of records) {
        recordsMap[r.get('studentId')] = r.get({ plain: true });
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
        const mentor = await User.findByPk(req.user.id, {
          include: [{ model: Subject, as: 'assignedSubjects', attributes: ['id'] }]
        });
        const mentorSubjects = mentor ? mentor.get('assignedSubjects') || [] : [];
        const mentorSubjectIds = mentorSubjects.map((s: any) => s.id);

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

        const existingRecord = await Attendance.findOne({
          where: {
            studentId,
            date: dateObj,
            subjectId: chosenSubjectId
          }
        });

        if (existingRecord) {
          await existingRecord.update({
            status,
            remarks,
            markedById
          });
        } else {
          await Attendance.create({
            studentId,
            date: dateObj,
            targetClass: Number(targetClass),
            subjectId: chosenSubjectId,
            status,
            remarks,
            markedById
          });
        }
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

      const recordsData = await Attendance.findAll({
        where: { studentId: student.id },
        include: [{ model: Subject, as: 'subject' }],
        order: [['date', 'DESC']]
      });

      const records = recordsData.map(r => r.get({ plain: true }));
      const percentage = AttendanceService.calculatePercentage(records);
      const totalClasses = records.length;
      const presentCount = records.filter((r: any) => r.status === 'Present' || r.status === 'Late').length;
      const absentCount = records.filter((r: any) => r.status === 'Absent').length;

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
