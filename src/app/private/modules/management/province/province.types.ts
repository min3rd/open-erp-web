/**
 * Province model matching backend common-service province.controller.ts
 */
export interface Province {
  id: string;
  code: string;
  name: string;
  region: string;
  geometry?: GeoJSON.Geometry;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Province list response with pagination
 */
export interface ProvinceListResponse {
  data: Province[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Parameters for getting provinces
 */
export interface GetProvincesParams {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
}

/**
 * Create province DTO
 */
export interface CreateProvinceDto {
  code: string;
  name: string;
  region: string;
  geometry?: GeoJSON.Geometry;
  meta?: Record<string, any>;
}

/**
 * Update province DTO
 */
export interface UpdateProvinceDto {
  code?: string;
  name?: string;
  region?: string;
  geometry?: GeoJSON.Geometry;
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
