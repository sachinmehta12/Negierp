import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Attendance } from '../../../core/models/entities';

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class StudentAttendanceComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  isLoading = signal<boolean>(true);
  records = signal<Attendance[]>([]);
  overallPercentage = signal<number>(100);
  presentCount = signal<number>(0);
  lateCount = signal<number>(0);
  absentCount = signal<number>(0);
  excusedCount = signal<number>(0);

  ngOnInit() {
    this.loadAttendance();
  }

  loadAttendance() {
    this.isLoading.set(true);
    this.apiService.getStudentAttendance().subscribe({
      next: (res) => {
        if (res.success) {
          this.records.set(res.records || []);
          this.overallPercentage.set(res.overallPercentage ?? 100);
          this.presentCount.set(res.presentCount ?? 0);
          this.lateCount.set(res.lateCount ?? 0);
          this.absentCount.set(res.absentCount ?? 0);
          this.excusedCount.set(res.excusedCount ?? 0);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
