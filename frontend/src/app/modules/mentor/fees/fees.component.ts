import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { FeeStructure, FeePayment } from '../../../core/models/entities';

@Component({
  selector: 'app-fees',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './fees.component.html',
  styleUrl: './fees.component.scss'
})
export class FeesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(true);
  feeStructures = signal<FeeStructure[]>([]);
  pendingPayments = signal<FeePayment[]>([]);

  // Search & Filter
  searchQuery = signal<string>('');
  selectedClassFilter = signal<number | null>(null);
  selectedStatusFilter = signal<string>('all');

  // Summary figures from server
  totalExpected = signal<number>(0);
  totalCollected = signal<number>(0);
  totalDue = signal<number>(0);
  pendingVerificationCount = computed(() => this.pendingPayments().length);

  // Filtered Structures
  filteredStructures = computed(() => {
    let list = this.feeStructures();
    const q = this.searchQuery().toLowerCase().trim();

    if (q) {
      list = list.filter(f => 
        f.student?.firstName.toLowerCase().includes(q) ||
        f.student?.lastName.toLowerCase().includes(q) ||
        f.student?.enrollmentNo.toLowerCase().includes(q)
      );
    }

    return list;
  });

  // Modals State
  isPaymentModalOpen = signal<boolean>(false);
  isStructureModalOpen = signal<boolean>(false);
  isHistoryModalOpen = signal<boolean>(false);

  activeStructure = signal<FeeStructure | null>(null);
  historyPayments = signal<FeePayment[]>([]);

  // Record Payment Form
  paymentForm = this.fb.group({
    amount: [1000, [Validators.required, Validators.min(1)]],
    paymentDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    paymentMode: ['Cash', [Validators.required]],
    referenceNo: [''],
    remarks: ['']
  });

  // Adjust Structure Form
  structureForm = this.fb.group({
    totalAnnualFee: [0, [Validators.required, Validators.min(0)]],
    discountAmount: [0, [Validators.min(0)]],
    discountReason: ['']
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    const params: any = {};
    if (this.selectedClassFilter()) params.class = this.selectedClassFilter();
    if (this.selectedStatusFilter() !== 'all') params.status = this.selectedStatusFilter();

    this.apiService.getFees(params).subscribe({
      next: (res) => {
        if (res.success) {
          this.feeStructures.set(res.structures || []);
          this.pendingPayments.set(res.pendingPayments || []);
          this.totalExpected.set(res.totalExpected || 0);
          this.totalCollected.set(res.totalCollected || 0);
          this.totalDue.set(res.totalDue || 0);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onFilterChange() {
    this.loadData();
  }

  // --- RECORD PAYMENT MODAL ---
  openPaymentModal(struct: FeeStructure) {
    this.activeStructure.set(struct);
    this.paymentForm.reset({
      amount: struct.dueAmount > 0 ? struct.dueAmount : 1000,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      referenceNo: '',
      remarks: 'Tuition installment fee'
    });
    this.isPaymentModalOpen.set(true);
  }

  submitPayment() {
    if (this.paymentForm.invalid || !this.activeStructure()) return;
    const struct = this.activeStructure()!;

    const payload = {
      amount: Number(this.paymentForm.value.amount),
      paymentDate: this.paymentForm.value.paymentDate,
      paymentMode: this.paymentForm.value.paymentMode,
      referenceNo: this.paymentForm.value.referenceNo || undefined,
      remarks: this.paymentForm.value.remarks || undefined
    };

    this.apiService.recordFeePayment(struct.studentId, payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(res.message || 'Payment recorded successfully');
          this.isPaymentModalOpen.set(false);
          this.loadData();
        }
      }
    });
  }

  // --- ADJUST STRUCTURE MODAL ---
  openStructureModal(struct: FeeStructure) {
    this.activeStructure.set(struct);
    this.structureForm.patchValue({
      totalAnnualFee: struct.totalAnnualFee,
      discountAmount: struct.discountAmount,
      discountReason: struct.discountReason || ''
    });
    this.isStructureModalOpen.set(true);
  }

  saveStructure() {
    if (this.structureForm.invalid || !this.activeStructure()) return;
    const struct = this.activeStructure()!;

    this.apiService.adjustFeeStructure(struct.studentId, this.structureForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('Fee structure adjusted successfully.');
          this.isStructureModalOpen.set(false);
          this.loadData();
        }
      }
    });
  }

  // --- PAYMENT HISTORY & RECEIPTS ---
  viewPaymentHistory(struct: FeeStructure) {
    this.activeStructure.set(struct);
    this.historyPayments.set(struct.payments || []);
    this.isHistoryModalOpen.set(true);
  }

  printReceipt(paymentId: number) {
    this.router.navigate(['/mentor/fees/receipt', paymentId]);
  }

  // --- VERIFY PAYMENTS ---
  verifyPayment(payment: FeePayment) {
    this.apiService.verifyFeePayment(payment.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(res.message || 'Payment verified.');
          this.loadData();
        }
      }
    });
  }

  batchVerifyAll() {
    const ids = this.pendingPayments().map(p => p.id);
    if (ids.length === 0) return;

    this.apiService.batchVerifyFees(ids).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(res.message || 'All payments verified.');
          this.loadData();
        }
      }
    });
  }
}
