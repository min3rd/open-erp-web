import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'demo',
    loadChildren: () => import('./demo/demo.routes').then((m) => m.routes),
  },
];
