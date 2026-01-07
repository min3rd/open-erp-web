import { Routes } from '@angular/router';
import { Management } from './management';

export const routes: Routes = [
  {
    path: '',
    component: Management,
    children: [
      {
        path: 'user',
        loadChildren: () => import('./user/user.routes').then((m) => m.routes),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'user',
      },
    ],
  },
];
