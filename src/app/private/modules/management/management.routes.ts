import { Routes } from '@angular/router';
import { Management } from './management';

export const routes: Routes = [
  {
    path: '',
    component: Management,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'user',
      },
      {
        path: 'user',
        loadChildren: () => import('./user/user.routes').then((m) => m.routes),
      },
      {
        path: 'navigation',
        loadChildren: () => import('./navigation/navigation.routes').then((m) => m.routes),
      },
      {
        path: 'province',
        loadChildren: () => import('./province/province.routes').then((m) => m.routes),
      },
      {
        path: 'district',
        loadChildren: () => import('./district/district.routes').then((m) => m.routes),
      },
      {
        path: 'ward',
        loadChildren: () => import('./ward/ward.routes').then((m) => m.routes),
      },
    ],
  },
];
