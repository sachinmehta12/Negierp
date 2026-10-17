import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);

  isLoading = false;
  loginForm = this.fb.group({
    usernameOrEmail: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  fillDemo(role: 'owner' | 'mentor' | 'student') {
    if (role === 'owner') {
      this.loginForm.patchValue({ usernameOrEmail: 'owner', password: 'Password123' });
    } else if (role === 'mentor') {
      this.loginForm.patchValue({ usernameOrEmail: 'mentor', password: 'Password123' });
    } else {
      this.loginForm.patchValue({ usernameOrEmail: 'student', password: 'Password123' });
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { usernameOrEmail, password } = this.loginForm.value;

    this.authService.login({
      usernameOrEmail: usernameOrEmail!,
      password: password!
    }).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }
}
