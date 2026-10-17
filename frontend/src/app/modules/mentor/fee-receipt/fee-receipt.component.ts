import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FeePayment } from '../../../core/models/entities';

@Component({
  selector: 'app-fee-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fee-receipt.component.html',
  styleUrl: './fee-receipt.component.scss'
})
export class FeeReceiptComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  payment = signal<FeePayment | null>(null);
  institute = signal<any>(null);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.notification.error('Invalid receipt ID');
      this.goBack();
      return;
    }

    this.apiService.getFeeReceipt(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.payment.set(res.payment);
          this.institute.set(res.institute);
        } else {
          this.notification.error(res.message || 'Receipt not found');
          this.goBack();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to load receipt');
        this.isLoading.set(false);
        this.goBack();
      }
    });
  }

  printReceipt() {
    window.print();
  }

  goBack() {
    window.history.back();
  }
}
