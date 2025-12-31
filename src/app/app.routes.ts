import { Routes } from '@angular/router';
import { privateGuard } from '../core/guard/private-guard';
import { Layout } from '../core/layout/layout';

export const routes: Routes = [
  {
    path: '',
    canActivate: [privateGuard],
    component: Layout,
    data: {
      layout: 'vertical',
    },
    loadChildren: () => import('./private/private.routes').then((m) => m.routes),
  },
  {
    path: '',
    component: Layout,
    data: {
      layout: 'empty',
    },
    loadChildren: () => import('./public/public.routes').then((m) => m.routes),
  },
];
