import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./province').then((m) => m.Province),
    children: [],
  },
];
