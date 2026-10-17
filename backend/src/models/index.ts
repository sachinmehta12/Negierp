import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

// 1. User Model
export class User extends Model {}
User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(191), unique: true, allowNull: false },
  email: { type: DataTypes.STRING(191), unique: true, allowNull: false },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.STRING(50), defaultValue: 'student' },
  profile_picture: { type: DataTypes.STRING(255), allowNull: true },
  designation: { type: DataTypes.STRING(191), allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  stream_id: { type: DataTypes.INTEGER, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, tableName: 'users', timestamps: false, underscored: true });

// 2. Stream Model
export class Stream extends Model {}
Stream.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(191), unique: true, allowNull: false },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  applicable_classes: { type: DataTypes.STRING(50), defaultValue: '11,12' },
  description: { type: DataTypes.TEXT, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, tableName: 'streams', timestamps: false, underscored: true });

// 3. Subject Model
export class Subject extends Model {}
Subject.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(191), allowNull: false },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  target_class: { type: DataTypes.INTEGER, allowNull: false },
  stream_id: { type: DataTypes.INTEGER, allowNull: true },
  monthly_fee: { type: DataTypes.DOUBLE, defaultValue: 1500.0 },
  description: { type: DataTypes.TEXT, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, tableName: 'subjects', timestamps: false, underscored: true });

// 4. StudentProfile Model
export class StudentProfile extends Model {}
StudentProfile.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, unique: true, allowNull: false },
  enrollment_no: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  first_name: { type: DataTypes.STRING(100), allowNull: false },
  last_name: { type: DataTypes.STRING(100), allowNull: false },
  gender: { type: DataTypes.STRING(20), allowNull: true },
  dob: { type: DataTypes.DATE, allowNull: true },
  contact_number: { type: DataTypes.STRING(50), allowNull: true },
  parent_name: { type: DataTypes.STRING(100), allowNull: true },
  parent_contact: { type: DataTypes.STRING(50), allowNull: true },
  parent_email: { type: DataTypes.STRING(100), allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  emergency_contact: { type: DataTypes.STRING(50), allowNull: true },
  target_class: { type: DataTypes.INTEGER, allowNull: false },
  academic_year: { type: DataTypes.STRING(50), defaultValue: '2026-2027' },
  stream_id: { type: DataTypes.INTEGER, allowNull: true },
  is_stream_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_subject_locked: { type: DataTypes.BOOLEAN, defaultValue: false },
  admission_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, tableName: 'student_profiles', timestamps: false, underscored: true });

// 5. StudentSubject Model
export class StudentSubject extends Model {}
StudentSubject.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  enrolled_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.STRING(50), defaultValue: 'Active' }
}, {
  sequelize,
  tableName: 'student_subjects',
  timestamps: false,
  underscored: true,
  indexes: [{ unique: true, fields: ['student_id', 'subject_id'], name: 'uq_student_subject' }]
});

// 6. SubjectChangeRequest Model
export class SubjectChangeRequest extends Model {}
SubjectChangeRequest.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  request_type: { type: DataTypes.STRING(100), allowNull: false },
  details: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.STRING(50), defaultValue: 'Pending' },
  mentor_remarks: { type: DataTypes.TEXT, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, tableName: 'subject_change_requests', timestamps: false, underscored: true });

// 7. Attendance Model
export class Attendance extends Model {}
Attendance.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  target_class: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.STRING(50), defaultValue: 'Present' },
  remarks: { type: DataTypes.TEXT, allowNull: true },
  marked_by_id: { type: DataTypes.INTEGER, allowNull: true }
}, {
  sequelize,
  tableName: 'attendance',
  timestamps: false,
  underscored: true,
  indexes: [{ unique: true, fields: ['student_id', 'date', 'subject_id'], name: 'uq_student_date_subject' }]
});

// 8. FeeStructure Model
export class FeeStructure extends Model {}
FeeStructure.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  academic_year: { type: DataTypes.STRING(50), defaultValue: '2026-2027' },
  total_annual_fee: { type: DataTypes.DOUBLE, allowNull: false },
  discount_amount: { type: DataTypes.DOUBLE, defaultValue: 0.0 },
  discount_reason: { type: DataTypes.STRING(255), allowNull: true },
  final_fee: { type: DataTypes.DOUBLE, allowNull: false },
  paid_amount: { type: DataTypes.DOUBLE, defaultValue: 0.0 },
  due_amount: { type: DataTypes.DOUBLE, allowNull: false },
  status: { type: DataTypes.STRING(50), defaultValue: 'Pending' },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, tableName: 'fee_structures', timestamps: false, underscored: true });

// 9. FeePayment Model
export class FeePayment extends Model {}
FeePayment.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  receipt_no: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  fee_structure_id: { type: DataTypes.INTEGER, allowNull: false },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DOUBLE, allowNull: false },
  payment_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  payment_mode: { type: DataTypes.STRING(50), defaultValue: 'UPI' },
  reference_no: { type: DataTypes.STRING(100), allowNull: true },
  remarks: { type: DataTypes.TEXT, allowNull: true },
  received_by_id: { type: DataTypes.INTEGER, allowNull: true },
  is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verified_at: { type: DataTypes.DATE, allowNull: true },
  submitted_by_student: { type: DataTypes.BOOLEAN, defaultValue: false },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, tableName: 'fee_payments', timestamps: false, underscored: true });

// 10. Exam Model
export class Exam extends Model {}
Exam.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(191), allowNull: false },
  exam_type: { type: DataTypes.STRING(50), defaultValue: 'Unit Test' },
  target_class: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  exam_date: { type: DataTypes.DATE, allowNull: false },
  max_marks: { type: DataTypes.DOUBLE, defaultValue: 100.0 },
  passing_marks: { type: DataTypes.DOUBLE, defaultValue: 33.0 },
  description: { type: DataTypes.TEXT, allowNull: true },
  is_published: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, tableName: 'exams', timestamps: false, underscored: true });

// 11. ExamMark Model
export class ExamMark extends Model {}
ExamMark.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  exam_id: { type: DataTypes.INTEGER, allowNull: false },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  marks_obtained: { type: DataTypes.DOUBLE, allowNull: true },
  is_absent: { type: DataTypes.BOOLEAN, defaultValue: false },
  grade: { type: DataTypes.STRING(20), allowNull: true },
  remarks: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  tableName: 'exam_marks',
  timestamps: false,
  underscored: true,
  indexes: [{ unique: true, fields: ['exam_id', 'student_id'], name: 'uq_exam_student' }]
});

// 12. Timetable Model
export class Timetable extends Model {}
Timetable.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  target_class: { type: DataTypes.INTEGER, allowNull: false },
  day_of_week: { type: DataTypes.STRING(50), allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  start_time: { type: DataTypes.STRING(50), allowNull: false },
  end_time: { type: DataTypes.STRING(50), allowNull: false },
  room_no: { type: DataTypes.STRING(100), defaultValue: 'Classroom A' },
  mentor_name: { type: DataTypes.STRING(100), defaultValue: 'Er. S. Negi' },
  mentor_id: { type: DataTypes.INTEGER, allowNull: true }
}, { sequelize, tableName: 'timetable', timestamps: false, underscored: true });

// 13. Announcement Model
export class Announcement extends Model {}
Announcement.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(191), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  target_class: { type: DataTypes.STRING(50), defaultValue: 'All' },
  priority: { type: DataTypes.STRING(50), defaultValue: 'Normal' },
  created_by_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, tableName: 'announcements', timestamps: false, underscored: true });

// 14. Homework Model
export class Homework extends Model {}
Homework.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(191), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  target_class: { type: DataTypes.INTEGER, allowNull: false },
  subject_id: { type: DataTypes.INTEGER, allowNull: false },
  assigned_date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  due_date: { type: DataTypes.DATE, allowNull: false },
  assigned_by_id: { type: DataTypes.INTEGER, allowNull: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, tableName: 'homework', timestamps: false, underscored: true });

// 15. StudentHomeworkStatus Model
export class StudentHomeworkStatus extends Model {}
StudentHomeworkStatus.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  homework_id: { type: DataTypes.INTEGER, allowNull: false },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING(50), defaultValue: 'Assigned' },
  completion_date: { type: DataTypes.DATE, allowNull: true },
  mentor_feedback: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  tableName: 'student_homework_status',
  timestamps: false,
  underscored: true,
  indexes: [{ unique: true, fields: ['homework_id', 'student_id'], name: 'uq_student_homework' }]
});

// 16. InstituteSettings Model
export class InstituteSettings extends Model {}
InstituteSettings.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(191), defaultValue: 'NEGI TUTORIALS' },
  tagline: { type: DataTypes.STRING(255), defaultValue: 'Learn • Grow • Succeed' },
  phone: { type: DataTypes.STRING(50), defaultValue: '+91 98765 43210' },
  email: { type: DataTypes.STRING(100), defaultValue: 'contact@negitutorials.com' },
  address: { type: DataTypes.TEXT, defaultValue: 'Plot 12, Sector 4, Main Road, New Delhi, India' },
  mail_server: { type: DataTypes.STRING(100), defaultValue: 'smtp.gmail.com' },
  mail_port: { type: DataTypes.INTEGER, defaultValue: 587 },
  mail_username: { type: DataTypes.STRING(100), allowNull: true },
  mail_password: { type: DataTypes.STRING(100), allowNull: true },
  updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, tableName: 'institute_settings', timestamps: false, underscored: true });

// 17. Testimonial Model
export class Testimonial extends Model {}
Testimonial.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  student_name: { type: DataTypes.STRING(100), allowNull: false },
  score_badge: { type: DataTypes.STRING(100), allowNull: false },
  batch_info: { type: DataTypes.STRING(100), allowNull: false },
  quote: { type: DataTypes.TEXT, allowNull: false },
  is_featured: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, tableName: 'testimonials', timestamps: false, underscored: true });

// Set Up Relationships / Associations
User.belongsTo(Stream, { foreignKey: 'stream_id', as: 'stream' });
Stream.hasMany(User, { foreignKey: 'stream_id', as: 'mentors' });

Subject.belongsTo(Stream, { foreignKey: 'stream_id', as: 'stream' });
Stream.hasMany(Subject, { foreignKey: 'stream_id', as: 'subjects' });

// Many-to-many: Users (Mentors) <-> Subjects via _MentorSubjects
User.belongsToMany(Subject, { through: '_MentorSubjects', as: 'assignedSubjects', foreignKey: 'A', otherKey: 'B', timestamps: false });
Subject.belongsToMany(User, { through: '_MentorSubjects', as: 'assignedMentors', foreignKey: 'B', otherKey: 'A', timestamps: false });

StudentProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
User.hasOne(StudentProfile, { foreignKey: 'user_id', as: 'studentProfile' });

StudentProfile.belongsTo(Stream, { foreignKey: 'stream_id', as: 'stream', onDelete: 'SET NULL' });
Stream.hasMany(StudentProfile, { foreignKey: 'stream_id', as: 'students' });

StudentSubject.belongsTo(StudentProfile, { foreignKey: 'student_id', as: 'student', onDelete: 'CASCADE' });
StudentSubject.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject', onDelete: 'CASCADE' });
StudentProfile.hasMany(StudentSubject, { foreignKey: 'student_id', as: 'subjectEnrollments' });
Subject.hasMany(StudentSubject, { foreignKey: 'subject_id', as: 'studentAssociations' });

SubjectChangeRequest.belongsTo(StudentProfile, { foreignKey: 'student_id', as: 'student', onDelete: 'CASCADE' });
StudentProfile.hasMany(SubjectChangeRequest, { foreignKey: 'student_id', as: 'changeRequests' });

Attendance.belongsTo(StudentProfile, { foreignKey: 'student_id', as: 'student', onDelete: 'CASCADE' });
Attendance.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject', onDelete: 'SET NULL' });
Attendance.belongsTo(User, { foreignKey: 'marked_by_id', as: 'markedBy', onDelete: 'SET NULL' });
StudentProfile.hasMany(Attendance, { foreignKey: 'student_id', as: 'attendanceRecords' });

FeeStructure.belongsTo(StudentProfile, { foreignKey: 'student_id', as: 'student', onDelete: 'CASCADE' });
StudentProfile.hasMany(FeeStructure, { foreignKey: 'student_id', as: 'feeStructures' });

FeePayment.belongsTo(FeeStructure, { foreignKey: 'fee_structure_id', as: 'feeStructure', onDelete: 'CASCADE' });
FeePayment.belongsTo(StudentProfile, { foreignKey: 'student_id', as: 'student', onDelete: 'CASCADE' });
FeePayment.belongsTo(User, { foreignKey: 'received_by_id', as: 'receivedBy', onDelete: 'SET NULL' });
FeeStructure.hasMany(FeePayment, { foreignKey: 'fee_structure_id', as: 'payments' });
StudentProfile.hasMany(FeePayment, { foreignKey: 'student_id', as: 'feePayments' });

Exam.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject', onDelete: 'CASCADE' });
Subject.hasMany(Exam, { foreignKey: 'subject_id', as: 'exams' });

ExamMark.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam', onDelete: 'CASCADE' });
ExamMark.belongsTo(StudentProfile, { foreignKey: 'student_id', as: 'student', onDelete: 'CASCADE' });
Exam.hasMany(ExamMark, { foreignKey: 'exam_id', as: 'marks' });
StudentProfile.hasMany(ExamMark, { foreignKey: 'student_id', as: 'examMarks' });

Timetable.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject', onDelete: 'CASCADE' });
Timetable.belongsTo(User, { foreignKey: 'mentor_id', as: 'mentor', onDelete: 'SET NULL' });
Subject.hasMany(Timetable, { foreignKey: 'subject_id', as: 'timetableSlots' });

Announcement.belongsTo(User, { foreignKey: 'created_by_id', as: 'createdBy', onDelete: 'SET NULL' });

Homework.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject', onDelete: 'CASCADE' });
Homework.belongsTo(User, { foreignKey: 'assigned_by_id', as: 'assignedBy', onDelete: 'SET NULL' });
Subject.hasMany(Homework, { foreignKey: 'subject_id', as: 'homeworkItems' });

StudentHomeworkStatus.belongsTo(Homework, { foreignKey: 'homework_id', as: 'homework', onDelete: 'CASCADE' });
StudentHomeworkStatus.belongsTo(StudentProfile, { foreignKey: 'student_id', as: 'student', onDelete: 'CASCADE' });
Homework.hasMany(StudentHomeworkStatus, { foreignKey: 'homework_id', as: 'statuses' });

export { sequelize };

export default {
  sequelize,
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
