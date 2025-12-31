import { Routes } from '@angular/router';
import { Layout } from '../../../core/layout/layout';

export const routes: Routes = [
  {
    path: 'vertical',
    component: Layout,
    data: { layoutType: 'vertical' },
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard').then((m) => m.DemoDashboard),
        data: { layoutType: 'vertical' },
      },
    ],
  },
  {
    path: 'horizontal',
    component: Layout,
    data: { layoutType: 'horizontal' },
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard').then((m) => m.DemoDashboard),
        data: { layoutType: 'horizontal' },
      },
    ],
  },
  {
    path: '',
    redirectTo: 'vertical',
    pathMatch: 'full',
  },
];
