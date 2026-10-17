import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StudentProfile, Subject } from '../../../core/models/entities';

@Component({
  selector: 'app-subject-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './subject-selection.component.html',
  styleUrl: './subject-selection.component.scss'
})
export class SubjectSelectionComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  student = signal<StudentProfile | null>(null);
  availableSubjects = signal<Subject[]>([]);
  selectedSubjectIds = signal<number[]>([]);
  lockSelection = false;

  // Computed total monthly fee
  totalMonthlyFee = computed(() => {
    const selected = new Set(this.selectedSubjectIds());
    return this.availableSubjects()
      .filter(s => selected.has(s.id))
      .reduce((sum, s) => sum + s.monthlyFee, 0);
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.apiService.getSelfProfile().subscribe({
      next: (res) => {
        if (res.success && res.student) {
          const st: StudentProfile = res.student;
          this.student.set(st);

          const currentEnrolledIds = (st.studentSubjects || []).map((ss: any) => ss.subjectId);
          this.selectedSubjectIds.set(currentEnrolledIds);

          // Get subjects matching class and stream
          this.apiService.getSubjects({ class: st.targetClass }).subscribe({
            next: (subRes) => {
              if (subRes.success) {
                let subs: Subject[] = subRes.subjects || [];
                // If class 11 or 12 and has stream, filter subjects to that stream or common
                if (st.targetClass !== 10 && st.streamId) {
                  subs = subs.filter(s => !s.streamId || s.streamId === st.streamId);
                }
                this.availableSubjects.set(subs);
              }
              this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
          });
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  toggleSubject(id: number) {
    if (this.student()?.isSubjectLocked) return;

    const current = this.selectedSubjectIds();
    if (current.includes(id)) {
      this.selectedSubjectIds.set(current.filter(sid => sid !== id));
    } else {
      this.selectedSubjectIds.set([...current, id]);
    }
  }

  isSelected(id: number): boolean {
    return this.selectedSubjectIds().includes(id);
  }

  saveSubjects() {
    const ids = this.selectedSubjectIds();
    if (ids.length === 0) {
      this.notification.warning('Please select at least one coaching subject.');
      return;
    }

    this.isSaving.set(true);
    this.apiService.selectSelfSubjects({
      subjectIds: ids,
      lockSubjects: this.lockSelection
    }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.notification.success('Coaching subjects enrolled successfully!');
          this.router.navigate(['/student/dashboard']);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notification.error(err.error?.message || 'Failed to enroll in subjects');
      }
    });
  }
}
