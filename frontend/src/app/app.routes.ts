import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./modules/public/home/home.component').then(m => m.HomeComponent)
  },

  // --- AUTH MODULE ---
  {
    path: 'auth/login',
    loadComponent: () => import('./modules/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./modules/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'auth/change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent)
  },

  // --- MENTOR & OWNER COMMON MODULE ---
  {
    path: 'mentor/dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'mentor/students',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/students-list/students-list.component').then(m => m.StudentsListComponent)
  },
  {
    path: 'mentor/students/new',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/student-form/student-form.component').then(m => m.StudentFormComponent)
  },
  {
    path: 'mentor/students/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/student-detail/student-detail.component').then(m => m.StudentDetailComponent)
  },
  {
    path: 'mentor/students/:id/edit',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/student-form/student-form.component').then(m => m.StudentFormComponent)
  },
  {
    path: 'mentor/subjects',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/subjects/subjects.component').then(m => m.SubjectsComponent)
  },
  {
    path: 'mentor/requests',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/stream-requests/stream-requests.component').then(m => m.StreamRequestsComponent)
  },
  {
    path: 'mentor/my-subjects',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/my-subjects/my-subjects.component').then(m => m.MySubjectsComponent)
  },
  {
    path: 'mentor/attendance',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/attendance/attendance.component').then(m => m.AttendanceComponent)
  },
  {
    path: 'mentor/fees',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/fees/fees.component').then(m => m.FeesComponent)
  },
  {
    path: 'mentor/fees/receipt/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./modules/mentor/fee-receipt/fee-receipt.component').then(m => m.FeeReceiptComponent)
  },
  {
    path: 'mentor/exams',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/exams/exams.component').then(m => m.ExamsComponent)
  },
  {
    path: 'mentor/exams/marks/:id',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/exam-marks/exam-marks.component').then(m => m.ExamMarksComponent)
  },
  {
    path: 'mentor/timetable',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/timetable/timetable.component').then(m => m.TimetableComponent)
  },
  {
    path: 'mentor/homework',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/homework/homework.component').then(m => m.HomeworkComponent)
  },
  {
    path: 'mentor/announcements',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/announcements/announcements.component').then(m => m.AnnouncementsComponent)
  },
  {
    path: 'mentor/analytics',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/analytics/analytics.component').then(m => m.AnalyticsComponent)
  },
  {
    path: 'mentor/reports',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mentor', 'owner'] },
    loadComponent: () => import('./modules/mentor/reports/reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'mentor/settings',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['owner'] },
    loadComponent: () => import('./modules/mentor/settings/settings.component').then(m => m.SettingsComponent)
  },

  // --- OWNER EXCLUSIVE ROUTES ---
  {
    path: 'owner/faculty',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['owner'] },
    loadComponent: () => import('./modules/mentor/faculty/faculty.component').then(m => m.FacultyComponent)
  },

  // --- STUDENT PORTAL ROUTES ---
  {
    path: 'student/dashboard',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/dashboard/dashboard.component').then(m => m.StudentDashboardComponent)
  },
  {
    path: 'student/profile',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/profile/profile.component').then(m => m.StudentProfileComponent)
  },
  {
    path: 'student/stream-selection',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/stream-selection/stream-selection.component').then(m => m.StreamSelectionComponent)
  },
  {
    path: 'student/subject-selection',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/subject-selection/subject-selection.component').then(m => m.SubjectSelectionComponent)
  },
  {
    path: 'student/attendance',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/attendance/attendance.component').then(m => m.StudentAttendanceComponent)
  },
  {
    path: 'student/fees',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/fees/fees.component').then(m => m.StudentFeesComponent)
  },
  {
    path: 'student/marks',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/marks/marks.component').then(m => m.StudentMarksComponent)
  },
  {
    path: 'student/timetable',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/timetable/timetable.component').then(m => m.StudentTimetableComponent)
  },
  {
    path: 'student/homework',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/homework/homework.component').then(m => m.StudentHomeworkComponent)
  },
  {
    path: 'student/announcements',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/announcements/announcements.component').then(m => m.StudentAnnouncementsComponent)
  },
  {
    path: 'student/request-change',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student'] },
    loadComponent: () => import('./modules/student/request-change/request-change.component').then(m => m.StudentRequestChangeComponent)
  },

  // --- WILDCARD CATCH-ALL ---
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];
