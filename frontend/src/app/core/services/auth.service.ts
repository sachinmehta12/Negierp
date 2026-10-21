import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { User } from '../models/entities';
import { NotificationService } from './notification.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  private readonly API_URL = `${environment.apiUrl}/auth`;

  private readonly currentUserSignal = signal<User | null>(null);
  private readonly tokenSignal = signal<string | null>(this.getStoredToken());

  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly token = this.tokenSignal.asReadonly();
  public readonly isAuthenticated = computed(() => !!this.tokenSignal());
  public readonly isOwner = computed(() => this.currentUserSignal()?.role === 'owner');
  public readonly isMentor = computed(() => {
    const role = this.currentUserSignal()?.role;
    return role === 'mentor' || role === 'owner';
  });
  public readonly isStudent = computed(() => this.currentUserSignal()?.role === 'student');

  constructor() {
    if (this.tokenSignal()) {
      this.loadCurrentUser().subscribe();
    }
  }

  private getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('nt_token');
    }
    return null;
  }

  private setStoredToken(token: string | null) {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        localStorage.setItem('nt_token', token);
      } else {
        localStorage.removeItem('nt_token');
      }
    }
    this.tokenSignal.set(token);
  }

  login(credentials: { usernameOrEmail: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.token) {
          this.setStoredToken(res.token);
          this.currentUserSignal.set(res.user);
          this.notification.success(res.message || 'Logged in successfully!');

          if (res.user.role === 'student') {
            this.router.navigate(['/student/dashboard']);
          } else {
            this.router.navigate(['/mentor/dashboard']);
          }
        }
      })
    );
  }

  registerStudent(studentData: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/register-student`, studentData).pipe(
      tap(res => {
        if (res.success && res.token) {
          this.setStoredToken(res.token);
          this.notification.success(res.message);
          this.loadCurrentUser().subscribe(() => {
            this.router.navigate(['/student/dashboard']);
          });
        }
      })
    );
  }

  registerMentor(mentorData: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/register-mentor`, mentorData).pipe(
      tap(res => {
        if (res.success) {
          this.notification.success(res.message);
        }
      })
    );
  }

  loadCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/me`).pipe(
      tap(res => {
        if (res.success) {
          this.currentUserSignal.set(res.user);
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  changePassword(passwords: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/change-password`, passwords);
  }

  logout() {
    this.setStoredToken(null);
    this.currentUserSignal.set(null);
    this.notification.info('You have been signed out.');
    this.router.navigate(['/auth/login']);
  }
}
