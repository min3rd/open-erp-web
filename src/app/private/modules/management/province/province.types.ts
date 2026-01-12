/**
 * Province model matching backend common-service province.controller.ts
 */
import type { Geometry } from 'geojson';
import type { ApiPaginatedData } from '../../../../../core/api/interfaces';
import type { TreeNode } from 'primeng/api';

/**
 * Entity scope type for hierarchical administrative divisions
 */
export type EntityScope = 'province' | 'district' | 'ward';

/**
 * Base interface for administrative entities
 */
export interface BaseAdministrativeEntity {
  id: string;
  code: string;
  name: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  scope: EntityScope;
  parentCode?: string;
}

/**
 * Province entity (root level)
 */
export interface Province extends BaseAdministrativeEntity {
  scope: 'province';
  region: string;
  parentCode?: never;
}

/**
 * District entity (level 1 - optional in Vietnam's 2-tier system)
 */
export interface District extends BaseAdministrativeEntity {
  scope: 'district';
  parentCode: string; // Province code
  type?: string; // e.g., "Urban District", "Rural District"
}

/**
 * Ward entity (level 2)
 */
export interface Ward extends BaseAdministrativeEntity {
  scope: 'ward';
  parentCode: string; // District code or Province code (for 2-tier)
  type?: string; // e.g., "Ward", "Commune", "Town"
}

/**
 * Union type for all administrative entities
 */
export type AdministrativeEntity = Province | District | Ward;

/**
 * Tree node data structure for PrimeNG TreeTable
 */
export interface AdministrativeTreeNode extends TreeNode<AdministrativeEntity> {
  data: AdministrativeEntity;
  children?: AdministrativeTreeNode[];
  leaf?: boolean;
  expanded?: boolean;
  loading?: boolean;
}

/**
 * Response format options for API
 */
export type ResponseFormat = 'tree' | 'flat';

/**
 * Province list response with pagination - uses core API interface
 */
export type ProvinceListResponse = ApiPaginatedData<Province>;

/**
 * Generic administrative entity list response
 */
export type AdministrativeEntityListResponse = ApiPaginatedData<AdministrativeEntity>;

/**
 * Parameters for getting administrative entities
 */
export interface GetAdministrativeEntitiesParams {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  scope?: EntityScope;
  parentCode?: string;
  format?: ResponseFormat;
  lazy?: boolean;
}

/**
 * Parameters for getting provinces (backward compatibility)
 */
export interface GetProvincesParams {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  format?: ResponseFormat;
  lazy?: boolean;
}

/**
 * Parameters for getting districts
 */
export interface GetDistrictsParams {
  page?: number;
  limit?: number;
  search?: string;
  provinceCode?: string;
  parentCode?: string;
}

/**
 * Parameters for getting wards
 */
export interface GetWardsParams {
  page?: number;
  limit?: number;
  search?: string;
  districtCode?: string;
  parentCode?: string;
}

/**
 * Create province DTO
 */
export interface CreateProvinceDto {
  code: string;
  name: string;
  region: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
}

/**
 * Create district DTO
 */
export interface CreateDistrictDto {
  code: string;
  name: string;
  parentCode: string; // Province code
  type?: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
}

/**
 * Create ward DTO
 */
export interface CreateWardDto {
  code: string;
  name: string;
  parentCode: string; // District code or Province code
  type?: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
}

/**
 * Update province DTO
 */
export interface UpdateProvinceDto {
  code?: string;
  name?: string;
  region?: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
}

/**
 * Update district DTO
 */
export interface UpdateDistrictDto {
  code?: string;
  name?: string;
  parentCode?: string;
  type?: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
}

/**
 * Update ward DTO
 */
export interface UpdateWardDto {
  code?: string;
  name?: string;
  parentCode?: string;
  type?: string;
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
