import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { SubjectChangeRequest } from '../../../core/models/entities';

@Component({
  selector: 'app-stream-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './stream-requests.component.html',
  styleUrl: './stream-requests.component.scss'
})
export class StreamRequestsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  requests = signal<SubjectChangeRequest[]>([]);
  selectedStatus = signal<string>('Pending');

  // Action Modal
  isActionModalOpen = signal<boolean>(false);
  activeRequest = signal<SubjectChangeRequest | null>(null);
  actionType = signal<'approve' | 'reject'>('approve');
  mentorRemarks = '';

  ngOnInit() {
    this.loadRequests();
  }

  loadRequests() {
    this.isLoading.set(true);
    this.apiService.getChangeRequests(this.selectedStatus()).subscribe({
      next: (res) => {
        if (res.success) {
          this.requests.set(res.requests || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onStatusChange(status: string) {
    this.selectedStatus.set(status);
    this.loadRequests();
  }

  openActionModal(req: SubjectChangeRequest, action: 'approve' | 'reject') {
    this.activeRequest.set(req);
    this.actionType.set(action);
    this.mentorRemarks = action === 'approve' 
      ? 'Approved as per student academic consultation.' 
      : 'Denied due to prerequisites or seat limits.';
    this.isActionModalOpen.set(true);
  }

  submitAction() {
    const req = this.activeRequest();
    if (!req) return;

    this.apiService.handleChangeRequest(req.id, {
      action: this.actionType(),
      mentorRemarks: this.mentorRemarks
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success(res.message);
          this.isActionModalOpen.set(false);
          this.loadRequests();
        }
      }
    });
  }
}
