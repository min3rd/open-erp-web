import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { WardService } from '../services/ward.service';

/**
 * Resolver for ward list
 * Pre-loads ward list data before the route is activated
 */
export const wardListResolver: ResolveFn<{ items: any[]; total: number; page: number; limit: number; totalPages: number } | null> = (
  route: ActivatedRouteSnapshot
): Observable<{ items: any[]; total: number; page: number; limit: number; totalPages: number } | null> => {
  const wardService = inject(WardService);
  
  // Get pagination params from route
  const page = parseInt(route.paramMap.get('page') || '1', 10);
  const limit = parseInt(route.paramMap.get('limit') || '100', 10);
  const filter = route.paramMap.get('filter') || 'all';
  const provinceFilter = route.paramMap.get('provinceFilter') || 'all-provinces';
  const districtFilter = route.paramMap.get('districtFilter') || 'all-districts';
  
  // Get sort from query params
  const sort = route.queryParamMap.get('sort') as 'name:asc' | 'name:desc' | null;
  
  // Get search query and filters
  const q = filter !== 'all' ? filter : undefined;
  const provinceCode = provinceFilter !== 'all-provinces' ? provinceFilter : undefined;
  const districtCode = districtFilter !== 'all-districts' ? districtFilter : undefined;

  return wardService.getWards({ 
    page, 
    limit, 
    q, 
    provinceCode, 
    districtCode,
    sort: sort || 'name:asc' // Default to name ascending
  }).pipe(
    catchError((error) => {
      console.error('Failed to resolve ward list:', error);
      return of(null);
    })
  );
};
