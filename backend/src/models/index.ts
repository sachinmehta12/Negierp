import { DataTypes, Model, Op } from 'sequelize';
import sequelize from '../config/database';

// 1. User Model
export class User extends Model<any, any> {
  [key: string]: any;
}
User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(191), unique: true, allowNull: false },
  email: { type: DataTypes.STRING(191), unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
  role: { type: DataTypes.STRING(50), defaultValue: 'student' },
  profilePicture: { type: DataTypes.STRING(255), allowNull: true, field: 'profile_picture' },
  designation: { type: DataTypes.STRING(191), allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  streamId: { type: DataTypes.INTEGER, allowNull: true, field: 'stream_id' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' }
}, {
  sequelize,
  tableName: 'users',
  timestamps: false,
  underscored: true
});

// 2. Stream Model
export class Stream extends Model<any, any> {
  [key: string]: any;
}
Stream.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(191), unique: true, allowNull: false },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  applicableClasses: { type: DataTypes.STRING(50), defaultValue: '11,12', field: 'applicable_classes' },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
}, {
  sequelize,
  tableName: 'streams',
  timestamps: false,
  underscored: true
});

// 3. Subject Model
export class Subject extends Model<any, any> {
  [key: string]: any;
}
Subject.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(191), allowNull: false },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  targetClass: { type: DataTypes.INTEGER, allowNull: false, field: 'target_class' },
  streamId: { type: DataTypes.INTEGER, allowNull: true, field: 'stream_id' },
  monthlyFee: { type: DataTypes.DOUBLE, defaultValue: 1500.0, field: 'monthly_fee' },
  description: { type: DataTypes.TEXT, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
}, {
  sequelize,
  tableName: 'subjects',
  timestamps: false,
  underscored: true
});

// 4. StudentProfile Model
export class StudentProfile extends Model<any, any> {
  [key: string]: any;
}
StudentProfile.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, unique: true, allowNull: false, field: 'user_id' },
  enrollmentNo: { type: DataTypes.STRING(100), unique: true, allowNull: false, field: 'enrollment_no' },
  firstName: { type: DataTypes.STRING(100), allowNull: false, field: 'first_name' },
  lastName: { type: DataTypes.STRING(100), allowNull: false, field: 'last_name' },
  gender: { type: DataTypes.STRING(20), allowNull: true },
  dob: { type: DataTypes.DATE, allowNull: true },
  contactNumber: { type: DataTypes.STRING(50), allowNull: true, field: 'contact_number' },
  parentName: { type: DataTypes.STRING(100), allowNull: true, field: 'parent_name' },
  parentContact: { type: DataTypes.STRING(50), allowNull: true, field: 'parent_contact' },
  parentEmail: { type: DataTypes.STRING(100), allowNull: true, field: 'parent_email' },
  address: { type: DataTypes.TEXT, allowNull: true },
  emergencyContact: { type: DataTypes.STRING(50), allowNull: true, field: 'emergency_contact' },
  targetClass: { type: DataTypes.INTEGER, allowNull: false, field: 'target_class' },
  academicYear: { type: DataTypes.STRING(50), defaultValue: '2026-2027', field: 'academic_year' },
  streamId: { type: DataTypes.INTEGER, allowNull: true, field: 'stream_id' },
  isStreamLocked: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_stream_locked' },
  isSubjectLocked: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_subject_locked' },
  admissionDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'admission_date' },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  tableName: 'student_profiles',
  timestamps: false,
  underscored: true
});

// 5. StudentSubject Model
export class StudentSubject extends Model<any, any> {
  [key: string]: any;
}
StudentSubject.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
  subjectId: { type: DataTypes.INTEGER, allowNull: false, field: 'subject_id' },
  enrolledDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'enrolled_date' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Active' }
}, {
  sequelize,
  tableName: 'student_subjects',
  timestamps: false,
  underscored: true,
  indexes: [{ unique: true, fields: ['student_id', 'subject_id'], name: 'uq_student_subject' }]
});

// 6. SubjectChangeRequest Model
export class SubjectChangeRequest extends Model<any, any> {
  [key: string]: any;
}
SubjectChangeRequest.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
  requestType: { type: DataTypes.STRING(100), allowNull: false, field: 'request_type' },
  details: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.STRING(50), defaultValue: 'Pending' },
  mentorRemarks: { type: DataTypes.TEXT, allowNull: true, field: 'mentor_remarks' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' }
}, {
  sequelize,
  tableName: 'subject_change_requests',
  timestamps: false,
  underscored: true
});

// 7. Attendance Model
export class Attendance extends Model<any, any> {
  [key: string]: any;
}
Attendance.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
  date: { type: DataTypes.DATE, allowNull: false },
  targetClass: { type: DataTypes.INTEGER, allowNull: false, field: 'target_class' },
  subjectId: { type: DataTypes.INTEGER, allowNull: true, field: 'subject_id' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Present' },
  remarks: { type: DataTypes.TEXT, allowNull: true },
  markedById: { type: DataTypes.INTEGER, allowNull: true, field: 'marked_by_id' }
}, {
  sequelize,
  tableName: 'attendance',
  timestamps: false,
  underscored: true,
  indexes: [{ unique: true, fields: ['student_id', 'date', 'subject_id'], name: 'uq_student_date_subject' }]
});

// 8. FeeStructure Model
export class FeeStructure extends Model<any, any> {
  [key: string]: any;
}
FeeStructure.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
  academicYear: { type: DataTypes.STRING(50), defaultValue: '2026-2027', field: 'academic_year' },
  totalAnnualFee: { type: DataTypes.DOUBLE, allowNull: false, field: 'total_annual_fee' },
  discountAmount: { type: DataTypes.DOUBLE, defaultValue: 0.0, field: 'discount_amount' },
  discountReason: { type: DataTypes.STRING(255), allowNull: true, field: 'discount_reason' },
  finalFee: { type: DataTypes.DOUBLE, allowNull: false, field: 'final_fee' },
  paidAmount: { type: DataTypes.DOUBLE, defaultValue: 0.0, field: 'paid_amount' },
  dueAmount: { type: DataTypes.DOUBLE, allowNull: false, field: 'due_amount' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Pending' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' }
}, {
  sequelize,
  tableName: 'fee_structures',
  timestamps: false,
  underscored: true
});

// 9. FeePayment Model
export class FeePayment extends Model<any, any> {
  [key: string]: any;
}
FeePayment.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  receiptNo: { type: DataTypes.STRING(100), unique: true, allowNull: false, field: 'receipt_no' },
  feeStructureId: { type: DataTypes.INTEGER, allowNull: false, field: 'fee_structure_id' },
  studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
  amount: { type: DataTypes.DOUBLE, allowNull: false },
  paymentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'payment_date' },
  paymentMode: { type: DataTypes.STRING(50), defaultValue: 'UPI', field: 'payment_mode' },
  referenceNo: { type: DataTypes.STRING(100), allowNull: true, field: 'reference_no' },
  remarks: { type: DataTypes.TEXT, allowNull: true },
  receivedById: { type: DataTypes.INTEGER, allowNull: true, field: 'received_by_id' },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_verified' },
  verifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'verified_at' },
  submittedByStudent: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'submitted_by_student' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' }
}, {
  sequelize,
  tableName: 'fee_payments',
  timestamps: false,
  underscored: true
});

// 10. Exam Model
export class Exam extends Model<any, any> {
  [key: string]: any;
}
Exam.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(191), allowNull: false },
  examType: { type: DataTypes.STRING(50), defaultValue: 'Unit Test', field: 'exam_type' },
  targetClass: { type: DataTypes.INTEGER, allowNull: false, field: 'target_class' },
  subjectId: { type: DataTypes.INTEGER, allowNull: false, field: 'subject_id' },
  examDate: { type: DataTypes.DATE, allowNull: false, field: 'exam_date' },
  maxMarks: { type: DataTypes.DOUBLE, defaultValue: 100.0, field: 'max_marks' },
  passingMarks: { type: DataTypes.DOUBLE, defaultValue: 33.0, field: 'passing_marks' },
  description: { type: DataTypes.TEXT, allowNull: true },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_published' }
}, {
  sequelize,
  tableName: 'exams',
  timestamps: false,
  underscored: true
});

// 11. ExamMark Model
export class ExamMark extends Model<any, any> {
  [key: string]: any;
}
ExamMark.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  examId: { type: DataTypes.INTEGER, allowNull: false, field: 'exam_id' },
  studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
  marksObtained: { type: DataTypes.DOUBLE, allowNull: true, field: 'marks_obtained' },
  isAbsent: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_absent' },
  grade: { type: DataTypes.STRING(20), allowNull: true },
  remarks: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  tableName: 'exam_marks',
  timestamps: false,
  underscored: true,
  indexes: [{ unique: true, fields: ['exam_id', 'studentId'], name: 'uq_exam_student' }]
});

// 12. Timetable Model
export class Timetable extends Model<any, any> {
  [key: string]: any;
}
Timetable.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  targetClass: { type: DataTypes.INTEGER, allowNull: false, field: 'target_class' },
  dayOfWeek: { type: DataTypes.STRING(50), allowNull: false, field: 'day_of_week' },
  subjectId: { type: DataTypes.INTEGER, allowNull: false, field: 'subject_id' },
  startTime: { type: DataTypes.STRING(50), allowNull: false, field: 'start_time' },
  endTime: { type: DataTypes.STRING(50), allowNull: false, field: 'end_time' },
  roomNo: { type: DataTypes.STRING(100), defaultValue: 'Classroom A', field: 'room_no' },
  mentorName: { type: DataTypes.STRING(100), defaultValue: 'Er. S. Negi', field: 'mentor_name' },
  mentorId: { type: DataTypes.INTEGER, allowNull: true, field: 'mentor_id' }
}, {
  sequelize,
  tableName: 'timetable',
  timestamps: false,
  underscored: true
});

// 13. Announcement Model
export class Announcement extends Model<any, any> {
  [key: string]: any;
}
Announcement.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(191), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  targetClass: { type: DataTypes.STRING(50), defaultValue: 'All', field: 'target_class' },
  priority: { type: DataTypes.STRING(50), defaultValue: 'Normal' },
  createdById: { type: DataTypes.INTEGER, allowNull: true, field: 'created_by_id' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_active' }
}, {
  sequelize,
  tableName: 'announcements',
  timestamps: false,
  underscored: true
});

// 14. Homework Model
export class Homework extends Model<any, any> {
  [key: string]: any;
}
Homework.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(191), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  targetClass: { type: DataTypes.INTEGER, allowNull: false, field: 'target_class' },
  subjectId: { type: DataTypes.INTEGER, allowNull: false, field: 'subject_id' },
  assignedDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'assigned_date' },
  dueDate: { type: DataTypes.DATE, allowNull: false, field: 'due_date' },
  assignedById: { type: DataTypes.INTEGER, allowNull: true, field: 'assigned_by_id' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' }
}, {
  sequelize,
  tableName: 'homework',
  timestamps: false,
  underscored: true
});

// 15. StudentHomeworkStatus Model
export class StudentHomeworkStatus extends Model<any, any> {
  [key: string]: any;
}
StudentHomeworkStatus.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  homeworkId: { type: DataTypes.INTEGER, allowNull: false, field: 'homework_id' },
  studentId: { type: DataTypes.INTEGER, allowNull: false, field: 'student_id' },
  status: { type: DataTypes.STRING(50), defaultValue: 'Assigned' },
  completionDate: { type: DataTypes.DATE, allowNull: true, field: 'completion_date' },
  mentorFeedback: { type: DataTypes.TEXT, allowNull: true, field: 'mentor_feedback' }
}, {
  sequelize,
  tableName: 'student_homework_status',
  timestamps: false,
  underscored: true,
  indexes: [{ unique: true, fields: ['homework_id', 'student_id'], name: 'uq_student_homework' }]
});

// 16. InstituteSettings Model
export class InstituteSettings extends Model<any, any> {
  [key: string]: any;
}
InstituteSettings.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(191), defaultValue: 'NEGI TUTORIALS' },
  tagline: { type: DataTypes.STRING(255), defaultValue: 'Learn • Grow • Succeed' },
  phone: { type: DataTypes.STRING(50), defaultValue: '+91 98765 43210' },
  email: { type: DataTypes.STRING(100), defaultValue: 'contact@negitutorials.com' },
  address: { type: DataTypes.TEXT, defaultValue: 'Plot 12, Sector 4, Main Road, New Delhi, India' },
  mailServer: { type: DataTypes.STRING(100), defaultValue: 'smtp.gmail.com', field: 'mail_server' },
  mailPort: { type: DataTypes.INTEGER, defaultValue: 587, field: 'mail_port' },
  mailUsername: { type: DataTypes.STRING(100), allowNull: true, field: 'mail_username' },
  mailPassword: { type: DataTypes.STRING(100), allowNull: true, field: 'mail_password' },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'updated_at' }
}, {
  sequelize,
  tableName: 'institute_settings',
  timestamps: false,
  underscored: true
});

// 17. Testimonial Model
export class Testimonial extends Model<any, any> {
  [key: string]: any;
}
Testimonial.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentName: { type: DataTypes.STRING(100), allowNull: false, field: 'student_name' },
  scoreBadge: { type: DataTypes.STRING(100), allowNull: false, field: 'score_badge' },
  batchInfo: { type: DataTypes.STRING(100), allowNull: false, field: 'batch_info' },
  quote: { type: DataTypes.TEXT, allowNull: false },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: true, field: 'is_featured' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' }
}, {
  sequelize,
  tableName: 'testimonials',
  timestamps: false,
  underscored: true
});

// ==========================================
// RELATIONSHIPS / ASSOCIATIONS
// ==========================================

// User <-> Stream
User.belongsTo(Stream, { foreignKey: 'streamId', as: 'stream', onDelete: 'SET NULL' });
Stream.hasMany(User, { foreignKey: 'streamId', as: 'mentors' });

// Subject <-> Stream
Subject.belongsTo(Stream, { foreignKey: 'streamId', as: 'stream', onDelete: 'SET NULL' });
Stream.hasMany(Subject, { foreignKey: 'streamId', as: 'subjects' });

// User <-> Subject (Many-to-Many Mentor Assigned Subjects)
User.belongsToMany(Subject, { through: '_MentorSubjects', as: 'assignedSubjects', foreignKey: 'A', otherKey: 'B', timestamps: false });
Subject.belongsToMany(User, { through: '_MentorSubjects', as: 'assignedMentors', foreignKey: 'B', otherKey: 'A', timestamps: false });

// User <-> StudentProfile (One-to-One)
StudentProfile.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasOne(StudentProfile, { foreignKey: 'userId', as: 'studentProfile', onDelete: 'CASCADE' });

// StudentProfile <-> Stream
StudentProfile.belongsTo(Stream, { foreignKey: 'streamId', as: 'stream', onDelete: 'SET NULL' });
Stream.hasMany(StudentProfile, { foreignKey: 'streamId', as: 'students' });

// StudentProfile <-> StudentSubject <-> Subject
StudentSubject.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student', onDelete: 'CASCADE' });
StudentSubject.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject', onDelete: 'CASCADE' });
StudentProfile.hasMany(StudentSubject, { foreignKey: 'studentId', as: 'subjectEnrollments', onDelete: 'CASCADE' });
Subject.hasMany(StudentSubject, { foreignKey: 'subjectId', as: 'studentAssociations', onDelete: 'CASCADE' });

// StudentProfile <-> SubjectChangeRequest
SubjectChangeRequest.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student', onDelete: 'CASCADE' });
StudentProfile.hasMany(SubjectChangeRequest, { foreignKey: 'studentId', as: 'changeRequests', onDelete: 'CASCADE' });

// Attendance
Attendance.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student', onDelete: 'CASCADE' });
Attendance.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject', onDelete: 'SET NULL' });
Attendance.belongsTo(User, { foreignKey: 'markedById', as: 'markedBy', onDelete: 'SET NULL' });
StudentProfile.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendanceRecords', onDelete: 'CASCADE' });

// FeeStructure & FeePayment
FeeStructure.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student', onDelete: 'CASCADE' });
StudentProfile.hasMany(FeeStructure, { foreignKey: 'studentId', as: 'feeStructures', onDelete: 'CASCADE' });

FeePayment.belongsTo(FeeStructure, { foreignKey: 'feeStructureId', as: 'feeStructure', onDelete: 'CASCADE' });
FeePayment.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student', onDelete: 'CASCADE' });
FeePayment.belongsTo(User, { foreignKey: 'receivedById', as: 'receivedBy', onDelete: 'SET NULL' });
FeeStructure.hasMany(FeePayment, { foreignKey: 'feeStructureId', as: 'payments', onDelete: 'CASCADE' });
StudentProfile.hasMany(FeePayment, { foreignKey: 'studentId', as: 'feePayments', onDelete: 'CASCADE' });

// Exam & ExamMark
Exam.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject', onDelete: 'CASCADE' });
Subject.hasMany(Exam, { foreignKey: 'subjectId', as: 'exams', onDelete: 'CASCADE' });

ExamMark.belongsTo(Exam, { foreignKey: 'examId', as: 'exam', onDelete: 'CASCADE' });
ExamMark.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student', onDelete: 'CASCADE' });
Exam.hasMany(ExamMark, { foreignKey: 'examId', as: 'marks', onDelete: 'CASCADE' });
StudentProfile.hasMany(ExamMark, { foreignKey: 'studentId', as: 'examMarks', onDelete: 'CASCADE' });

// Timetable
Timetable.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject', onDelete: 'CASCADE' });
Timetable.belongsTo(User, { foreignKey: 'mentorId', as: 'mentor', onDelete: 'SET NULL' });
Subject.hasMany(Timetable, { foreignKey: 'subjectId', as: 'timetableSlots', onDelete: 'CASCADE' });

// Announcement
Announcement.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy', onDelete: 'SET NULL' });

// Homework & StudentHomeworkStatus
Homework.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject', onDelete: 'CASCADE' });
Homework.belongsTo(User, { foreignKey: 'assignedById', as: 'assignedBy', onDelete: 'SET NULL' });
Subject.hasMany(Homework, { foreignKey: 'subjectId', as: 'homeworkItems', onDelete: 'CASCADE' });

StudentHomeworkStatus.belongsTo(Homework, { foreignKey: 'homeworkId', as: 'homework', onDelete: 'CASCADE' });
StudentHomeworkStatus.belongsTo(StudentProfile, { foreignKey: 'studentId', as: 'student', onDelete: 'CASCADE' });
Homework.hasMany(StudentHomeworkStatus, { foreignKey: 'homeworkId', as: 'statuses', onDelete: 'CASCADE' });

export {
  sequelize,
  Op
};

export default {
  sequelize,
  Op,
  User,
  Stream,
  Subject,
  StudentProfile,
  StudentSubject,
  SubjectChangeRequest,
  Attendance,
  FeeStructure,
  FeePayment,
  Exam,
  ExamMark,
  Timetable,
  Announcement,
  Homework,
  StudentHomeworkStatus,
  InstituteSettings,
  Testimonial
};
