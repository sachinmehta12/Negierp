import { Response } from 'express';
import { Exam, Subject, ExamMark, StudentProfile, User, StudentSubject, Op } from '../models';
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
        const mentor = await User.findByPk(req.user.id, {
          include: [{ model: Subject, as: 'assignedSubjects', attributes: ['id'] }]
        });
        const mentorSubjects = mentor ? mentor.get('assignedSubjects') || [] : [];
        const mentorSubjectIds = mentorSubjects.map((s: any) => s.id);

        if (subjectFilter) {
          if (!mentorSubjectIds.includes(subjectFilter)) {
            res.status(403).json({ success: false, message: 'Access Denied: You are not assigned to this subject.' });
            return;
          }
          where.subjectId = subjectFilter;
        } else {
          where.subjectId = { [Op.in]: mentorSubjectIds };
        }
      } else if (subjectFilter) {
        where.subjectId = subjectFilter;
      }

      const exams = await Exam.findAll({
        where,
        include: [
          { model: Subject, as: 'subject' },
          { model: ExamMark, as: 'marks' }
        ],
        order: [['examDate', 'DESC']]
      });

      // Compute statistics for each exam
      const examsWithStats = exams.map(exam => {
        const plain = exam.get({ plain: true });
        const marks = plain.marks || [];
        const validMarks = marks.filter((m: any) => !m.isAbsent && m.marksObtained !== null && m.marksObtained !== undefined).map((m: any) => Number(m.marksObtained));
        const averageMarks = validMarks.length > 0 ? Math.round((validMarks.reduce((a: number, b: number) => a + b, 0) / validMarks.length) * 10) / 10 : 0.0;
        const highestMarks = validMarks.length > 0 ? Math.max(...validMarks) : 0.0;
        return {
          ...plain,
          averageMarks,
          highestMarks,
          _count: { marks: marks.length }
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

      const exam = await Exam.create({
        title: title.trim(),
        examType: examType || 'Unit Test',
        targetClass: Number(targetClass),
        subjectId: Number(subjectId),
        examDate: new Date(examDate),
        maxMarks: Number(maxMarks) || 100.0,
        passingMarks: Number(passingMarks) || 33.0,
        description: description?.trim() || null,
        isPublished: isPublished !== undefined ? Boolean(isPublished) : true
      });

      res.status(201).json({ success: true, message: `Exam "${exam.get('title')}" created successfully.`, exam });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to create exam', error: err.message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = Number(req.params.id);
      const { title, examType, targetClass, subjectId, examDate, maxMarks, passingMarks, description, isPublished } = req.body;

      const exam = await Exam.findByPk(examId, {
        include: [{ model: ExamMark, as: 'marks' }]
      });

      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }

      await exam.update({
        ...(title && { title: title.trim() }),
        ...(examType && { examType }),
        ...(targetClass && { targetClass: Number(targetClass) }),
        ...(subjectId && { subjectId: Number(subjectId) }),
        ...(examDate && { examDate: new Date(examDate) }),
        ...(maxMarks !== undefined && { maxMarks: Number(maxMarks) }),
        ...(passingMarks !== undefined && { passingMarks: Number(passingMarks) }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) })
      });

      // Recalculate grades if maxMarks changed
      if (maxMarks !== undefined) {
        const marks = exam.get('marks') || [];
        for (const m of marks) {
          const newGrade = ExamService.calculateGrade(m.marksObtained, exam.get('maxMarks'), m.isAbsent);
          await m.update({ grade: newGrade });
        }
      }

      res.json({ success: true, message: `Exam "${exam.get('title')}" updated.`, exam });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to update exam', error: err.message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = Number(req.params.id);
      await Exam.destroy({ where: { id: examId } });
      res.json({ success: true, message: 'Exam deleted.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to delete exam', error: err.message });
    }
  }

  static async getMarksheet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const examId = Number(req.params.id);
      const exam = await Exam.findByPk(examId, {
        include: [{ model: Subject, as: 'subject' }]
      });

      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }

      if (req.user?.role === 'mentor') {
        const mentor = await User.findByPk(req.user.id, {
          include: [{ model: Subject, as: 'assignedSubjects', attributes: ['id'] }]
        });
        const mentorSubjects = mentor ? mentor.get('assignedSubjects') || [] : [];
        const mentorSubjectIds = mentorSubjects.map((s: any) => s.id);

        if (!mentorSubjectIds.includes(exam.get('subjectId'))) {
          res.status(403).json({
            success: false,
            message: 'Access Denied: You are not assigned to manage marks for this subject.'
          });
          return;
        }
      }

      // ONLY fetch students actively enrolled in this specific subject
      const enrolledStudentAssociations = await StudentSubject.findAll({
        where: {
          subjectId: exam.get('subjectId'),
          status: 'Active'
        },
        attributes: ['studentId']
      });
      const enrolledStudentIds = enrolledStudentAssociations.map(sa => sa.get('studentId'));

      const students = await StudentProfile.findAll({
        where: {
          targetClass: exam.get('targetClass'),
          id: { [Op.in]: enrolledStudentIds }
        },
        include: [
          {
            model: User,
            as: 'user',
            where: { isActive: true }
          }
        ],
        order: [['enrollmentNo', 'ASC']]
      });

      const marks = await ExamMark.findAll({
        where: { examId }
      });

      const marksMap: Record<number, any> = {};
      for (const m of marks) {
        marksMap[m.get('studentId')] = m.get({ plain: true });
      }

      res.json({ success: true, exam: exam.get({ plain: true }), students, marksMap });
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

      const exam = await Exam.findByPk(examId);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found.' });
        return;
      }

      if (req.user?.role === 'mentor') {
        const mentor = await User.findByPk(req.user.id, {
          include: [{ model: Subject, as: 'assignedSubjects', attributes: ['id'] }]
        });
        const mentorSubjects = mentor ? mentor.get('assignedSubjects') || [] : [];
        const mentorSubjectIds = mentorSubjects.map((s: any) => s.id);

        if (!mentorSubjectIds.includes(exam.get('subjectId'))) {
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
        const grade = ExamService.calculateGrade(marksObtained, exam.get('maxMarks'), isAbsent);

        const existingMark = await ExamMark.findOne({
          where: { examId, studentId }
        });

        if (existingMark) {
          await existingMark.update({
            marksObtained,
            isAbsent,
            grade,
            remarks
          });
        } else {
          await ExamMark.create({
            examId,
            studentId,
            marksObtained,
            isAbsent,
            grade,
            remarks
          });
        }
      }

      res.json({ success: true, message: `Marks recorded successfully for ${exam.get('title')}.` });
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

      const markRecords = await ExamMark.findAll({
        where: { studentId: student.id },
        include: [
          {
            model: Exam,
            as: 'exam',
            where: { isPublished: true },
            include: [{ model: Subject, as: 'subject' }]
          }
        ],
        order: [
          [{ model: Exam, as: 'exam' }, 'examDate', 'DESC']
        ]
      });

      const marks = markRecords.map(m => m.get({ plain: true }));

      const validPcts = marks
        .filter((m: any) => !m.isAbsent && m.marksObtained !== null && m.exam && m.exam.maxMarks > 0)
        .map((m: any) => (Number(m.marksObtained) / m.exam.maxMarks) * 100);

      const overallAverage = validPcts.length > 0
        ? Math.round((validPcts.reduce((a: number, b: number) => a + b, 0) / validPcts.length) * 10) / 10
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
