import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StudentProfile, Stream } from '../../../core/models/entities';

@Component({
  selector: 'app-stream-selection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './stream-selection.component.html',
  styleUrl: './stream-selection.component.scss'
})
export class StreamSelectionComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  student = signal<StudentProfile | null>(null);
  streams = signal<Stream[]>([]);

  selectedStreamId = signal<number | null>(null);
  lockStream = false;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.apiService.getSelfProfile().subscribe({
      next: (res) => {
        if (res.success && res.student) {
          this.student.set(res.student);
          this.selectedStreamId.set(res.student.streamId || null);
        }

        this.apiService.getStreams().subscribe({
          next: (streamRes) => {
            if (streamRes.success) {
              this.streams.set((streamRes.streams || []).filter((s: Stream) => s.isActive));
            }
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  saveStream() {
    const id = this.selectedStreamId();
    if (!id) {
      this.notification.warning('Please select an academic stream.');
      return;
    }

    this.isSaving.set(true);
    this.apiService.selectSelfStream({
      streamId: id,
      lockStream: this.lockStream
    }).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.notification.success('Academic stream selected successfully! Now configure your individual coaching subjects.');
          this.router.navigate(['/student/subject-selection']);
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notification.error(err.error?.message || 'Failed to select stream');
      }
    });
  }
}
