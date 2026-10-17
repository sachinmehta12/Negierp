import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Stream, Subject } from '../../../core/models/entities';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss'
})
export class SubjectsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  streams = signal<Stream[]>([]);
  subjects = signal<Subject[]>([]);
  selectedClassFilter: number | null = null;

  // Stream Modal State
  isStreamModalOpen = signal<boolean>(false);
  editingStreamId = signal<number | null>(null);
  streamForm = this.fb.group({
    name: ['', [Validators.required]],
    code: ['', [Validators.required]],
    applicableClasses: ['11,12'],
    description: [''],
    isActive: [true]
  });

  // Subject Modal State
  isSubjectModalOpen = signal<boolean>(false);
  editingSubjectId = signal<number | null>(null);
  subjectForm = this.fb.group({
    name: ['', [Validators.required]],
    code: ['', [Validators.required]],
    targetClass: [10, [Validators.required]],
    streamId: [0],
    monthlyFee: [1500, [Validators.required, Validators.min(0)]],
    description: [''],
    isActive: [true]
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.apiService.getStreams().subscribe({
      next: (res) => {
        if (res.success) this.streams.set(res.streams);
      }
    });

    this.apiService.getSubjects({ class: this.selectedClassFilter || undefined }).subscribe({
      next: (res) => {
        if (res.success) {
          this.subjects.set(res.subjects);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // --- STREAM ACTIONS ---
  openCreateStream() {
    this.editingStreamId.set(null);
    this.streamForm.reset({ applicableClasses: '11,12', isActive: true });
    this.isStreamModalOpen.set(true);
  }

  openEditStream(stream: Stream) {
    this.editingStreamId.set(stream.id);
    this.streamForm.patchValue({
      name: stream.name,
      code: stream.code,
      applicableClasses: stream.applicableClasses,
      description: stream.description || '',
      isActive: stream.isActive
    });
    this.isStreamModalOpen.set(true);
  }

  saveStream() {
    if (this.streamForm.invalid) {
      this.streamForm.markAllAsTouched();
      return;
    }

    const id = this.editingStreamId();
    if (id) {
      this.apiService.updateStream(id, this.streamForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.isStreamModalOpen.set(false);
            this.loadData();
          }
        }
      });
    } else {
      this.apiService.createStream(this.streamForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.isStreamModalOpen.set(false);
            this.loadData();
          }
        }
      });
    }
  }

  deleteStream(stream: Stream) {
    if (confirm(`Delete stream "${stream.name}"? This cannot be undone.`)) {
      this.apiService.deleteStream(stream.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.loadData();
          }
        }
      });
    }
  }

  // --- SUBJECT ACTIONS ---
  openCreateSubject() {
    this.editingSubjectId.set(null);
    this.subjectForm.reset({ targetClass: 10, streamId: 0, monthlyFee: 1500, isActive: true });
    this.isSubjectModalOpen.set(true);
  }

  openEditSubject(sub: Subject) {
    this.editingSubjectId.set(sub.id);
    this.subjectForm.patchValue({
      name: sub.name,
      code: sub.code,
      targetClass: sub.targetClass,
      streamId: sub.streamId || 0,
      monthlyFee: sub.monthlyFee,
      description: sub.description || '',
      isActive: sub.isActive
    });
    this.isSubjectModalOpen.set(true);
  }

  saveSubject() {
    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    const id = this.editingSubjectId();
    if (id) {
      this.apiService.updateSubject(id, this.subjectForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.isSubjectModalOpen.set(false);
            this.loadData();
          }
        }
      });
    } else {
      this.apiService.createSubject(this.subjectForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.isSubjectModalOpen.set(false);
            this.loadData();
          }
        }
      });
    }
  }

  deleteSubject(sub: Subject) {
    if (confirm(`Delete subject "${sub.name}"?`)) {
      this.apiService.deleteSubject(sub.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.loadData();
          }
        }
      });
    }
  }
}
