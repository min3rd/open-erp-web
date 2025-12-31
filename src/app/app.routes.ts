import { Routes } from '@angular/router';
import { privateGuard } from '../core/guard/private-guard';

export const routes: Routes = [
  {
    path: 'private',
    canActivate: [privateGuard],
    loadChildren: () => import('./private/private.routes').then((m) => m.routes),
  },
  {
    path: 'auth',
    loadChildren: () => import('./public/public.routes').then((m) => m.routes),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'private/private-demo',
  },
];
