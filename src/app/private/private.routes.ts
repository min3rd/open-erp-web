import { Routes } from '@angular/router';
import { PrivateDemo } from './private-demo';

export const routes: Routes = [
  {
    path: 'private-demo',
    component: PrivateDemo,
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'private-demo',
  },
];
