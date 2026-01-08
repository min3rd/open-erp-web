import { Routes } from '@angular/router';
import { Navigation } from './navigation';

export const routes: Routes = [
  {
    path: '',
    component: Navigation,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'global',
      },
      {
        path: ':scope',
        loadComponent: () => import('./list/list').then((m) => m.NavigationList),
        children: [
          {
            path: 'new',
            pathMatch: 'full',
            loadComponent: () => import('./detail/detail').then((m) => m.NavigationDetail),
          },
          {
            path: ':id',
            loadComponent: () => import('./detail/detail').then((m) => m.NavigationDetail),
            children: [
              {
                path: 'edit',
                pathMatch: 'full',
                loadComponent: () => import('./detail/detail').then((m) => m.NavigationDetail),
              },
            ],
          },
        ],
      },
    ],
  },
];

