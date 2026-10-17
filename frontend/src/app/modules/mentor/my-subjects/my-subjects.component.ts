import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject } from '../../../core/models/entities';

@Component({
  selector: 'app-my-subjects',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-subjects.component.html',
  styleUrl: './my-subjects.component.scss'
})
export class MySubjectsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(true);
  subjects = signal<Subject[]>([]);

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    this.isLoading.set(true);
    const user = this.authService.currentUser();

    this.apiService.getSubjects().subscribe({
      next: (res) => {
        if (res.success) {
          let list: Subject[] = res.subjects || [];
          if (user && user.role === 'mentor' && user.assignedSubjects && user.assignedSubjects.length > 0) {
            const assignedIds = new Set(user.assignedSubjects.map((s: any) => s.id));
            list = list.filter(s => assignedIds.has(s.id));
          }
          this.subjects.set(list);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  goToAttendance() {
    this.router.navigate(['/mentor/attendance']);
  }

  goToExams() {
    this.router.navigate(['/mentor/exams']);
  }
}
