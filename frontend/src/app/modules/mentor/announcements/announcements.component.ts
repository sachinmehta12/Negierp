import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Announcement } from '../../../core/models/entities';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss'
})
export class AnnouncementsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  announcements = signal<Announcement[]>([]);
  selectedClassFilter = signal<string>('All');

  isModalOpen = signal<boolean>(false);
  announcementForm = this.fb.group({
    title: ['', [Validators.required]],
    content: ['', [Validators.required]],
    targetClass: ['All', [Validators.required]],
    priority: ['Normal', [Validators.required]]
  });

  ngOnInit() {
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.isLoading.set(true);
    const cls = this.selectedClassFilter() === 'All' ? undefined : this.selectedClassFilter();
    this.apiService.getAnnouncements(cls).subscribe({
      next: (res) => {
        if (res.success) {
          this.announcements.set(res.announcements || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onFilterChange(cls: string) {
    this.selectedClassFilter.set(cls);
    this.loadAnnouncements();
  }

  openCreateModal() {
    this.announcementForm.reset({
      title: '',
      content: '',
      targetClass: 'All',
      priority: 'Normal'
    });
    this.isModalOpen.set(true);
  }

  saveAnnouncement() {
    if (this.announcementForm.invalid) {
      this.announcementForm.markAllAsTouched();
      return;
    }

    this.apiService.createAnnouncement(this.announcementForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('Announcement broadcasted successfully');
          this.isModalOpen.set(false);
          this.loadAnnouncements();
        }
      }
    });
  }

  deleteAnnouncement(ann: Announcement) {
    if (confirm(`Delete announcement "${ann.title}"?`)) {
      this.apiService.deleteAnnouncement(ann.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success('Announcement deleted');
            this.loadAnnouncements();
          }
        }
      });
    }
  }
}
