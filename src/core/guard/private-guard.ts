import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const privateGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  return authService.isAuthenticated();
};
