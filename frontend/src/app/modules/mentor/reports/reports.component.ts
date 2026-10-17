import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  download(type: 'students' | 'fees' | 'marks' | 'attendance', title: string) {
    this.notification.info(`Preparing ${title} CSV export...`);
    this.apiService.downloadReport(type);
  }
}
