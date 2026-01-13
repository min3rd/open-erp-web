import { Routes } from '@angular/router';
import { Ward } from './ward';
import { WardList } from './list/list';
import { WardForm } from './form/form';
import { wardDetailResolver } from './resolvers/ward-detail.resolver';
import { wardListResolver } from './resolvers/ward-list.resolver';
import { provinceListResolver } from '../province/resolvers/province-list.resolver';
import { districtListResolver } from '../district/resolvers/district-list.resolver';

export const routes: Routes = [
  {
    path: '',
    component: Ward,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all-provinces/all-districts/all/1/100',
      },
      {
        path: ':provinceFilter',
        children: [
          {
            path: ':districtFilter',
            children: [
              {
                path: ':filter',
                children: [
                  {
                    path: ':page',
                    children: [
                      {
                        path: ':limit',
                        component: WardList,
                        resolve: {
                          wardList: wardListResolver,
                          provinceList: provinceListResolver,
                          districtList: districtListResolver,
                        },
                        children: [
                          {
                            path: 'new',
                            pathMatch: 'full',
                            component: WardForm,
                          },
                          {
                            path: ':code',
                            resolve: {
                              ward: wardDetailResolver,
                            },
                            children: [
                              {
                                path: '',
                                pathMatch: 'full',
                                redirectTo: 'view',
                              },
                              {
                                path: 'view',
                                component: WardForm,
                              },
                              {
                                path: 'edit',
                                component: WardForm,
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
        ],
      },
    ],
  },
];
