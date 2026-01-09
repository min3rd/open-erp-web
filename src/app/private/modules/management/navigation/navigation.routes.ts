import { ActivatedRouteSnapshot, RouterStateSnapshot, Routes } from '@angular/router';
import { Navigation } from './navigation';
import { inject } from '@angular/core';
import { NavigationManagementService } from './services/navigation-management.service';

const globalListResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const navigationManagementService = inject(NavigationManagementService);
  return navigationManagementService.getGlobalNavigation({ includeHidden: true });
};

const moduleListResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const navigationManagementService = inject(NavigationManagementService);
  return navigationManagementService.getModuleNavigation(route.params['moduleKey'], {
    includeHidden: true,
  });
};

const detailResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {};

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
        path: 'global',
        resolve: [globalListResolver],
        loadComponent: () => import('./list/list').then((m) => m.NavigationList),
        children: [
          {
            path: ':id',
            resolve: [detailResolver],
            // detail view for global navigation item
            children: [
              {
                path: 'edit',
                pathMatch: 'full',
                resolve: [detailResolver],
                // edit global navigation item
                loadComponent: () => import('./detail/detail').then((m) => m.NavigationDetail),
              },
            ],
          },
          {
            path: 'modules',
            pathMatch: 'full',
            children: [
              {
                path: ':moduleKey',
                resolve: [moduleListResolver],
                children: [
                  {
                    path: 'new',
                    pathMatch: 'full',
                    loadComponent: () => import('./detail/detail').then((m) => m.NavigationDetail),
                  },
                  {
                    path: ':id',
                    resolve: [detailResolver],
                    loadComponent: () => import('./detail/detail').then((m) => m.NavigationDetail),
                    children: [
                      {
                        path: 'edit',
                        pathMatch: 'full',
                        resolve: [detailResolver],
                        loadComponent: () =>
                          import('./detail/detail').then((m) => m.NavigationDetail),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
