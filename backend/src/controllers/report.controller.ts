import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { ReportService } from '../services/report.service';

export class ReportController {
  static async exportStudents(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const csv = await ReportService.generateStudentsCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="negi_tutorials_students.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to generate students CSV', error: err.message });
    }
  }

  static async exportFees(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const csv = await ReportService.generateFeesCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="negi_tutorials_fees_collected.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to generate fees CSV', error: err.message });
    }
  }

  static async exportMarks(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const csv = await ReportService.generateMarksCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="negi_tutorials_exam_marks.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to generate marks CSV', error: err.message });
    }
  }

  static async exportAttendance(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const csv = await ReportService.generateAttendanceCsv();
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="negi_tutorials_attendance.csv"');
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, message: 'Failed to generate attendance CSV', error: err.message });
    }
  }
}
