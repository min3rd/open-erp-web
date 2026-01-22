/**
 * Warehouse model matching backend inventory/common-service warehouse controller
 */
import type { Geometry } from 'geojson';
import type { ApiPaginatedData } from '../../../../../core/api/interfaces';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  organizationId?: string;
  organizationName?: string;
  type?: string;
  status?: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Warehouse list response with pagination - uses core API interface
 */
export type WarehouseListResponse = ApiPaginatedData<Warehouse>;

/**
 * Parameters for getting warehouses
 */
export interface GetWarehousesParams {
  page?: number;
  limit?: number;
  search?: string;
  scope?: string;
  organizationId?: string;
}

/**
 * Create warehouse DTO
 */
export interface CreateWarehouseDto {
  code: string;
  name: string;
  address?: string;
  organizationId?: string;
  type?: string;
  status?: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
}

/**
 * Update warehouse DTO
 */
export interface UpdateWarehouseDto {
  code?: string;
  name?: string;
  address?: string;
  organizationId?: string;
  type?: string;
  status?: string;
  geometry?: Geometry;
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
