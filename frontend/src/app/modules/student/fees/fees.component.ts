import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { FeeStructure, FeePayment } from '../../../core/models/entities';

@Component({
  selector: 'app-student-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './fees.component.html',
  styleUrl: './fees.component.scss'
})
export class StudentFeesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  isPaymentModalOpen = signal<boolean>(false);

  feeStructure = signal<FeeStructure | null>(null);
  payments = signal<FeePayment[]>([]);

  paymentForm = this.fb.group({
    amount: [1000, [Validators.required, Validators.min(1)]],
    paymentDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    paymentMode: ['UPI', [Validators.required]],
    referenceNo: ['', [Validators.required]],
    remarks: ['']
  });

  ngOnInit() {
    this.loadFees();
  }

  loadFees() {
    this.isLoading.set(true);
    this.apiService.getStudentFees().subscribe({
      next: (res) => {
        if (res.success) {
          this.feeStructure.set(res.latestStructure || null);
          this.payments.set(res.payments || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openPaymentModal() {
    const due = this.feeStructure()?.dueAmount ?? 1000;
    this.paymentForm.reset({
      amount: due > 0 ? due : 1000,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'UPI',
      referenceNo: '',
      remarks: 'Tuition fee submission'
    });
    this.isPaymentModalOpen.set(true);
  }

  submitPayment() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.apiService.studentSubmitPayment(this.paymentForm.value).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.notification.success(res.message || 'Payment submitted for mentor verification!');
          this.isPaymentModalOpen.set(false);
          this.loadFees();
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notification.error(err.error?.message || 'Payment submission failed');
      }
    });
  }

  viewReceipt(payment: FeePayment) {
    if (!payment.isVerified) {
      this.notification.warning('Official receipt will unlock once your submission is verified by a mentor.');
      return;
    }
    this.router.navigate(['/mentor/fees/receipt', payment.id]);
  }
}
