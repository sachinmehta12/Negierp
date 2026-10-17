import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  isLoading = signal<boolean>(true);
  classStats = signal<any[]>([]);
  subjectPerf = signal<any[]>([]);
  topStudents = signal<any[]>([]);

  ngOnInit() {
    this.loadAcademicAnalytics();
  }

  loadAcademicAnalytics() {
    this.isLoading.set(true);
    this.apiService.getAcademicAnalytics().subscribe({
      next: (res) => {
        if (res.success) {
          this.classStats.set(res.classStats || []);
          this.subjectPerf.set(res.subjectPerf || []);
          this.topStudents.set(res.topStudents || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
