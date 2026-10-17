import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        notification.error('Your session has expired or is invalid. Please sign in again.');
        authService.logout();
      } else if (error.status === 403) {
        notification.error(error.error?.message || 'Access Forbidden: Insufficient permissions.');
      } else if (error.status >= 500) {
        notification.error(error.error?.message || 'Server error occurred. Please try again.');
      }
      return throwError(() => error);
    })
  );
};
