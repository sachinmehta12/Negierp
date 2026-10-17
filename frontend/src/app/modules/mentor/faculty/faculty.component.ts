import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { User, Subject, Testimonial } from '../../../core/models/entities';

@Component({
  selector: 'app-faculty',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './faculty.component.html',
  styleUrl: './faculty.component.scss'
})
export class FacultyComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  activeTab = signal<'faculty' | 'testimonials'>('faculty');

  // Faculty State
  isLoading = signal<boolean>(true);
  facultyList = signal<User[]>([]);
  subjects = signal<Subject[]>([]);
  isModalOpen = signal<boolean>(false);
  editingFacultyId = signal<number | null>(null);

  facultyForm = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    designation: [''],
    bio: [''],
    subjectIds: [[] as number[]]
  });

  // Testimonials State
  testimonials = signal<Testimonial[]>([]);
  isLoadingTestimonials = signal<boolean>(false);
  isTestimonialModalOpen = signal<boolean>(false);
  editingTestimonialId = signal<number | null>(null);

  testimonialForm = this.fb.group({
    studentName: ['', [Validators.required]],
    scoreBadge: ['', [Validators.required]],
    batchInfo: ['', [Validators.required]],
    quote: ['', [Validators.required, Validators.minLength(10)]],
    isFeatured: [true]
  });

  ngOnInit() {
    this.loadSubjects();
    this.loadFaculty();
    this.loadTestimonials();
  }

  loadSubjects() {
    this.apiService.getSubjects().subscribe({
      next: (res) => {
        if (res.success) this.subjects.set(res.subjects);
      }
    });
  }

  loadFaculty() {
    this.isLoading.set(true);
    this.apiService.getFaculty().subscribe({
      next: (res) => {
        if (res.success) {
          this.facultyList.set(res.faculty || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateModal() {
    this.editingFacultyId.set(null);
    this.facultyForm.reset({
      username: '',
      email: '',
      password: '',
      designation: '',
      bio: '',
      subjectIds: []
    });
    this.facultyForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.facultyForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  openEditModal(user: User) {
    this.editingFacultyId.set(user.id);
    const assignedIds = (user.assignedSubjects || []).map((s: Subject) => s.id);
    this.facultyForm.patchValue({
      username: user.username,
      email: user.email,
      password: '',
      designation: user.designation || '',
      bio: user.bio || '',
      subjectIds: assignedIds
    });
    // Password optional during edit
    this.facultyForm.get('password')?.clearValidators();
    this.facultyForm.get('password')?.updateValueAndValidity();
    this.isModalOpen.set(true);
  }

  toggleSubjectSelection(subjectId: number) {
    const current = (this.facultyForm.get('subjectIds')?.value || []) as number[];
    if (current.includes(subjectId)) {
      this.facultyForm.patchValue({ subjectIds: current.filter(id => id !== subjectId) });
    } else {
      this.facultyForm.patchValue({ subjectIds: [...current, subjectId] });
    }
  }

  isSubjectSelected(subjectId: number): boolean {
    const current = (this.facultyForm.get('subjectIds')?.value || []) as number[];
    return current.includes(subjectId);
  }

  saveFaculty() {
    if (this.facultyForm.invalid) {
      this.facultyForm.markAllAsTouched();
      return;
    }

    const id = this.editingFacultyId();
    if (id) {
      this.apiService.updateFaculty(id, this.facultyForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.isModalOpen.set(false);
            this.loadFaculty();
          }
        }
      });
    } else {
      this.apiService.createFaculty(this.facultyForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.isModalOpen.set(false);
            this.loadFaculty();
          }
        }
      });
    }
  }

  toggleStatus(user: User) {
    this.apiService.toggleFacultyActive(user.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(res.message);
          this.loadFaculty();
        }
      }
    });
  }

  deleteFaculty(user: User) {
    if (confirm(`Remove faculty account "${user.username}"?`)) {
      this.apiService.deleteFaculty(user.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.loadFaculty();
          }
        }
      });
    }
  }

  // ----------------- TESTIMONIALS METHODS -----------------
  loadTestimonials() {
    this.isLoadingTestimonials.set(true);
    this.apiService.getTestimonials().subscribe({
      next: (res) => {
        if (res.success) {
          this.testimonials.set(res.testimonials || []);
        }
        this.isLoadingTestimonials.set(false);
      },
      error: () => this.isLoadingTestimonials.set(false)
    });
  }

  openCreateTestimonialModal() {
    this.editingTestimonialId.set(null);
    this.testimonialForm.reset({
      studentName: '',
      scoreBadge: '',
      batchInfo: '',
      quote: '',
      isFeatured: true
    });
    this.isTestimonialModalOpen.set(true);
  }

  openEditTestimonialModal(item: Testimonial) {
    this.editingTestimonialId.set(item.id);
    this.testimonialForm.patchValue({
      studentName: item.studentName,
      scoreBadge: item.scoreBadge,
      batchInfo: item.batchInfo,
      quote: item.quote,
      isFeatured: item.isFeatured
    });
    this.isTestimonialModalOpen.set(true);
  }

  saveTestimonial() {
    if (this.testimonialForm.invalid) {
      this.testimonialForm.markAllAsTouched();
      return;
    }

    const id = this.editingTestimonialId();
    if (id) {
      this.apiService.updateTestimonial(id, this.testimonialForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.isTestimonialModalOpen.set(false);
            this.loadTestimonials();
          }
        }
      });
    } else {
      this.apiService.createTestimonial(this.testimonialForm.value).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.isTestimonialModalOpen.set(false);
            this.loadTestimonials();
          }
        }
      });
    }
  }

  deleteTestimonial(item: Testimonial) {
    if (confirm(`Delete student testimonial for "${item.studentName}"?`)) {
      this.apiService.deleteTestimonial(item.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.loadTestimonials();
          }
        }
      });
    }
  }
}
