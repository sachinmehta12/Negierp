import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  isLoading = false;
  pwForm = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  onSubmit() {
    if (this.pwForm.invalid) {
      this.pwForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.pwForm.value;
    if (newPassword !== confirmPassword) {
      this.notification.error('New password and confirm password do not match.');
      return;
    }

    this.isLoading = true;
    this.authService.changePassword({
      currentPassword: currentPassword!,
      newPassword: newPassword!
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.notification.success(res.message || 'Password changed successfully!');
        if (this.authService.isStudent()) {
          this.router.navigate(['/student/dashboard']);
        } else {
          this.router.navigate(['/mentor/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(err.error?.message || 'Failed to change password.');
      }
    });
  }
}
