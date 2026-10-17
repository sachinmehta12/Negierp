import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { InstituteSettings } from '../../../core/models/entities';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  settingsForm = this.fb.group({
    name: ['', [Validators.required]],
    tagline: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required]],
    mailServer: [''],
    mailPort: [587],
    mailUsername: [''],
    mailPassword: ['']
  });

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading.set(true);
    this.apiService.getSettings().subscribe({
      next: (res) => {
        if (res.success && res.settings) {
          const s: InstituteSettings = res.settings;
          this.settingsForm.patchValue({
            name: s.name,
            tagline: s.tagline || 'Learn • Grow • Succeed',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            mailServer: s.mailServer || '',
            mailPort: s.mailPort || 587,
            mailUsername: s.mailUsername || '',
            mailPassword: ''
          });
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  saveSettings() {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.apiService.updateSettings(this.settingsForm.value).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.notification.success('Institute settings saved successfully');
        }
      },
      error: () => this.isSaving.set(false)
    });
  }
}
