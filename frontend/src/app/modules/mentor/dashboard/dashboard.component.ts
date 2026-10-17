import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';

@Component({
  selector: 'app-mentor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  protected readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  metrics = signal<any>({});
  recentPayments = signal<any[]>([]);
  recentExams = signal<any[]>([]);
  recentAnnouncements = signal<any[]>([]);
  todayClasses = signal<any[]>([]);
  todayName = signal<string>('');

  // Interactive Visual Analytics Calculations
  feeRecoveryPercentage = computed(() => {
    const collected = this.metrics().totalFeeCollected || 0;
    const due = this.metrics().totalFeeDue || 0;
    const total = collected + due;
    if (total === 0) return 0;
    return Math.round((collected / total) * 100);
  });

  class10Percentage = computed(() => {
    const total = this.metrics().totalStudents || 0;
    if (total === 0) return 0;
    return Math.round(((this.metrics().class10Count || 0) / total) * 100);
  });

  class11Percentage = computed(() => {
    const total = this.metrics().totalStudents || 0;
    if (total === 0) return 0;
    return Math.round(((this.metrics().class11Count || 0) / total) * 100);
  });

  class12Percentage = computed(() => {
    const total = this.metrics().totalStudents || 0;
    if (total === 0) return 0;
    return Math.round(((this.metrics().class12Count || 0) / total) * 100);
  });

  // Quick Action Modals
  isPaymentModalOpen = signal<boolean>(false);
  isNoticeModalOpen = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  studentsRoster = signal<any[]>([]);

  quickPaymentForm = this.fb.group({
    studentId: [0, [Validators.required, Validators.min(1)]],
    amount: [1500, [Validators.required, Validators.min(1)]],
    paymentDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    paymentMode: ['Cash', [Validators.required]],
    referenceNo: [''],
    remarks: ['']
  });

  quickNoticeForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    content: ['', [Validators.required]],
    targetClass: ['All', [Validators.required]],
    priority: ['Normal', [Validators.required]]
  });

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.isLoading.set(true);
    this.apiService.getDashboardAnalytics().subscribe({
      next: (res) => {
        if (res.success) {
          this.metrics.set(res.metrics || {});
          this.recentPayments.set(res.recentPayments || []);
          this.recentExams.set(res.recentExams || []);
          this.recentAnnouncements.set(res.recentAnnouncements || []);
          this.todayClasses.set(res.todayClasses || []);
          this.todayName.set(res.todayName || '');
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  openQuickPayment() {
    this.apiService.getStudents().subscribe({
      next: (res) => {
        if (res.success) {
          this.studentsRoster.set(res.students || []);
          if (res.students && res.students.length > 0) {
            this.quickPaymentForm.patchValue({ studentId: res.students[0].id });
          }
        }
      }
    });
    this.isPaymentModalOpen.set(true);
  }

  submitQuickPayment() {
    if (this.quickPaymentForm.invalid) {
      this.quickPaymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const val = this.quickPaymentForm.value;

    const studentId = Number(val.studentId);
    this.apiService.recordFeePayment(studentId, {
      amount: Number(val.amount),
      paymentDate: val.paymentDate,
      paymentMode: val.paymentMode,
      referenceNo: val.referenceNo,
      remarks: val.remarks
    }).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.isPaymentModalOpen.set(false);
        this.notification.success(`Fee receipt #${res.payment?.receiptNo || ''} recorded successfully!`);
        this.quickPaymentForm.reset({
          studentId: 0,
          amount: 1500,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'Cash'
        });
        this.loadDashboard();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notification.error(err.error?.message || 'Failed to record payment');
      }
    });
  }

  refreshDashboard() {
    this.loadDashboard();
    this.notification.info('Refreshing live dashboard analytics...');
  }

  openQuickNotice() {
    this.quickNoticeForm.reset({
      title: '',
      content: '',
      targetClass: 'All',
      priority: 'Normal'
    });
    this.isNoticeModalOpen.set(true);
  }

  submitQuickNotice() {
    if (this.quickNoticeForm.invalid) {
      this.quickNoticeForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const val = this.quickNoticeForm.value;

    this.apiService.createAnnouncement(val).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isNoticeModalOpen.set(false);
        this.notification.success('Announcement broadcasted successfully!');
        this.loadDashboard();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notification.error(err.error?.message || 'Failed to broadcast announcement');
      }
    });
  }
}
