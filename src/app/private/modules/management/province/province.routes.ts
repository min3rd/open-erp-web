import { Routes } from '@angular/router';
import { Province } from './province';
import { ProvinceList } from './list/list';
import { ProvinceForm } from './form/form';
import { provinceDetailResolver } from './resolvers/province-detail.resolver';

export const routes: Routes = [
  {
    path: '',
    component: Province,
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
                component: ProvinceList,
                children: [
                  {
                    path: 'new',
                    pathMatch: 'full',
                    component: ProvinceForm,
                  },
                  {
                    path: ':id',
                    children: [
                      {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'view',
                      },
                      {
                        path: 'view',
                        component: ProvinceForm,
                        resolve: {
                          province: provinceDetailResolver,
                        },
                      },
                      {
                        path: 'edit',
                        component: ProvinceForm,
                        resolve: {
                          province: provinceDetailResolver,
                        },
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
