import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, Routes } from '@angular/router';
import { Navigation } from './navigation';
import { inject } from '@angular/core';
import { NavigationManagementService } from './services/navigation-management.service';

const listResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const navigationManagementService = inject(NavigationManagementService);
  return navigationManagementService.getGlobalNavigation({ includeHidden: true });
};

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
        resolve: [listResolver],
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
