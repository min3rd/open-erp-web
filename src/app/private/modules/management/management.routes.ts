import { Routes } from '@angular/router';
import { Management } from './management';

export const routes: Routes = [
  {
    path: '',
    component: Management,
    children: [],
  },
];
