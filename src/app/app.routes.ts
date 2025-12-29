import { Routes } from '@angular/router';
import { privateGuard } from '../core/guard/private-guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [privateGuard],
    loadChildren: () => import('./private/private.routes').then((m) => m.routes),
  },
  {
    path: '',
    loadChildren: () => import('./public/public.routes').then((m) => m.routes),
  },
];
