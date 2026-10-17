import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, ModalComponent],
  templateUrl: './student-detail.component.html',
  styleUrl: './student-detail.component.scss'
})
export class StudentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  protected readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  student = signal<any>(null);
  allClassSubjects = signal<any[]>([]);
  attendancePercentage = signal<number>(100);

  // Modals
  isSubjectModalOpen = signal<boolean>(false);
  isPaymentModalOpen = signal<boolean>(false);
  isFeeAdjustModalOpen = signal<boolean>(false);

  selectedSubjectIds: number[] = [];
  lockSubjectsFlag = false;

  paymentForm = this.fb.group({
    amount: [0, [Validators.required, Validators.min(1)]],
    paymentDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    paymentMode: ['UPI'],
    referenceNo: [''],
    remarks: ['']
  });

  adjustForm = this.fb.group({
    totalAnnualFee: [0, [Validators.required, Validators.min(0)]],
    discountAmount: [0, [Validators.min(0)]],
    discountReason: ['']
  });

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      if (id) {
        this.loadStudent(id);
      }
    });
  }

  loadStudent(id: number) {
    this.isLoading.set(true);
    this.apiService.getStudentById(id).subscribe({
      next: (res) => {
        if (res.success) {
          const attRecords = res.student.attendanceRecords || [];
          const totalAtt = attRecords.length;
          const effectiveAtt = attRecords.filter((a: any) => a.status === 'Present' || a.status === 'Late').length;
          const attPct = totalAtt > 0 ? Math.round((effectiveAtt / totalAtt) * 100 * 10) / 10 : 100;
          this.attendancePercentage.set(attPct);

          // Pre-populate forms
          const fs = res.student.feeStructures?.[0];
          if (fs) {
            this.adjustForm.patchValue({
              totalAnnualFee: fs.totalAnnualFee,
              discountAmount: fs.discountAmount,
              discountReason: fs.discountReason || ''
            });
            this.paymentForm.patchValue({
              amount: fs.dueAmount > 0 ? Math.min(5000, fs.dueAmount) : 0
            });
          }

          // Fetch subjects available for this class
          this.loadClassSubjects(res.student.targetClass, res.student.streamId);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadClassSubjects(targetClass: number, streamId?: number) {
    this.apiService.getSubjects({ class: targetClass, streamId: streamId || undefined }).subscribe({
      next: (res) => {
        if (res.success) {
          this.allClassSubjects.set(res.subjects);
        }
      }
    });
  }

  openSubjectModal() {
    const enrolledIds = this.student()?.subjectEnrollments?.map((e: any) => e.subjectId) || [];
    this.selectedSubjectIds = [...enrolledIds];
    this.lockSubjectsFlag = this.student()?.isSubjectLocked || false;
    this.isSubjectModalOpen.set(true);
  }

  toggleSubjectSelection(id: number) {
    if (this.selectedSubjectIds.includes(id)) {
      this.selectedSubjectIds = this.selectedSubjectIds.filter(sid => sid !== id);
    } else {
      this.selectedSubjectIds.push(id);
    }
  }

  saveSubjects() {
    this.apiService.assignStudentSubjects(this.student().id, this.selectedSubjectIds, this.lockSubjectsFlag).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(res.message);
          this.isSubjectModalOpen.set(false);
          this.loadStudent(this.student().id);
        }
      }
    });
  }

  openPaymentModal() {
    this.isPaymentModalOpen.set(true);
  }

  recordPayment() {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    this.apiService.recordFeePayment(this.student().id, this.paymentForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(res.message);
          this.isPaymentModalOpen.set(false);
          this.loadStudent(this.student().id);
        }
      }
    });
  }

  openFeeAdjustModal() {
    this.isFeeAdjustModalOpen.set(true);
  }

  saveFeeAdjustment() {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      return;
    }

    this.apiService.adjustFeeStructure(this.student().id, this.adjustForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(res.message);
          this.isFeeAdjustModalOpen.set(false);
          this.loadStudent(this.student().id);
        }
      }
    });
  }

  toggleActive() {
    this.apiService.toggleStudentActive(this.student().id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.info(res.message);
          this.loadStudent(this.student().id);
        }
      }
    });
  }
}
