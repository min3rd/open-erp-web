import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WarehouseService } from '../services/warehouse.service';
import { Warehouse } from '../warehouse.types';

export const warehouseDetailResolver: ResolveFn<Warehouse | null> = (
  route: ActivatedRouteSnapshot
): Observable<Warehouse | null> => {
  const service = inject(WarehouseService);
  const id = route.paramMap.get('id');

  if (!id) {
    return of(null);
  }

  return service.getWarehouse(id).pipe(
    catchError((error) => {
      console.error('Failed to load warehouse:', error);
      return of(null);
    })
  );
};
