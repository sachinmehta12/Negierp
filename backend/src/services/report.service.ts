import { prisma } from '../config/prisma';

export class ReportService {
  private static escapeCsvCell(val: any): string {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  static async generateStudentsCsv(): Promise<string> {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: true,
        stream: true
      },
      orderBy: [
        { targetClass: 'asc' },
        { enrollmentNo: 'asc' }
      ]
    });

    const headers = [
      'Enrollment No', 'First Name', 'Last Name', 'Class', 'Stream',
      'Email', 'Contact Number', 'Parent Name', 'Parent Contact', 'Status'
    ];

    const rows = students.map(s => [
      s.enrollmentNo,
      s.firstName,
      s.lastName,
      s.targetClass,
      s.stream ? s.stream.name : 'General',
      s.user.email,
      s.contactNumber || '',
      s.parentName || '',
      s.parentContact || '',
      s.user.isActive ? 'Active' : 'Archived'
    ]);

    return [
      headers.map(this.escapeCsvCell).join(','),
      ...rows.map(row => row.map(this.escapeCsvCell).join(','))
    ].join('\n');
  }

  static async generateFeesCsv(): Promise<string> {
    const payments = await prisma.feePayment.findMany({
      include: {
        student: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    const headers = [
      'Receipt No', 'Enrollment No', 'Student Name', 'Class', 'Amount Paid',
      'Payment Date', 'Payment Mode', 'Reference No', 'Remarks', 'Verification Status'
    ];

    const rows = payments.map(p => [
      p.receiptNo,
      p.student.enrollmentNo,
      `${p.student.firstName} ${p.student.lastName}`,
      p.student.targetClass,
      p.amount,
      p.paymentDate.toISOString().split('T')[0],
      p.paymentMode,
      p.referenceNo || '',
      p.remarks || '',
      p.isVerified ? 'Verified' : 'Pending'
    ]);

    return [
      headers.map(this.escapeCsvCell).join(','),
      ...rows.map(row => row.map(this.escapeCsvCell).join(','))
    ].join('\n');
  }

  static async generateMarksCsv(): Promise<string> {
    const marks = await prisma.examMark.findMany({
      include: {
        exam: {
          include: { subject: true }
        },
        student: true
      },
      orderBy: {
        exam: { examDate: 'desc' }
      }
    });

    const headers = [
      'Exam Title', 'Exam Type', 'Class', 'Subject', 'Enrollment No',
      'Student Name', 'Marks Obtained', 'Max Marks', 'Grade', 'Remarks'
    ];

    const rows = marks.map(m => [
      m.exam.title,
      m.exam.examType,
      m.exam.targetClass,
      m.exam.subject.name,
      m.student.enrollmentNo,
      `${m.student.firstName} ${m.student.lastName}`,
      m.isAbsent ? 'Absent' : (m.marksObtained !== null ? m.marksObtained : 'N/A'),
      m.exam.maxMarks,
      m.grade || '',
      m.remarks || ''
    ]);

    return [
      headers.map(this.escapeCsvCell).join(','),
      ...rows.map(row => row.map(this.escapeCsvCell).join(','))
    ].join('\n');
  }

  static async generateAttendanceCsv(): Promise<string> {
    const records = await prisma.attendance.findMany({
      include: {
        student: true,
        subject: true
      },
      orderBy: { date: 'desc' }
    });

    const headers = [
      'Date', 'Enrollment No', 'Student Name', 'Class', 'Subject', 'Status', 'Remarks'
    ];

    const rows = records.map(r => [
      r.date.toISOString().split('T')[0],
      r.student.enrollmentNo,
      `${r.student.firstName} ${r.student.lastName}`,
      r.targetClass,
      r.subject ? r.subject.name : 'General Institute',
      r.status,
      r.remarks || ''
    ]);

    return [
      headers.map(this.escapeCsvCell).join(','),
      ...rows.map(row => row.map(this.escapeCsvCell).join(','))
    ].join('\n');
  }
}
