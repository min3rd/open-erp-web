import { Routes } from '@angular/router';
import { privateGuard } from '../core/guard/private-guard';
import { Layout } from '../core/layout/layout';
import { forkJoin } from 'rxjs';
import { inject } from '@angular/core';
import { NavigationService } from '../core/services/navigation';

const initializeData = () => {
  const navigationService = inject(NavigationService);
  return forkJoin(navigationService.loadModules());
};

export const routes: Routes = [
  {
    path: '',
    canActivate: [privateGuard],
    component: Layout,
    resolve: [initializeData],
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
