import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ExamService } from '../services/exam.service';

export class ExamController {
  static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const classFilter = req.query.class ? Number(req.query.class) : undefined;
      const subjectFilter = req.query.subjectId ? Number(req.query.subjectId) : undefined;

      const where: any = {};
      if (classFilter && [10, 11, 12].includes(classFilter)) {
        where.targetClass = classFilter;
      }

      if (req.user?.role === 'mentor') {
        const mentor = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { assignedSubjects: { select: { id: true } } }
        });
        const mentorSubjectIds = mentor?.assignedSubjects.map(s => s.id) || [];
        if (subjectFilter) {
          if (!mentorSubjectIds.includes(subjectFilter)) {
            res.status(403).json({ success: false, message: 'Access Denied: You are not assigned to this subject.' });
            return;
          }
          where.subjectId = subjectFilter;
        } else {
          where.subjectId = { in: mentorSubjectIds };
        }
      } else if (subjectFilter) {
        where.subjectId = subjectFilter;
      }

      const exams = await prisma.exam.findMany({
        where,
        include: {
          subject: true,
          marks: true,
          _count: { select: { marks: true } }
        },
        orderBy: { examDate: 'desc' }
      });

      // Compute statistics for each exam
      const examsWithStats = exams.map(exam => {
        const validMarks = exam.marks.filter(m => !m.isAbsent && m.marksObtained !== null).map(m => m.marksObtained as number);
        const averageMarks = validMarks.length > 0 ? Math.round((validMarks.reduce((a, b) => a + b, 0) / validMarks.length) * 10) / 10 : 0.0;
        const highestMarks = validMarks.length > 0 ? Math.max(...validMarks) : 0.0;
        return {
          ...exam,
          averageMarks,
          highestMarks
        };
      });

      res.json({ success: true, count: examsWithStats.length, exams: examsWithStats });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch exams', error: err.message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, examType, targetClass, subjectId, examDate, maxMarks, passingMarks, description, isPublished } = req.body;
      if (!title || !targetClass || !subjectId || !examDate) {
        res.status(400).json({ success: false, message: 'Title, class, subject, and exam date are required.' });
        return;
      }

      const exam = await prisma.exam.create({
        data: {
          title: title.trim(),
          examType: examType || 'Unit Test',
          targetClass: Number(targetClass),
          subjectId: Number(subjectId),
          examDate: new Date(examDate),
          maxMarks: Number(maxMarks) || 100.0,
          passingMarks: Number(passingMarks) || 33.0,
          description: description?.trim() || null,
          isPublished: isPublished !== undefined ? Boolean(isPublished) : true
        }
      });

      res.status(201).json({ success: true, message: `Exam "${exam.title}" created successfully.`, exam });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create exam', error: err.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = Number(req.params.id);
      const { title, examType, targetClass, subjectId, examDate, maxMarks, passingMarks, description, isPublished } = req.body;

      const exam = await prisma.exam.update({
        where: { id: examId },
        data: {
          ...(title && { title: title.trim() }),
          ...(examType && { examType }),
          ...(targetClass && { targetClass: Number(targetClass) }),
          ...(subjectId && { subjectId: Number(subjectId) }),
          ...(examDate && { examDate: new Date(examDate) }),
          ...(maxMarks !== undefined && { maxMarks: Number(maxMarks) }),
          ...(passingMarks !== undefined && { passingMarks: Number(passingMarks) }),
          ...(description !== undefined && { description: description?.trim() || null }),
          ...(isPublished !== undefined && { isPublished: Boolean(isPublished) })
        },
        include: { marks: true }
      });

      // Recalculate grades if maxMarks changed
      if (maxMarks !== undefined) {
        for (const m of exam.marks) {
          const newGrade = ExamService.calculateGrade(m.marksObtained, exam.maxMarks, m.isAbsent);
          await prisma.examMark.update({
            where: { id: m.id },
            data: { grade: newGrade }
          });
        }
      }

      res.json({ success: true, message: `Exam "${exam.title}" updated.`, exam });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update exam', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = Number(req.params.id);
      await prisma.exam.delete({ where: { id: examId } });
      res.json({ success: true, message: 'Exam deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete exam', error: err.message });
    }
  }

  static async getMarksheet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = Number(req.params.id);
      const exam = await prisma.exam.findUnique({
        where: { id: examId },
        include: { subject: true }
      });

      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }

      if (req.user?.role === 'mentor') {
        const mentor = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { assignedSubjects: { select: { id: true } } }
        });
        const mentorSubjectIds = mentor?.assignedSubjects.map(s => s.id) || [];
        if (!mentorSubjectIds.includes(exam.subjectId)) {
          res.status(403).json({
            success: false,
            message: 'Access Denied: You are not assigned to manage marks for this subject.'
          });
          return;
        }
      }

      // ONLY fetch students actively enrolled in this specific subject
      const students = await prisma.studentProfile.findMany({
        where: {
          targetClass: exam.targetClass,
          user: { isActive: true },
          subjectEnrollments: {
            some: { subjectId: exam.subjectId, status: 'Active' }
          }
        },
        include: { user: true },
        orderBy: { enrollmentNo: 'asc' }
      });

      const marks = await prisma.examMark.findMany({
        where: { examId }
      });

      const marksMap: Record<number, any> = {};
      for (const m of marks) {
        marksMap[m.studentId] = m;
      }

      res.json({ success: true, exam, students, marksMap });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch marksheet', error: err.message });
    }
  }

  static async recordMarks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = Number(req.params.id);
      const { marksEntries } = req.body;

      if (!Array.isArray(marksEntries)) {
        res.status(400).json({ success: false, message: 'marksEntries array required.' });
        return;
      }

      const exam = await prisma.exam.findUnique({ where: { id: examId } });
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }

      if (req.user?.role === 'mentor') {
        const mentor = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { assignedSubjects: { select: { id: true } } }
        });
        const mentorSubjectIds = mentor?.assignedSubjects.map(s => s.id) || [];
        if (!mentorSubjectIds.includes(exam.subjectId)) {
          res.status(403).json({
            success: false,
            message: 'Access Denied: You cannot record marks for a subject you do not teach.'
          });
          return;
        }
      }

      for (const entry of marksEntries) {
        const studentId = Number(entry.studentId);
        const isAbsent = Boolean(entry.isAbsent);
        const marksObtained = isAbsent ? null : (entry.marksObtained !== '' && entry.marksObtained !== null && entry.marksObtained !== undefined ? Number(entry.marksObtained) : 0);
        const remarks = entry.remarks?.trim() || null;
        const grade = ExamService.calculateGrade(marksObtained, exam.maxMarks, isAbsent);

        await prisma.examMark.upsert({
          where: {
            uq_exam_student: {
              examId,
              studentId
            }
          },
          update: {
            marksObtained,
            isAbsent,
            grade,
            remarks
          },
          create: {
            examId,
            studentId,
            marksObtained,
            isAbsent,
            grade,
            remarks
          }
        });
      }

      res.json({ success: true, message: `Marks recorded successfully for ${exam.title}.` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to record marks', error: err.message });
    }
  }

  static async getStudentMarks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const student = req.user?.studentProfile;
      if (!student) {
        res.status(404).json({ success: false, message: 'Student profile not found.' });
        return;
      }

      const marks = await prisma.examMark.findMany({
        where: {
          studentId: student.id,
          exam: { isPublished: true }
        },
        include: {
          exam: {
            include: { subject: true }
          }
        },
        orderBy: {
          exam: { examDate: 'desc' }
        }
      });

      const validPcts = marks
        .filter(m => !m.isAbsent && m.marksObtained !== null && m.exam.maxMarks > 0)
        .map(m => ((m.marksObtained as number) / m.exam.maxMarks) * 100);

      const overallAverage = validPcts.length > 0
        ? Math.round((validPcts.reduce((a, b) => a + b, 0) / validPcts.length) * 10) / 10
        : 0.0;

      res.json({
        success: true,
        overallAverage,
        marks
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to fetch student marks', error: err.message });
    }
  }
}
