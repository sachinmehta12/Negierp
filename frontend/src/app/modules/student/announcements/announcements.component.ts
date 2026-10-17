import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Announcement } from '../../../core/models/entities';

@Component({
  selector: 'app-student-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss'
})
export class StudentAnnouncementsComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  isLoading = signal<boolean>(true);
  announcements = signal<Announcement[]>([]);
  searchQuery = signal<string>('');

  filteredAnnouncements = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.announcements();
    return this.announcements().filter(a =>
      a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.isLoading.set(true);
    this.apiService.getAnnouncements().subscribe({
      next: (res) => {
        if (res.success) {
          this.announcements.set(res.announcements || []);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
