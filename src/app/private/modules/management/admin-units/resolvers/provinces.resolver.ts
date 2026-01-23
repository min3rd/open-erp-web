import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { map } from 'rxjs/operators';
import { ProvinceService } from '../../province/services/province.service';
import { Province } from '../../province/province.types';

/**
 * Resolver to preload provinces list for admin units screen
 */
export const provincesResolver: ResolveFn<Province[]> = () => {
  const provinceService = inject(ProvinceService);
  
  // Load all provinces without pagination (typically small dataset)
  return provinceService.getProvinces({ page: 1, limit: 100 }).pipe(
    map(response => response.items)
  );
};
