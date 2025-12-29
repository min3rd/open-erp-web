import type { CanActivateFn } from '@angular/router';

export const privateGuard: CanActivateFn = (route, state) => {
  return false;
};
