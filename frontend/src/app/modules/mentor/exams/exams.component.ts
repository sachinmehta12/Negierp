import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Exam, Subject } from '../../../core/models/entities';

@Component({
  selector: 'app-exams',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './exams.component.html',
  styleUrl: './exams.component.scss'
})
export class ExamsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(true);
  exams = signal<Exam[]>([]);
  subjects = signal<Subject[]>([]);

  selectedClassFilter = signal<number | null>(null);

  isExamModalOpen = signal<boolean>(false);
  editingExamId = signal<number | null>(null);

  examForm = this.fb.group({
    title: ['', [Validators.required]],
    examType: ['Unit Test', [Validators.required]],
    targetClass: [10, [Validators.required]],
    subjectId: [0, [Validators.required, Validators.min(1)]],
    examDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    maxMarks: [100, [Validators.required, Validators.min(1)]],
    passingMarks: [33, [Validators.required, Validators.min(1)]],
    description: [''],
    isPublished: [true]
  });

  ngOnInit() {
    this.loadSubjects();
    this.loadExams();
  }

  loadSubjects() {
    this.apiService.getSubjects().subscribe({
      next: (res) => {
        if (res.success) this.subjects.set(res.subjects);
      }
    });
  }

  loadExams() {
    this.isLoading.set(true);
    const params: any = {};
    if (this.selectedClassFilter()) params.class = this.selectedClassFilter();

    this.apiService.getExams(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.exams.set(res.exams || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateExam() {
    this.editingExamId.set(null);
    this.examForm.reset({
      title: '',
      examType: 'Unit Test',
      targetClass: 10,
      subjectId: this.subjects().length > 0 ? this.subjects()[0].id : 0,
      examDate: new Date().toISOString().split('T')[0],
      maxMarks: 100,
      passingMarks: 33,
      description: '',
      isPublished: true
    });
    this.isExamModalOpen.set(true);
  }

  openEditExam(exam: Exam) {
    this.editingExamId.set(exam.id);
    this.examForm.patchValue({
      title: exam.title,
      examType: exam.examType,
      targetClass: exam.targetClass,
      subjectId: exam.subjectId,
      examDate: new Date(exam.examDate).toISOString().split('T')[0],
      maxMarks: exam.maxMarks,
      passingMarks: exam.passingMarks,
      description: exam.description || '',
      isPublished: exam.isPublished
    });
    this.isExamModalOpen.set(true);
  }

  saveExam() {
    if (this.examForm.invalid) {
      this.examForm.markAllAsTouched();
      return;
    }

    const id = this.editingExamId();
    if (id) {
      this.apiService.updateExam(id, this.examForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.isExamModalOpen.set(false);
            this.loadExams();
          }
        }
      });
    } else {
      this.apiService.createExam(this.examForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.isExamModalOpen.set(false);
            this.loadExams();
          }
        }
      });
    }
  }

  deleteExam(exam: Exam) {
    if (confirm(`Delete exam "${exam.title}"? Associated student marks will also be deleted.`)) {
      this.apiService.deleteExam(exam.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.loadExams();
          }
        }
      });
    }
  }

  openMarksheet(exam: Exam) {
    this.router.navigate(['/mentor/exams/marks', exam.id]);
  }
}
