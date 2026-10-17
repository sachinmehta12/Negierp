import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Stream } from '../../../core/models/entities';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.scss'
})
export class StudentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isEdit = signal<boolean>(false);
  studentId = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  streams = signal<Stream[]>([]);

  form = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['Password123'],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    gender: ['Male'],
    dob: [''],
    contactNumber: [''],
    parentName: [''],
    parentContact: [''],
    parentEmail: [''],
    address: [''],
    emergencyContact: [''],
    targetClass: [10, [Validators.required]],
    academicYear: ['2026-2027'],
    streamId: [0],
    isStreamLocked: [false],
    isSubjectLocked: [false],
    totalAnnualFee: [22000, [Validators.required]],
    discountAmount: [0],
    discountReason: [''],
    notes: [''],
    isActive: [true]
  });

  ngOnInit() {
    this.loadStreams();
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEdit.set(true);
        this.studentId.set(Number(id));
        this.loadStudent(Number(id));
      }
    });

    // Auto-update default annual fee based on class selection in admission mode
    this.form.get('targetClass')?.valueChanges.subscribe(val => {
      if (!this.isEdit()) {
        const classMap: Record<number, number> = { 10: 22000, 11: 28000, 12: 32000 };
        if (val && classMap[val]) {
          this.form.patchValue({ totalAnnualFee: classMap[val] });
        }
      }
    });
  }

  loadStreams() {
    this.apiService.getStreams().subscribe({
      next: (res) => {
        if (res.success) {
          this.streams.set(res.streams);
        }
      }
    });
  }

  loadStudent(id: number) {
    this.isLoading.set(true);
    this.apiService.getStudentById(id).subscribe({
      next: (res) => {
        if (res.success) {
          const s = res.student;
          this.form.patchValue({
            username: s.user?.username,
            email: s.user?.email,
            firstName: s.firstName,
            lastName: s.lastName,
            gender: s.gender || 'Male',
            dob: s.dob ? s.dob.split('T')[0] : '',
            contactNumber: s.contactNumber || '',
            parentName: s.parentName || '',
            parentContact: s.parentContact || '',
            parentEmail: s.parentEmail || '',
            address: s.address || '',
            emergencyContact: s.emergencyContact || '',
            targetClass: s.targetClass,
            academicYear: s.academicYear,
            streamId: s.streamId || 0,
            isStreamLocked: s.isStreamLocked,
            isSubjectLocked: s.isSubjectLocked,
            notes: s.notes || '',
            isActive: s.user?.isActive ?? true
          });
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    if (this.isEdit()) {
      this.apiService.updateStudent(this.studentId()!, this.form.value).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.notification.success(res.message);
          this.router.navigate(['/mentor/students', this.studentId()]);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.notification.error(err.error?.message || 'Failed to update student.');
        }
      });
    } else {
      this.apiService.createStudent(this.form.value).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.notification.success(res.message);
          this.router.navigate(['/mentor/students', res.studentId]);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.notification.error(err.error?.message || 'Failed to create student.');
        }
      });
    }
  }
}
