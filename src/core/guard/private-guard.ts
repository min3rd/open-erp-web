import type { CanActivateFn } from '@angular/router';

export const privateGuard: CanActivateFn = (route, state) => {
  // Temporarily allow all access for demo routes
  if (state.url.includes('/demo')) {
    return true;
  }
  return false;
};
