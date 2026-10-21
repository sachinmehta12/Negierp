import { StudentProfile, User, Stream, FeePayment, ExamMark, Exam, Subject, Attendance } from '../models';

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
    const studentRecords = await StudentProfile.findAll({
      include: [
        { model: User, as: 'user' },
        { model: Stream, as: 'stream' }
      ],
      order: [
        ['targetClass', 'ASC'],
        ['enrollmentNo', 'ASC']
      ]
    });

    const students = studentRecords.map(s => s.get({ plain: true }));

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
      s.user ? s.user.email : '',
      s.contactNumber || '',
      s.parentName || '',
      s.parentContact || '',
      s.user && s.user.isActive ? 'Active' : 'Archived'
    ]);

    return [
      headers.map(this.escapeCsvCell).join(','),
      ...rows.map(row => row.map(this.escapeCsvCell).join(','))
    ].join('\n');
  }

  static async generateFeesCsv(): Promise<string> {
    const paymentRecords = await FeePayment.findAll({
      include: [
        { model: StudentProfile, as: 'student' }
      ],
      order: [['paymentDate', 'DESC']]
    });

    const payments = paymentRecords.map(p => p.get({ plain: true }));

    const headers = [
      'Receipt No', 'Enrollment No', 'Student Name', 'Class', 'Amount Paid',
      'Payment Date', 'Payment Mode', 'Reference No', 'Remarks', 'Verification Status'
    ];

    const rows = payments.map(p => [
      p.receiptNo,
      p.student ? p.student.enrollmentNo : '',
      p.student ? `${p.student.firstName} ${p.student.lastName}` : '',
      p.student ? p.student.targetClass : '',
      p.amount,
      p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : '',
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
    const markRecords = await ExamMark.findAll({
      include: [
        {
          model: Exam,
          as: 'exam',
          include: [{ model: Subject, as: 'subject' }]
        },
        { model: StudentProfile, as: 'student' }
      ],
      order: [
        [{ model: Exam, as: 'exam' }, 'examDate', 'DESC']
      ]
    });

    const marks = markRecords.map(m => m.get({ plain: true }));

    const headers = [
      'Exam Title', 'Exam Type', 'Class', 'Subject', 'Enrollment No',
      'Student Name', 'Marks Obtained', 'Max Marks', 'Grade', 'Remarks'
    ];

    const rows = marks.map(m => [
      m.exam ? m.exam.title : '',
      m.exam ? m.exam.examType : '',
      m.exam ? m.exam.targetClass : '',
      m.exam && m.exam.subject ? m.exam.subject.name : '',
      m.student ? m.student.enrollmentNo : '',
      m.student ? `${m.student.firstName} ${m.student.lastName}` : '',
      m.isAbsent ? 'Absent' : (m.marksObtained !== null && m.marksObtained !== undefined ? m.marksObtained : 'N/A'),
      m.exam ? m.exam.maxMarks : '',
      m.grade || '',
      m.remarks || ''
    ]);

    return [
      headers.map(this.escapeCsvCell).join(','),
      ...rows.map(row => row.map(this.escapeCsvCell).join(','))
    ].join('\n');
  }

  static async generateAttendanceCsv(): Promise<string> {
    const recordsData = await Attendance.findAll({
      include: [
        { model: StudentProfile, as: 'student' },
        { model: Subject, as: 'subject' }
      ],
      order: [['date', 'DESC']]
    });

    const records = recordsData.map(r => r.get({ plain: true }));

    const headers = [
      'Date', 'Enrollment No', 'Student Name', 'Class', 'Subject', 'Status', 'Remarks'
    ];

    const rows = records.map(r => [
      r.date ? new Date(r.date).toISOString().split('T')[0] : '',
      r.student ? r.student.enrollmentNo : '',
      r.student ? `${r.student.firstName} ${r.student.lastName}` : '',
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
