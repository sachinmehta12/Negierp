import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { StudentProfile, FeeStructure, Announcement, Timetable } from '../../../core/models/entities';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class StudentDashboardComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(true);
  student = signal<StudentProfile | null>(null);
  feeStructure = signal<FeeStructure | null>(null);
  attendancePercentage = signal<number>(100);
  examAverage = signal<number>(0);
  todayClasses = signal<Timetable[]>([]);
  announcements = signal<Announcement[]>([]);

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading.set(true);

    // 1. Get full student profile
    this.apiService.getSelfProfile().subscribe({
      next: (res) => {
        if (res.success && res.student) {
          this.student.set(res.student);
          if (res.student.feeStructures && res.student.feeStructures.length > 0) {
            this.feeStructure.set(res.student.feeStructures[0]);
          }
        }
      }
    });

    // 2. Attendance
    this.apiService.getStudentAttendance().subscribe({
      next: (res) => {
        if (res.success) {
          this.attendancePercentage.set(res.overallPercentage ?? 100);
        }
      }
    });

    // 3. Exam marks
    this.apiService.getStudentMarks().subscribe({
      next: (res) => {
        if (res.success) {
          this.examAverage.set(res.overallAverage ?? 0);
        }
      }
    });

    // 4. Timetable
    this.apiService.getStudentTimetable().subscribe({
      next: (res) => {
        if (res.success && res.timetableByDay) {
          const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const todayName = daysOfWeek[new Date().getDay()];
          this.todayClasses.set(res.timetableByDay[todayName] || []);
        }
      }
    });

    // 5. Announcements
    this.apiService.getAnnouncements().subscribe({
      next: (res) => {
        if (res.success) {
          this.announcements.set((res.announcements || []).slice(0, 3));
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  payFees() {
    this.router.navigate(['/student/fees']);
  }
}
