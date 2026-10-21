# NEGI TUTORIALS — Migration & Re-Architecture Task Tracker
**From Python (Flask + SQLAlchemy + Jinja2) to Angular 19 + Node.js (Express + TypeScript) + MySQL (Sequelize ORM)**

---

## 📌 Project Overview
- **Project Name**: NEGI TUTORIALS
- **Tagline**: Learn • Grow • Succeed
- **Author / Credit**: Made by Sachin Mehta
- **Architecture**:
  - **Frontend**: Angular 19 (TypeScript, SCSS, Standalone Components, Reactive Forms, Modular SaaS Layout)
  - **Backend**: Node.js + Express.js + TypeScript (REST API with JWT Auth, Role Verification, CSV Exports)
  - **Database & ORM**: MySQL + Sequelize ORM
  - **Run Commands**:
    - Backend: `npm run dev` (Runs using `nodemon --exec ts-node src/index.ts`)
    - Frontend: `npm run dev` (Runs using `ng serve`)

---

## 🚀 Execution Phases & Progress

### Phase 1: Archive Extraction, Deep Code Analysis & Monorepo Setup
- [x] Extract `NEGI TUTORIALS.zip` and inspect entire Python Flask codebase (`app/models.py`, `app/mentor/routes.py`, `app/student/routes.py`, `app/auth/routes.py`, `seed_data.py`, `base.html`, `style.css`)
- [x] Restructure `frontend/` directory so that Angular root files (`package.json`, `angular.json`, `src/`) reside cleanly in `frontend/`
- [x] Configure `"dev": "ng serve"` in `frontend/package.json`
- [x] Copy static institute assets (`logo.jpg`) to `frontend/public/assets/logo.jpg`
- [x] Initialize backend structure in `backend/` with Express, TypeScript, Nodemon, Prisma, JWT, bcrypt, zod, cors
- [x] Create comprehensive `task.md` tracking roadmap and execution reasons

### Phase 2: Backend Architecture & Prisma ORM Engine
- [x] Define PostgreSQL schema in `backend/prisma/schema.prisma` mapping 100% of the Flask database entities:
  - `User` (owner, mentor, student)
  - `StudentProfile` (academic year, enrollment number, target class 10/11/12, stream, stream/subject locks, emergency contacts)
  - `Stream` (PCM, PCB, COMM, ARTS)
  - `Subject` (name, code, target_class, monthly_fee, stream_id)
  - `StudentSubject` (unique student-subject active/dropped enrollment)
  - `MentorSubject` (many-to-many mentor-subject assignment)
  - `Attendance` (Present, Absent, Late, Excused, date, remarks, marked_by)
  - `FeeStructure` (total annual fee, discount, final fee, paid amount, due amount, status Paid/Partial/Pending)
  - `FeePayment` (receipt number, amount, payment mode, reference no, verified status, submitted_by_student)
  - `Exam` & `ExamMark` (title, max marks, passing marks, marks obtained, absent flag, calculated grade A+ through F / Ab)
  - `Timetable` (target class, day of week, time slots, room, mentor)
  - `Announcement` (title, content, target class, priority Normal/Important/Urgent)
  - `Homework` & `StudentHomeworkStatus` (due date, status Assigned/Completed/Late, mentor feedback)
  - `SubjectChangeRequest` (stream/subject change request, status Pending/Approved/Rejected)
- [x] Implement Prisma seeder `backend/prisma/seed.ts` with foundational institute data & demo roster
- [x] Build Core Backend Services:
  - JWT Auth & Password Hashing Service
  - Fee Recalculation Service (exact logic: only verified payments reduce due amount)
  - Academic Grade Calculation Service (A+, A, B+, B, C, D, F, Ab)
  - Attendance Percentage Calculator Service ((Present + Late) / Total * 100.0)
  - CSV Export Engine (Students, Fees, Marks, Attendance)
- [x] Implement Security Middlewares:
  - `auth.middleware.ts` (JWT verification)
  - `role.middleware.ts` (Owner, Mentor, Student guards)
  - `error.middleware.ts` (Structured JSON error responses)
- [x] Implement REST Controllers & Modular Routes:
  - `POST /api/auth/login`, `POST /api/auth/register-student`, `POST /api/auth/register-mentor`, `POST /api/auth/change-password`, `GET /api/auth/me`
  - `/api/students`: CRUD, toggle active, assign subjects, student profile
  - `/api/streams` & `/api/subjects`: 100% Dynamic CRUD, monthly fees, mentor assignment
  - `/api/attendance`: Daily register marking, class & date filters, student view
  - `/api/fees`: Fee structures, payments, single & batch verification, rejection, student submission, receipt generation
  - `/api/exams`: Exam scheduling, marksheet entry, auto-grading, student report card
  - `/api/timetable`: Weekly slots by day of week (Mon-Sat), class & mentor filters
  - `/api/announcements`: Priority broadcasts, class targeting
  - `/api/homework`: Assignment creation, student status toggle, mentor review
  - `/api/change-requests`: Student submission, mentor approval with auto stream/subject unlocking
  - `/api/analytics`: Class-wise metrics, subject performance, top performers, financial totals
  - `/api/reports`: CSV export endpoints for Students, Fees, Marks, Attendance
  - `/api/faculty`: Owner-only faculty management (CRUD, subjects assignment, toggle active)
  - `/api/settings`: Institute name, tagline, address, SMTP configuration

### Phase 3: Frontend Core Architecture & Design System
- [x] Build Global Design System in `frontend/src/styles.scss`:
  - Deep slate navy (`#0f172a`), royal blue (`#2563eb`), sky blue (`#38bdf8`), emerald (`#10b981`), amber, crimson
  - Glassmorphic panels, responsive cards, modern typography (Plus Jakarta Sans & Inter), crisp tables, badge pills
- [x] Create Core TypeScript Models (`frontend/src/app/core/models/entities.ts`):
  - User, Student, Stream, Subject, Attendance, Fee, Exam, Timetable, Announcement, Homework, ChangeRequest
- [x] Implement Singleton Services (`frontend/src/app/core/services/`):
  - `AuthService` (signals, JWT storage, role verification)
  - `ApiService` (typed HTTP client connecting to backend)
  - `NotificationService` (toast notifications)
- [x] Implement Interceptors & Guards (`frontend/src/app/core/`):
  - `JwtInterceptor` (injects Bearer token)
  - `ErrorInterceptor` (handles 401 and auto-redirect)
  - `AuthGuard` & `RoleGuard` (Owner, Mentor, Student functional guards)
- [x] Implement Shared Layout & Components (`frontend/src/app/shared/`, strictly 4 files each):
  - `SidebarComponent`: Full collapsible navigation, user info, avatar, role badges, watermark "Made by Sachin Mehta"
  - `HeaderComponent`: Mobile hamburger drawer, page title, quick actions, user menu
  - `ModalComponent`: Reusable responsive modal
  - `ToastComponent`: Live notification toasts

### Phase 4: Frontend Feature Modules & 100% Dynamic UI
- [x] **Auth Module (`frontend/src/app/modules/auth/`, 4 files each)**:
  - `LoginComponent`: Modern split screen with demo credentials quick-fill
  - `RegisterComponent`: Tabs for Student Self-Registration (stream selection, auto-enrollment) and Mentor Registration
  - `ChangePasswordComponent`: Secure credential updates
- [x] **Owner & Mentor Management Modules (`frontend/src/app/modules/mentor/`, 4 files each)**:
  - `DashboardComponent`: Metrics cards (total students, classes 10/11/12, fee collected/due, attendance %, recent exams, today's schedule)
  - `StudentsListComponent`: Class filter, stream filter, status filter, search query, quick actions
  - `StudentDetailComponent`: Comprehensive 360-degree view (personal details, assigned subjects, attendance records, fee history, marks)
  - `StudentFormComponent`: Full interactive form to admit or edit student
  - `SubjectsComponent`: 100% dynamic UI to create/edit academic streams, subjects, monthly fees
  - `MySubjectsComponent`: Mentor subject self-selection
  - `AttendanceComponent`: Interactive attendance register (Present, Late, Absent, Excused buttons, date picker, quick Mark All Present)
  - `FeesComponent`: Fee accounts table, pending payments with batch verification ticks, single-click verify/reject, record payment modal, adjust fee structure modal
  - `FeeReceiptComponent`: Official printable receipt with institute branding, receipt number, student details
  - `ExamsComponent`: Exam schedule list, create/edit exam modal
  - `ExamMarksComponent`: Marksheet table with live grade computation (A+, A, B+, B, C, D, F, Ab)
  - `TimetableComponent`: Weekly timetable organized by day (Monday to Saturday), add slot modal, delete slot
  - `AnnouncementsComponent`: Broadcast board with priority badges, delete action
  - `HomeworkComponent`: Create homework modal, student completion status tracker, mentor feedback
  - `StreamRequestsComponent`: Review pending stream/subject change requests, approve (auto-unlocks student) or reject
  - `AnalyticsComponent`: Performance graphs, class stats, subject averages, top students
  - `ReportsComponent`: One-click CSV export buttons for all institute reports
  - `FacultyComponent`: (Owner only) Faculty roster, add faculty modal, edit, assign subjects, toggle active
  - `SettingsComponent`: Institute profile (name, tagline, phone, email, address, SMTP settings)
- [x] **Student Portal Module (`frontend/src/app/modules/student/`, 4 files each)**:
  - `StudentDashboardComponent`: Welcome banner, attendance meter, pending fees alert, upcoming exams, today's timetable, announcements
  - `ProfileComponent`: View profile details, edit contact numbers & address
  - `StreamSelectionComponent`: Select academic stream (Class 11/12) with lock status
  - `SubjectSelectionComponent`: Select coaching subjects with monthly fee totals and lock status
  - `AttendanceComponent`: Monthly attendance logs, attendance rate percentage meter
  - `FeesComponent`: Fee summary, payment history, official receipt view, online fee payment submission modal
  - `MarksComponent`: Academic marks list, percentage chart, grade badges
  - `TimetableComponent`: Personalized weekly timetable
  - `HomeworkComponent`: Active homework list, "Mark as Completed" button, mentor feedback
  - `AnnouncementsComponent`: Notice board
  - `RequestChangeComponent`: Form to submit stream/subject change request to mentor

### Phase 5: Verification, Validation & Handover
- [x] Verify `npm run dev` in backend with nodemon (`ts-node src/index.ts` on port 5000)
- [x] Verify `npm run dev` in frontend with Angular CLI (`ng serve` on port 4200)
- [x] Verify `ng build` for frontend bundle generation (exit code 0, 0 compiler errors)
- [x] Verify `npx tsc --noEmit` in backend (exit code 0, 0 compiler errors)
- [x] Setup SQLite zero-config database (`backend/prisma/dev.db`), generate Prisma client, and seed demo data (`npm run seed`)
- [x] Verify REST API authentication (`POST /api/auth/login`) with demo credentials
- [x] Verify Frontend HTTP serving on `http://localhost:4200`
### Phase 6: UI Spacing & Un-congestion Overhaul (Completed)
- [x] **Global Shell & Container**:
  - Expanded content body padding from `24px 32px` to `36px 48px` on desktop with max-width container (`1520px`) for optimal readability.
  - Page header typography upgraded (`1.85rem` title with `-0.025em` tracking, spacious subtitle, `32px` margin).
- [x] **Card & Stat Grid System**:
  - Eliminated cramped `minmax(180px, 1fr)` and `minmax(200px, 1fr)` card crush across all modules.
  - Standardized `.stats-grid` to responsive 4-column layout (`repeat(4, minmax(0, 1fr))` with `24px` gaps on desktop, 2-col on tablets, 1-col on mobile).
  - Stat cards given generous padding (`24px 26px`), `56px` icons, `1.95rem` values, and clean label hierarchy.
- [x] **Data Tables & Filter Bars**:
  - Upgraded table cells with spacious padding (`18px 22px`), clean borders, and soft row hover states.
  - Upgraded filter bars with `20px 28px` padding, `320px` search input, and `44px` form controls.
- [x] **Sidebar & Header**:
  - Widened header padding to `48px` with glassmorphic backdrop blur.
  - Sidebar items given comfortable `10px 16px` padding, `14px` gaps, and refined user profile chip.
- [x] **Timetable & Lists**:
  - Timetable columns upgraded from `220px` to `270px` min-width with generous `1.5rem` gaps.
  - Dashboard schedule, exam, and announcement items given `16px 20px` padding with clean hover elevations.
- [x] **Login Page**:
  - Expanded login card from `440px` to `480px` with `44px 48px` padding and spacious inputs.

### Phase 7: Dead Folder & Code Cleanup (Completed)
- [x] **Removed Obsolete Legacy Codebases**:
  - Removed `flask_reference/` folder (~116 MB containing legacy Flask models, blueprints, virtualenv `venv/`, and `cloudflared.exe` binary).
  - Removed legacy migration archive `NEGI TUTORIALS.zip` (47 MB).
  - Removed accidental nested uncommitted `.git` repository inside `frontend/`.
- [x] **Eliminated Dead Code, Unused Imports & Unused Parameters**:
  - `frontend`: Removed unused `Router` in `FeeReceiptComponent` and `HomeComponent`, removed unused `res` in `DashboardComponent`, properly typed `Homework` entity in `StudentHomeworkComponent`.
  - `backend`: Removed unused `TokenPayload` import in `auth.middleware.ts`, prefixed unused `req`/`res`/`next` parameters across controllers (`analytics`, `faculty`, `report`, `settings`, `stream`, `error.middleware`, and server `index.ts`).
  - Added clean `.gitignore` configurations for monorepo root and backend.
- [x] **Verified Zero Errors Across Entire Stack**:
  - Backend: `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` (0 errors, exit code 0).
  - Frontend: `npx tsc -p tsconfig.app.json --noEmit --noUnusedLocals --noUnusedParameters` (0 errors, exit code 0).
  - Production build: `ng build` (0 compiler errors, exit code 0).

### Phase 8: Dynamic Zero-State Architecture & Dummy Seed Data Purge (Completed)
- [x] **Database Zero-State Purge**:
  - Wiped all dummy demo students (profiles, enrollments, user records).
  - Wiped all dummy fee structures and payment transactions.
  - Wiped dummy attendance records, exams, marks, homework, change requests.
  - Wiped hardcoded timetable slots and announcements.
  - Retained core foundational system accounts (`owner` / `Password123`, `mentor` / `Password123`), academic streams (PCM, PCB, COMM, ARTS), subject catalog, and institute settings.
- [x] **Dynamic Metric Recalculations**:
  - Total Enrolled Students starts at `0`.
  - Class distribution (10, 11, 12) starts at `0%` (fixed fallback 33% calculation in `dashboard.component.ts`).
  - Fees verified & collected starts at `₹0`, fees due starts at `₹0`.
  - Overall Attendance Rate starts at `0%` (updated `AttendanceService.calculatePercentage` to default to `0.0` when no attendance records exist).
  - Cleaned `backend/prisma/seed.ts` so future seeds only initialize core admin and academic catalog without dummy records.
- [x] **Verified Live Addition & Recalculation**:
  - Verified that admitting a student or registering immediately increments counts, updates class distribution, and calculates due amounts dynamically.

### Phase 9: MySQL Database & Sequelize ORM Engine Migration (Completed)
- [x] **Complete Transition to MySQL & Sequelize ORM**:
  - Replaced Prisma ORM with Sequelize ORM (`sequelize` v6 + `mysql2`).
  - Defined 17 complete Sequelize relational models in `backend/src/models/index.ts` with explicit camelCase TypeScript attributes mapped to snake_case MySQL database columns (`users`, `streams`, `subjects`, `student_profiles`, `student_subjects`, `subject_change_requests`, `attendance`, `fee_structures`, `fee_payments`, `exams`, `exam_marks`, `timetable`, `announcements`, `homework`, `student_homework_status`, `institute_settings`, `testimonials`).
  - Configured all relational associations (One-to-One, One-to-Many, Many-to-Many via `_MentorSubjects`).
- [x] **Controller & Service Layer Migration**:
  - Migrated `auth.middleware.ts` to Sequelize ORM.
  - Migrated `fee.service.ts` and `report.service.ts` to Sequelize ORM.
  - Migrated all 16 controllers (`auth`, `student`, `attendance`, `fee`, `exam`, `faculty`, `homework`, `subject`, `stream`, `timetable`, `analytics`, `announcement`, `change-request`, `settings`, `testimonial`, `report`) from Prisma to Sequelize ORM.
- [x] **Sequelize MySQL Seeder**:
  - Created `backend/src/seed.ts` to connect to MySQL, sync tables via `sequelize.sync({ alter: true })`, and seed foundational administrators (`owner`, `mentor`), academic streams, and subject catalog.
- [x] **Purge PostgreSQL and Prisma Residue**:
  - Deleted `backend/prisma/` directory (`schema.prisma`, `schema.postgresql.prisma`, `seed.ts`, `dev.db`).
  - Removed `@prisma/client` and `prisma` dependencies and scripts from `backend/package.json`.
  - Deleted `backend/src/config/prisma.ts`.
  - Updated `backend/.env` and `backend/.env.example` to pure MySQL connection settings.
- [x] **Zero Error Compilation**:
  - Tested backend compilation using `npx tsc --noEmit` (0 errors, exit code 0).

---

## 🟢 Current Runtime Status

Both services are configured for production grade:
- **Backend API**: `http://localhost:5000` (Health: `http://localhost:5000/api/health`)
- **Frontend SPA**: `http://localhost:4200`
- **Database**: MySQL (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`) powered by **Sequelize ORM**.
