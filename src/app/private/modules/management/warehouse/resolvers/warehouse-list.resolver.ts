import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WarehouseService } from '../services/warehouse.service';
import { WarehouseListResponse } from '../warehouse.types';

export const warehouseListResolver: ResolveFn<WarehouseListResponse | null> = (
  route: ActivatedRouteSnapshot
): Observable<WarehouseListResponse | null> => {
  const service = inject(WarehouseService);
  
  // Get route parameters
  const scope = route.paramMap.get('scope') || 'all';
  const search = route.paramMap.get('search') || '';
  const page = parseInt(route.paramMap.get('page') || '1', 10);
  const limit = parseInt(route.paramMap.get('limit') || '100', 10);

  // Build params
  const params: any = {
    page,
    limit,
  };

  // Handle scope parameter
  if (scope !== 'all') {
    // Check if it's an org scope: org:<orgId>
    if (scope.startsWith('org:')) {
      params.organizationId = scope.substring(4);
      params.scope = 'org';
    } else {
      params.scope = scope;
    }
  }

  // Add search if provided
  if (search && search !== '-') {
    params.search = search;
  }

  return service.getWarehouses(params).pipe(
    catchError((error) => {
      console.error('Failed to load warehouses:', error);
      return of(null);
    })
  );
};
