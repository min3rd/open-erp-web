import { Routes } from '@angular/router';
import { Demo } from './demo/demo';

export const routes: Routes = [
  {
    path: 'modules',
    loadChildren: () => import('./modules/modules.routes').then((m) => m.routes),
  },
  {
    path: 'demo',
    component: Demo,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'demo',
  },
];
