import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Homework } from '../../../core/models/entities';

@Component({
  selector: 'app-student-homework',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homework.component.html',
  styleUrl: './homework.component.scss'
})
export class StudentHomeworkComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  homeworkList = signal<Homework[]>([]);

  ngOnInit() {
    this.loadHomework();
  }

  loadHomework() {
    this.isLoading.set(true);
    this.apiService.getStudentHomework().subscribe({
      next: (res) => {
        if (res.success) {
          this.homeworkList.set(res.homework || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  markComplete(hw: Homework) {
    this.apiService.markHomeworkComplete(hw.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(res.message || 'Assignment marked as completed!');
          this.loadHomework();
        }
      }
    });
  }
}
