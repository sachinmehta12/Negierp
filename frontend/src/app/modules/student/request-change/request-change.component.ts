import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SubjectChangeRequest } from '../../../core/models/entities';

@Component({
  selector: 'app-student-request-change',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './request-change.component.html',
  styleUrl: './request-change.component.scss'
})
export class StudentRequestChangeComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  pastRequests = signal<SubjectChangeRequest[]>([]);

  requestForm = this.fb.group({
    requestType: ['Change Academic Stream', [Validators.required]],
    details: ['', [Validators.required, Validators.minLength(10)]]
  });

  ngOnInit() {
    this.loadPastRequests();
  }

  loadPastRequests() {
    this.isLoading.set(true);
    this.apiService.getStudentChangeRequests().subscribe({
      next: (res) => {
        if (res.success) {
          this.pastRequests.set(res.requests || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  submitRequest() {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.apiService.submitChangeRequest(this.requestForm.value as any).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.notification.success('Change request submitted to institute mentor!');
          this.requestForm.reset({
            requestType: 'Change Academic Stream',
            details: ''
          });
          this.loadPastRequests();
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notification.error(err.error?.message || 'Failed to submit request');
      }
    });
  }
}
