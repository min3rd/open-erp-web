/**
 * District model matching backend common-service district.controller.ts
 */
import type { Geometry } from 'geojson';
import type { ApiPaginatedData } from '../../../../../core/api/interfaces';

export interface District {
  id: string;
  code: string;
  name: {
    vi: string;
    en: string;
  };
  provinceId: string;
  provinceName?: string;
  provinceCode?: string;
  population?: number;
  centroid?: Geometry;
  bbox?: number[];
  geometry?: Geometry;
  note?: string;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * District list response with pagination - uses core API interface
 */
export type DistrictListResponse = ApiPaginatedData<District>;

/**
 * Parameters for getting districts
 */
export interface GetDistrictsParams {
  page?: number;
  limit?: number;
  search?: string;
  provinceId?: string;
}

/**
 * Create district DTO
 */
export interface CreateDistrictDto {
  code: string;
  name: {
    vi: string;
    en: string;
  };
  provinceId: string;
  population?: number;
  centroid?: Geometry;
  bbox?: number[];
  geometry?: Geometry;
  note?: string;
  meta?: Record<string, any>;
}

/**
 * Update district DTO
 */
export interface UpdateDistrictDto {
  code?: string;
  name?: {
    vi?: string;
    en?: string;
  };
  provinceId?: string;
  population?: number;
  centroid?: Geometry;
  bbox?: number[];
  geometry?: Geometry;
  note?: string;
  meta?: Record<string, any>;
}

/**
 * Import result
 */
export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}
