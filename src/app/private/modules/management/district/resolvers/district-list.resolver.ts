import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DistrictService } from '../services/district.service';
import { DistrictListResponse } from '../district.types';

/**
 * Resolver for district list
 * Pre-loads district list data before the route is activated
 */
export const districtListResolver: ResolveFn<DistrictListResponse | null> = (
  route: ActivatedRouteSnapshot
): Observable<DistrictListResponse | null> => {
  const districtService = inject(DistrictService);
  
  // Get pagination params from route
  const page = parseInt(route.paramMap.get('page') || '1', 10);
  const limit = parseInt(route.paramMap.get('limit') || '10', 10);
  const filter = route.paramMap.get('filter') || 'all';
  
  // Get search query from query params
  const search = filter !== 'all' ? filter : undefined;

  return districtService.getDistricts({ page, limit, search }).pipe(
    catchError((error) => {
      console.error('Failed to resolve district list:', error);
      return of(null);
    })
  );
};
