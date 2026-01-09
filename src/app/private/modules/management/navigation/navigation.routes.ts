import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, Routes } from '@angular/router';
import { Navigation } from './navigation';
import { inject } from '@angular/core';
import { NavigationManagementService } from './services/navigation-management.service';
import { catchError, of } from 'rxjs';

/**
 * Resolver for loading global navigation items before route activation
 * Returns observable that emits navigation items or navigates to error page on failure
 */
const globalListResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const navigationManagementService = inject(NavigationManagementService);
  const router = inject(Router);
  
  return navigationManagementService.getGlobalNavigation({ includeHidden: true }).pipe(
    catchError((error) => {
      console.error('Failed to load global navigation:', error);
      // Navigate to error page or return empty array
      return of([]);
    })
  );
};

/**
 * Resolver for loading module-specific navigation items before route activation
 * Returns observable that emits navigation items or navigates to error page on failure
 */
const moduleListResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const navigationManagementService = inject(NavigationManagementService);
  const router = inject(Router);
  const moduleKey = route.params['moduleKey'];
  
  if (!moduleKey) {
    console.error('Module key is required for module navigation resolver');
    return of([]);
  }
  
  return navigationManagementService.getModuleNavigation(moduleKey, {
    includeHidden: true,
  }).pipe(
    catchError((error) => {
      console.error(`Failed to load module navigation for ${moduleKey}:`, error);
      // Return empty array on error
      return of([]);
    })
  );
};

/**
 * Resolver for loading a single navigation item before route activation
 * Returns observable that emits navigation item or navigates to error page on failure
 */
const detailResolver = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const navigationManagementService = inject(NavigationManagementService);
  const router = inject(Router);
  const id = route.params['id'];
  
  // If no ID is provided (e.g., for 'new' route), skip loading
  if (!id || id === 'new') {
    return of(null);
  }
  
  return navigationManagementService.getNavigationItem(id).pipe(
    catchError((error) => {
      console.error(`Failed to load navigation item ${id}:`, error);
      // Navigate back to list on error
      router.navigate(['/management/navigation/global']);
      return of(null);
    })
  );
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
