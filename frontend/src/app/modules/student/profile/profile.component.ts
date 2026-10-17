import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StudentProfile } from '../../../core/models/entities';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class StudentProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  student = signal<StudentProfile | null>(null);

  profileForm = this.fb.group({
    contactNumber: ['', [Validators.required]],
    address: ['', [Validators.required]],
    emergencyContact: ['']
  });

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.apiService.getSelfProfile().subscribe({
      next: (res) => {
        if (res.success && res.student) {
          this.student.set(res.student);
          this.profileForm.patchValue({
            contactNumber: res.student.contactNumber || '',
            address: res.student.address || '',
            emergencyContact: res.student.emergencyContact || ''
          });
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.apiService.updateSelfProfile(this.profileForm.value as any).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.notification.success('Contact information updated successfully');
        }
      },
      error: () => this.isSaving.set(false)
    });
  }
}
