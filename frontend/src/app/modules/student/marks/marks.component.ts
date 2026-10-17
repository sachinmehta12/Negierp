import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { ExamMark } from '../../../core/models/entities';

@Component({
  selector: 'app-student-marks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marks.component.html',
  styleUrl: './marks.component.scss'
})
export class StudentMarksComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  isLoading = signal<boolean>(true);
  marksList = signal<ExamMark[]>([]);
  overallAverage = signal<number>(0);

  totalAppeared = computed(() => this.marksList().filter(m => !m.isAbsent).length);
  passedCount = computed(() => {
    return this.marksList().filter(m => !m.isAbsent && (m.marksObtained ?? 0) >= (m.exam?.passingMarks ?? 33)).length;
  });

  ngOnInit() {
    this.loadMarks();
  }

  loadMarks() {
    this.isLoading.set(true);
    this.apiService.getStudentMarks().subscribe({
      next: (res) => {
        if (res.success) {
          this.marksList.set(res.marks || []);
          this.overallAverage.set(res.overallAverage ?? 0);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
