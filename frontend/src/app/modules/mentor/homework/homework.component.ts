import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Homework, Subject } from '../../../core/models/entities';

@Component({
  selector: 'app-homework',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './homework.component.html',
  styleUrl: './homework.component.scss'
})
export class HomeworkComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  homeworkList = signal<Homework[]>([]);
  subjects = signal<Subject[]>([]);

  selectedClassFilter = signal<number | null>(null);

  isModalOpen = signal<boolean>(false);
  homeworkForm = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    targetClass: [10, [Validators.required]],
    subjectId: [0, [Validators.required, Validators.min(1)]],
    dueDate: [new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], [Validators.required]]
  });

  ngOnInit() {
    this.loadSubjects();
    this.loadHomework();
  }

  loadSubjects() {
    this.apiService.getSubjects().subscribe({
      next: (res) => {
        if (res.success) this.subjects.set(res.subjects);
      }
    });
  }

  loadHomework() {
    this.isLoading.set(true);
    const params: any = {};
    if (this.selectedClassFilter()) params.class = this.selectedClassFilter();

    this.apiService.getHomework(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.homeworkList.set(res.homework || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateModal() {
    this.homeworkForm.reset({
      title: '',
      description: '',
      targetClass: 10,
      subjectId: this.subjects().length > 0 ? this.subjects()[0].id : 0,
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    });
    this.isModalOpen.set(true);
  }

  saveHomework() {
    if (this.homeworkForm.invalid) {
      this.homeworkForm.markAllAsTouched();
      return;
    }

    this.apiService.createHomework(this.homeworkForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('Homework assigned successfully');
          this.isModalOpen.set(false);
          this.loadHomework();
        }
      }
    });
  }

  deleteHomework(hw: Homework) {
    if (confirm(`Delete assignment "${hw.title}"?`)) {
      this.apiService.deleteHomework(hw.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success('Assignment deleted');
            this.loadHomework();
          }
        }
      });
    }
  }
}
