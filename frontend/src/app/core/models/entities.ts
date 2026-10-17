export interface User {
  id: number;
  username: string;
  email: string;
  role: 'owner' | 'mentor' | 'student';
  profilePicture?: string | null;
  designation?: string | null;
  bio?: string | null;
  streamId?: number | null;
  stream?: Stream | null;
  isActive: boolean;
  createdAt?: string;
  studentProfile?: StudentProfile;
  assignedSubjects?: Subject[];
}

export interface Stream {
  id: number;
  name: string;
  code: string;
  applicableClasses: string;
  description?: string | null;
  isActive: boolean;
  subjects?: Subject[];
  _count?: { students: number; subjects: number };
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  targetClass: number;
  streamId?: number | null;
  stream?: Stream | null;
  monthlyFee: number;
  description?: string | null;
  isActive: boolean;
  assignedMentors?: { id: number; username: string; email: string }[];
  _count?: { studentAssociations: number; exams: number };
}

export interface StudentSubject {
  id: number;
  studentId: number;
  subjectId: number;
  enrolledDate: string;
  status: 'Active' | 'Dropped' | 'Completed';
  subject?: Subject;
}

export interface StudentProfile {
  id: number;
  userId: number;
  enrollmentNo: string;
  firstName: string;
  lastName: string;
  gender?: string | null;
  dob?: string | null;
  contactNumber?: string | null;
  parentName?: string | null;
  parentContact?: string | null;
  parentEmail?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  targetClass: number;
  academicYear: string;
  streamId?: number | null;
  stream?: Stream | null;
  isStreamLocked: boolean;
  isSubjectLocked: boolean;
  admissionDate: string;
  notes?: string | null;
  user?: User;
  subjectEnrollments?: StudentSubject[];
  studentSubjects?: any[];
  attendanceRecords?: Attendance[];
  feeStructures?: FeeStructure[];
  feePayments?: FeePayment[];
  examMarks?: ExamMark[];
  changeRequests?: SubjectChangeRequest[];
  homeworkStatuses?: StudentHomeworkStatus[];
}

export interface Attendance {
  id: number;
  studentId: number;
  date: string;
  targetClass: number;
  subjectId?: number | null;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string | null;
  markedById?: number | null;
  student?: StudentProfile;
  subject?: Subject | null;
}

export interface FeeStructure {
  id: number;
  studentId: number;
  academicYear: string;
  totalAnnualFee: number;
  discountAmount: number;
  discountReason?: string | null;
  finalFee: number;
  paidAmount: number;
  dueAmount: number;
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  createdAt: string;
  payments?: FeePayment[];
  student?: StudentProfile;
}

export interface FeePayment {
  id: number;
  receiptNo: string;
  feeStructureId: number;
  studentId: number;
  amount: number;
  paymentDate: string;
  paymentMode: 'Cash' | 'UPI' | 'Net Banking' | 'Cheque';
  referenceNo?: string | null;
  remarks?: string | null;
  receivedById?: number | null;
  isVerified: boolean;
  verifiedAt?: string | null;
  submittedByStudent: boolean;
  createdAt: string;
  student?: StudentProfile;
  feeStructure?: FeeStructure;
  receivedBy?: { username: string; role: string };
}

export interface Exam {
  id: number;
  title: string;
  examType: string;
  targetClass: number;
  subjectId: number;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
  description?: string | null;
  isPublished: boolean;
  subject?: Subject;
  marks?: ExamMark[];
  averageMarks?: number;
  highestMarks?: number;
  _count?: { marks: number };
}

export interface ExamMark {
  id: number;
  examId: number;
  studentId: number;
  marksObtained?: number | null;
  isAbsent: boolean;
  grade?: string | null;
  remarks?: string | null;
  exam?: Exam;
  student?: StudentProfile;
}

export type Timetable = TimetableSlot;

export interface TimetableSlot {
  id: number;
  targetClass: number;
  dayOfWeek: string;
  subjectId: number;
  startTime: string;
  endTime: string;
  roomNo: string;
  mentorName: string;
  mentorId?: number | null;
  subject?: Subject;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  targetClass: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  createdById?: number | null;
  createdAt: string;
  isActive: boolean;
  createdBy?: { username: string; role: string };
}

export interface Homework {
  id: number;
  title: string;
  description: string;
  targetClass: number;
  subjectId: number;
  assignedDate: string;
  dueDate: string;
  assignedById?: number | null;
  createdAt: string;
  subject?: Subject;
  assignedBy?: { username: string };
  myStatus?: StudentHomeworkStatus | null;
  statuses?: StudentHomeworkStatus[];
}

export interface StudentHomeworkStatus {
  id: number;
  homeworkId: number;
  studentId: number;
  status: 'Assigned' | 'Completed' | 'Late';
  completionDate?: string | null;
  mentorFeedback?: string | null;
  student?: StudentProfile;
}

export interface SubjectChangeRequest {
  id: number;
  studentId: number;
  requestType: string;
  details: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  mentorRemarks?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: StudentProfile;
}

export interface InstituteSettings {
  id: number;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  mailServer: string;
  mailPort: number;
  mailUsername?: string | null;
  mailPassword?: string | null;
}

export interface Testimonial {
  id: number;
  studentName: string;
  scoreBadge: string;
  batchInfo: string;
  quote: string;
  isFeatured: boolean;
  createdAt?: string;
}
