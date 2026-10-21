import { Response } from 'express';
import {
  StudentProfile,
  User,
  FeePayment,
  FeeStructure,
  Attendance,
  SubjectChangeRequest,
  Exam,
  Subject,
  Announcement,
  Timetable,
  ExamMark,
  Op
} from '../models';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AttendanceService } from '../services/attendance.service';

export class AnalyticsController {
  static async getDashboard(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const totalStudents = await StudentProfile.count({
        include: [{ model: User, as: 'user', where: { isActive: true } }]
      });

      const class10Count = await StudentProfile.count({
        where: { targetClass: 10 },
        include: [{ model: User, as: 'user', where: { isActive: true } }]
      });
      const class11Count = await StudentProfile.count({
        where: { targetClass: 11 },
        include: [{ model: User, as: 'user', where: { isActive: true } }]
      });
      const class12Count = await StudentProfile.count({
        where: { targetClass: 12 },
        include: [{ model: User, as: 'user', where: { isActive: true } }]
      });

      // Financials
      const verifiedPayments = await FeePayment.findAll({
        where: { isVerified: true },
        attributes: ['amount']
      });
      const totalFeeCollected = verifiedPayments.reduce((sum, p) => sum + Number(p.get('amount')), 0);

      const feeStructures = await FeeStructure.findAll({
        include: [{
          model: StudentProfile,
          as: 'student',
          include: [{ model: User, as: 'user', where: { isActive: true } }]
        }],
        attributes: ['dueAmount']
      });
      const totalFeeDue = feeStructures.reduce((sum, f) => sum + Number(f.get('dueAmount')), 0);

      const pendingPayments = await FeePayment.findAll({
        where: { isVerified: false },
        include: [{
          model: StudentProfile,
          as: 'student',
          include: [{ model: User, as: 'user', where: { isActive: true } }]
        }],
        attributes: ['amount']
      });
      const pendingFeesCount = pendingPayments.length;
      const pendingFeesTotal = pendingPayments.reduce((sum, p) => sum + Number(p.get('amount')), 0);

      // Attendance
      const attendanceRecords = await Attendance.findAll({
        attributes: ['status']
      });
      const plainAttendance = attendanceRecords.map(r => r.get({ plain: true }));
      const avgAttendance = AttendanceService.calculatePercentage(plainAttendance);

      // Change requests
      const pendingRequests = await SubjectChangeRequest.count({
        where: { status: 'Pending' }
      });

      // Recent activities
      const recentPayments = await FeePayment.findAll({
        include: [{ model: StudentProfile, as: 'student' }],
        order: [['id', 'DESC']],
        limit: 5
      });

      const recentExams = await Exam.findAll({
        include: [{ model: Subject, as: 'subject' }],
        order: [['examDate', 'DESC']],
        limit: 4
      });

      const recentAnnouncements = await Announcement.findAll({
        order: [['createdAt', 'DESC']],
        limit: 4
      });

      // Today's schedule
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = daysOfWeek[new Date().getDay()];

      const todayClasses = await Timetable.findAll({
        where: { dayOfWeek: todayName },
        include: [{ model: Subject, as: 'subject' }],
        order: [['startTime', 'ASC']]
      });

      res.json({
        success: true,
        metrics: {
          totalStudents,
          class10Count,
          class11Count,
          class12Count,
          totalFeeCollected,
          totalFeeDue,
          pendingFeesCount,
          pendingFeesTotal,
          avgAttendance,
          pendingRequests
        },
        recentPayments,
        recentExams,
        recentAnnouncements,
        todayClasses,
        todayName
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics', error: err.message });
    }
  }

  static async getAcademicAnalytics(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const classes = [10, 11, 12];
      const classStats = [];

      for (const c of classes) {
        const studentCount = await StudentProfile.count({
          where: { targetClass: c },
          include: [{ model: User, as: 'user', where: { isActive: true } }]
        });

        // Exam marks for this class
        const marks = await ExamMark.findAll({
          where: {
            isAbsent: false,
            marksObtained: { [Op.ne]: null }
          },
          include: [
            {
              model: Exam,
              as: 'exam',
              where: { targetClass: c }
            }
          ]
        });

        const pcts = marks.map(m => {
          const plain = m.get({ plain: true });
          const maxMarks = plain.exam ? plain.exam.maxMarks : 100;
          return (Number(plain.marksObtained) / (maxMarks > 0 ? maxMarks : 100)) * 100;
        });

        const avgScore = pcts.length > 0
          ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10
          : 0.0;

        const attendanceRecords = await Attendance.findAll({
          where: { targetClass: c },
          attributes: ['status']
        });
        const plainAttendance = attendanceRecords.map(r => r.get({ plain: true }));
        const attendanceRate = AttendanceService.calculatePercentage(plainAttendance);

        classStats.push({
          class: c,
          students: studentCount,
          avgScore,
          attendanceRate
        });
      }

      // Subject performance
      const subjects = await Subject.findAll({
        where: { isActive: true },
        include: [
          {
            model: Exam,
            as: 'exams',
            include: [
              {
                model: ExamMark,
                as: 'marks',
                where: { isAbsent: false, marksObtained: { [Op.ne]: null } },
                required: false
              }
            ]
          }
        ]
      });

      const subjectPerf = subjects.map(s => {
        const plain = s.get({ plain: true });
        const allMarks = (plain.exams || []).flatMap((e: any) =>
          (e.marks || []).map((m: any) => (Number(m.marksObtained) / (e.maxMarks || 100)) * 100)
        );
        const avgScore = allMarks.length > 0
          ? Math.round((allMarks.reduce((a: number, b: number) => a + b, 0) / allMarks.length) * 10) / 10
          : 0.0;

        return {
          name: plain.name,
          class: plain.targetClass,
          avgScore
        };
      });

      // Top students
      const studentsWithMarks = await StudentProfile.findAll({
        include: [
          { model: User, as: 'user', where: { isActive: true } },
          {
            model: ExamMark,
            as: 'examMarks',
            where: { isAbsent: false, marksObtained: { [Op.ne]: null } },
            required: false,
            include: [{ model: Exam, as: 'exam' }]
          }
        ]
      });

      const studentAverages = studentsWithMarks
        .map(s => {
          const plain = s.get({ plain: true });
          const marks = plain.examMarks || [];
          const pcts = marks.map((m: any) => {
            const max = m.exam ? m.exam.maxMarks : 100;
            return (Number(m.marksObtained) / (max > 0 ? max : 100)) * 100;
          });
          const avg = pcts.length > 0 ? pcts.reduce((a: number, b: number) => a + b, 0) / pcts.length : 0;
          return {
            id: plain.id,
            enrollmentNo: plain.enrollmentNo,
            fullName: `${plain.firstName} ${plain.lastName}`,
            targetClass: plain.targetClass,
            overallAvg: Math.round(avg * 10) / 10,
            examsCount: marks.length
          };
        })
        .filter(s => s.examsCount > 0)
        .sort((a, b) => b.overallAvg - a.overallAvg)
        .slice(0, 5);

      res.json({
        success: true,
        classStats,
        subjectPerf,
        topStudents: studentAverages
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch academic analytics', error: err.message });
    }
  }
}
