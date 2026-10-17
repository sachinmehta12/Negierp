import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AttendanceService } from '../services/attendance.service';

export class AnalyticsController {
  static async getDashboard(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const totalStudents = await prisma.studentProfile.count({
        where: { user: { isActive: true } }
      });

      const class10Count = await prisma.studentProfile.count({
        where: { targetClass: 10, user: { isActive: true } }
      });
      const class11Count = await prisma.studentProfile.count({
        where: { targetClass: 11, user: { isActive: true } }
      });
      const class12Count = await prisma.studentProfile.count({
        where: { targetClass: 12, user: { isActive: true } }
      });

      // Financials
      const verifiedPayments = await prisma.feePayment.findMany({
        where: { isVerified: true },
        select: { amount: true }
      });
      const totalFeeCollected = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

      const feeStructures = await prisma.feeStructure.findMany({
        where: { student: { user: { isActive: true } } },
        select: { dueAmount: true }
      });
      const totalFeeDue = feeStructures.reduce((sum, f) => sum + f.dueAmount, 0);

      const pendingPayments = await prisma.feePayment.findMany({
        where: { isVerified: false, student: { user: { isActive: true } } },
        select: { amount: true }
      });
      const pendingFeesCount = pendingPayments.length;
      const pendingFeesTotal = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      // Attendance
      const attendanceRecords = await prisma.attendance.findMany({
        select: { status: true }
      });
      const avgAttendance = AttendanceService.calculatePercentage(attendanceRecords);

      // Change requests
      const pendingRequests = await prisma.subjectChangeRequest.count({
        where: { status: 'Pending' }
      });

      // Recent activities
      const recentPayments = await prisma.feePayment.findMany({
        include: { student: true },
        orderBy: { id: 'desc' },
        take: 5
      });

      const recentExams = await prisma.exam.findMany({
        include: { subject: true },
        orderBy: { examDate: 'desc' },
        take: 4
      });

      const recentAnnouncements = await prisma.announcement.findMany({
        orderBy: { createdAt: 'desc' },
        take: 4
      });

      // Today's schedule
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = daysOfWeek[new Date().getDay()];

      const todayClasses = await prisma.timetable.findMany({
        where: { dayOfWeek: todayName },
        include: { subject: true },
        orderBy: { startTime: 'asc' }
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
        const studentCount = await prisma.studentProfile.count({
          where: { targetClass: c, user: { isActive: true } }
        });

        // Exam marks for this class
        const marks = await prisma.examMark.findMany({
          where: {
            isAbsent: false,
            marksObtained: { not: null },
            exam: { targetClass: c }
          },
          include: { exam: true }
        });

        const pcts = marks.map(m => ((m.marksObtained as number) / m.exam.maxMarks) * 100);
        const avgScore = pcts.length > 0
          ? Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 10) / 10
          : 0.0;

        const attendanceRecords = await prisma.attendance.findMany({
          where: { targetClass: c },
          select: { status: true }
        });
        const attendanceRate = AttendanceService.calculatePercentage(attendanceRecords);

        classStats.push({
          class: c,
          students: studentCount,
          avgScore,
          attendanceRate
        });
      }

      // Subject performance
      const subjects = await prisma.subject.findMany({
        where: { isActive: true },
        include: {
          exams: {
            include: {
              marks: {
                where: { isAbsent: false, marksObtained: { not: null } }
              }
            }
          }
        }
      });

      const subjectPerf = subjects.map(s => {
        const allMarks = s.exams.flatMap(e => e.marks.map(m => ((m.marksObtained as number) / e.maxMarks) * 100));
        const avgScore = allMarks.length > 0
          ? Math.round((allMarks.reduce((a, b) => a + b, 0) / allMarks.length) * 10) / 10
          : 0.0;

        return {
          name: s.name,
          class: s.targetClass,
          avgScore
        };
      });

      // Top students
      const studentsWithMarks = await prisma.studentProfile.findMany({
        where: { user: { isActive: true } },
        include: {
          examMarks: {
            where: { isAbsent: false, marksObtained: { not: null } },
            include: { exam: true }
          }
        }
      });

      const studentAverages = studentsWithMarks
        .map(s => {
          const pcts = s.examMarks.map(m => ((m.marksObtained as number) / m.exam.maxMarks) * 100);
          const avg = pcts.length > 0 ? pcts.reduce((a, b) => a + b, 0) / pcts.length : 0;
          return {
            id: s.id,
            enrollmentNo: s.enrollmentNo,
            fullName: `${s.firstName} ${s.lastName}`,
            targetClass: s.targetClass,
            overallAvg: Math.round(avg * 10) / 10,
            examsCount: s.examMarks.length
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
