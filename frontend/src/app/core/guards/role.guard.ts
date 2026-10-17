import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  const expectedRoles = route.data['roles'] as string[];
  const user = authService.currentUser();

  if (!user) {
    return true; // Let loadCurrentUser finish or intercept
  }

  const userRole = user.role;
  const isOwner = userRole === 'owner';
  const isAllowed = expectedRoles.includes(userRole) || (isOwner && expectedRoles.includes('mentor'));

  if (!isAllowed) {
    if (userRole === 'student') {
      router.navigate(['/student/dashboard']);
    } else {
      router.navigate(['/mentor/dashboard']);
    }
    return false;
  }

  return true;
};
