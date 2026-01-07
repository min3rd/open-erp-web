import { Routes } from '@angular/router';
import { User } from './user';
import { List } from './list/list';
import { Detail } from './detail/detail';

export const routes: Routes = [
  {
    path: '',
    component: User,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all/1/10',
      },
      {
        path: ':filter',
        children: [
          {
            path: ':page',
            children: [
              {
                path: ':limit',
                component: List,
                children: [
                  {
                    path: 'new',
                    pathMatch: 'full',
                    component: Detail,
                  },
                  {
                    path: ':id',
                    component: Detail,
                    children: [
                      {
                        path: 'edit',
                        pathMatch: 'full',
                        component: Detail,
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
