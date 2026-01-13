import { Routes } from '@angular/router';
import { AdministrativeUnit } from './administrative-unit';
import { AdministrativeUnitList } from './list/list';
import { AdministrativeUnitForm } from './form/form';
import { adminUnitTreeResolver } from './resolvers/admin-unit-tree.resolver';
import { adminUnitDetailResolver } from './resolvers/admin-unit-detail.resolver';

export const routes: Routes = [
  {
    path: '',
    component: AdministrativeUnit,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all/1/100',
      },
      {
        path: ':filter',
        children: [
          {
            path: ':page',
            children: [
              {
                path: ':limit',
                component: AdministrativeUnitList,
                resolve: {
                  treeData: adminUnitTreeResolver,
                },
                children: [
                  {
                    path: 'new/:parentType/:parentCode',
                    component: AdministrativeUnitForm,
                  },
                  {
                    path: ':type/:code',
                    resolve: {
                      unit: adminUnitDetailResolver,
                    },
                    children: [
                      {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'view',
                      },
                      {
                        path: 'view',
                        component: AdministrativeUnitForm,
                      },
                      {
                        path: 'edit',
                        component: AdministrativeUnitForm,
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
