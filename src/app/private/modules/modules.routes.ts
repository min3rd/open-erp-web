import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'organization',
    loadChildren: () => import('./organization/organization.routes').then((m) => m.routes),
  },
];
