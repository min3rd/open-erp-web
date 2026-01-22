import { Routes } from '@angular/router';
import { Warehouse } from './warehouse';
import { WarehouseList } from './list/list';
import { WarehouseForm } from './form/form';
import { warehouseDetailResolver } from './resolvers/warehouse-detail.resolver';
import { warehouseListResolver } from './resolvers/warehouse-list.resolver';

export const routes: Routes = [
  {
    path: '',
    component: Warehouse,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all/-/1/100',
      },
      {
        path: ':scope',
        children: [
          {
            path: ':search',
            children: [
              {
                path: ':page',
                children: [
                  {
                    path: ':limit',
                    component: WarehouseList,
                    resolve: {
                      warehouseList: warehouseListResolver,
                    },
                    children: [
                      {
                        path: 'new',
                        pathMatch: 'full',
                        component: WarehouseForm,
                      },
                      {
                        path: ':id',
                        resolve: {
                          warehouse: warehouseDetailResolver,
                        },
                        children: [
                          {
                            path: '',
                            pathMatch: 'full',
                            redirectTo: 'view',
                          },
                          {
                            path: 'view',
                            component: WarehouseForm,
                          },
                          {
                            path: 'edit',
                            component: WarehouseForm,
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
