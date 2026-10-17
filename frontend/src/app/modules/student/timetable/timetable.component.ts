import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { Timetable } from '../../../core/models/entities';

@Component({
  selector: 'app-student-timetable',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timetable.component.html',
  styleUrl: './timetable.component.scss'
})
export class StudentTimetableComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  isLoading = signal<boolean>(true);
  days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  timetableByDay = signal<Record<string, Timetable[]>>({});
  targetClass = signal<number>(10);

  ngOnInit() {
    this.loadTimetable();
  }

  loadTimetable() {
    this.isLoading.set(true);
    this.apiService.getStudentTimetable().subscribe({
      next: (res) => {
        if (res.success) {
          this.targetClass.set(res.targetClass || 10);
          this.timetableByDay.set(res.timetableByDay || {});
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
