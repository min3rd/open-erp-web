import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URI_INVENTORY } from '../../../../../core/api/constants';
import { ApiEnvelope, ApiPaginatedEnvelope } from '../../../../../core/api/interfaces';
import {
  Warehouse,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  QueryWarehouseParams,
  ProvinceDto,
  WardDto,
} from '../warehouse.types';

/**
 * Warehouse service - handles all warehouse-related API calls
 * Backend controller: apps/inventory/src/controllers/warehouse.controller.ts
 */
@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_URI_INVENTORY}/warehouses`;

  /**
   * Get all warehouses with filtering and pagination
   * GET /warehouses
   */
  getWarehouses(params: QueryWarehouseParams): Observable<{ items: Warehouse[]; total: number; page: number; limit: number }> {
    let httpParams = new HttpParams();
    
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.provinceCode) httpParams = httpParams.set('provinceCode', params.provinceCode);
    if (params.wardCode) httpParams = httpParams.set('wardCode', params.wardCode);
    if (params.region) httpParams = httpParams.set('region', params.region);
    if (params.tenantId) httpParams = httpParams.set('tenantId', params.tenantId);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.bbox) httpParams = httpParams.set('bbox', params.bbox);

    return this.http
      .get<ApiPaginatedEnvelope<Warehouse>>(this.baseUrl, { params: httpParams })
      .pipe(
        map((response) => ({
          items: response.data.items,
          total: response.data.pagination.total,
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
        }))
      );
  }

  /**
   * Get warehouse by ID
   * GET /warehouses/:id
   */
  getWarehouseById(id: string): Observable<Warehouse | null> {
    return this.http
      .get<ApiEnvelope<Warehouse>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Create new warehouse
   * POST /warehouses
   */
  createWarehouse(dto: CreateWarehouseDto): Observable<Warehouse> {
    return this.http
      .post<ApiEnvelope<{ item: Warehouse }>>(this.baseUrl, dto)
      .pipe(map((response) => response.data.item));
  }

  /**
   * Update warehouse
   * PATCH /warehouses/:id
   */
  updateWarehouse(id: string, dto: UpdateWarehouseDto): Observable<Warehouse> {
    return this.http
      .patch<ApiEnvelope<{ item: Warehouse }>>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((response) => response.data.item));
  }

  /**
   * Delete warehouse (soft delete)
   * DELETE /warehouses/:id
   */
  deleteWarehouse(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<null>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }

  /**
   * Bulk delete warehouses
   * POST /warehouses/bulk-delete (if available) or multiple DELETE calls
   */
  bulkDeleteWarehouses(ids: string[]): Observable<void> {
    // If backend supports bulk delete endpoint, use it
    // Otherwise, make multiple delete calls
    return this.http
      .post<ApiEnvelope<null>>(`${this.baseUrl}/bulk-delete`, { ids })
      .pipe(map(() => undefined));
  }

  /**
   * Get list of provinces for dropdown
   * GET /warehouses/provinces
   */
  getProvinces(): Observable<ProvinceDto[]> {
    return this.http
      .get<ApiEnvelope<ProvinceDto[]>>(`${this.baseUrl}/provinces`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get list of wards by province code for dropdown
   * GET /warehouses/provinces/:provinceCode/wards
   */
  getWardsByProvince(provinceCode: string): Observable<WardDto[]> {
    return this.http
      .get<ApiEnvelope<WardDto[]>>(`${this.baseUrl}/provinces/${provinceCode}/wards`)
      .pipe(map((response) => response.data));
  }

  /**
   * Find warehouses nearby a location
   * GET /warehouses/nearby
   */
  findNearby(longitude: number, latitude: number, radiusKm: number, limit?: number): Observable<Warehouse[]> {
    let httpParams = new HttpParams()
      .set('longitude', longitude.toString())
      .set('latitude', latitude.toString())
      .set('radiusKm', radiusKm.toString());
    
    if (limit) {
      httpParams = httpParams.set('limit', limit.toString());
    }

    return this.http
      .get<ApiEnvelope<Warehouse[]>>(`${this.baseUrl}/nearby`, { params: httpParams })
      .pipe(map((response) => response.data));
  }

  /**
   * Export warehouses as CSV
   * GET /warehouses/export/csv (if available)
   */
  exportCSV(params: QueryWarehouseParams): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get(`${this.baseUrl}/export/csv`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  /**
   * Export warehouses as GeoJSON
   * GET /warehouses/export/geojson (if available)
   */
  exportGeoJSON(params: QueryWarehouseParams): Observable<Blob> {
    let httpParams = new HttpParams();
    
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get(`${this.baseUrl}/export/geojson`, {
      params: httpParams,
      responseType: 'blob',
    });
  }
}
