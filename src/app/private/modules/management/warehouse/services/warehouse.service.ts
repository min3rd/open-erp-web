import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URI_INVENTORY } from '../../../../../../core/constant';
import { 
  ApiPaginatedResponse, 
  ApiSingleResponse,
  unwrap, 
  isApiResponse 
} from '../../../../../../core/api';
import {
  Warehouse,
  WarehouseListResponse,
  GetWarehousesParams,
  CreateWarehouseDto,
  UpdateWarehouseDto,
  ImportResult,
} from '../warehouse.types';

@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  private http = inject(HttpClient);
  
  // BehaviorSubject to manage warehouse list state
  private warehousesSubject = new BehaviorSubject<Warehouse[]>([]);
  public warehouses$ = this.warehousesSubject.asObservable();

  /**
   * Get warehouses list with pagination and filtering
   */
  getWarehouses(params: GetWarehousesParams): Observable<WarehouseListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('size', (params.limit || 100).toString());

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.scope) {
      httpParams = httpParams.set('scope', params.scope);
    }

    if (params.organizationId) {
      httpParams = httpParams.set('organizationId', params.organizationId);
    }

    return this.http
      .get<ApiPaginatedResponse<Warehouse> | WarehouseListResponse>(
        `${API_URI_INVENTORY}/v1/warehouses`,
        {
          params: httpParams,
        }
      )
      .pipe(
        map((response) => {
          // Check if response is the new API envelope format
          if (isApiResponse(response)) {
            const data = unwrap(response);
            // Store the items in the subject for list management
            this.warehousesSubject.next(data.items);
            return data;
          }
          // Legacy format - convert to ApiPaginatedData
          const legacyResponse = response as any;
          const data: WarehouseListResponse = {
            items: legacyResponse.data || [],
            page: legacyResponse.page || 1,
            limit: legacyResponse.limit || 100,
            total: legacyResponse.total || 0,
            totalPages: legacyResponse.totalPages || 0,
          };
          this.warehousesSubject.next(data.items);
          return data;
        })
      );
  }

  /**
   * Get a single warehouse by ID
   */
  getWarehouse(id: string): Observable<Warehouse | null> {
    return this.http
      .get<ApiSingleResponse<Warehouse> | Warehouse>(`${API_URI_INVENTORY}/v1/warehouses/${id}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            return data.item || null;
          }
          return response as Warehouse;
        })
      );
  }

  /**
   * Create a new warehouse
   */
  createWarehouse(dto: CreateWarehouseDto): Observable<Warehouse | null> {
    return this.http
      .post<ApiSingleResponse<Warehouse> | Warehouse>(`${API_URI_INVENTORY}/v1/warehouses`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            return data.item || null;
          }
          return response as Warehouse;
        })
      );
  }

  /**
   * Update an existing warehouse
   */
  updateWarehouse(id: string, dto: UpdateWarehouseDto): Observable<Warehouse | null> {
    return this.http
      .patch<ApiSingleResponse<Warehouse> | Warehouse>(
        `${API_URI_INVENTORY}/v1/warehouses/${id}`,
        dto
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            return data.item || null;
          }
          return response as Warehouse;
        })
      );
  }

  /**
   * Delete a warehouse
   */
  deleteWarehouse(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URI_INVENTORY}/v1/warehouses/${id}`);
  }

  /**
   * Delete multiple warehouses
   */
  deleteWarehouses(ids: string[]): Observable<void> {
    return this.http.post<void>(`${API_URI_INVENTORY}/v1/warehouses/bulk-delete`, { ids });
  }

  /**
   * Export warehouses to CSV
   */
  exportToCSV(params: GetWarehousesParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.scope) {
      httpParams = httpParams.set('scope', params.scope);
    }

    if (params.organizationId) {
      httpParams = httpParams.set('organizationId', params.organizationId);
    }

    return this.http.get(`${API_URI_INVENTORY}/v1/warehouses/export/csv`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  /**
   * Export warehouses to GeoJSON
   */
  exportToGeoJSON(params: GetWarehousesParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.scope) {
      httpParams = httpParams.set('scope', params.scope);
    }

    if (params.organizationId) {
      httpParams = httpParams.set('organizationId', params.organizationId);
    }

    return this.http.get(`${API_URI_INVENTORY}/v1/warehouses/export/geojson`, {
      params: httpParams,
      responseType: 'blob',
    });
  }

  /**
   * Import warehouses from file
   */
  importWarehouses(file: File): Observable<ImportResult | null> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiSingleResponse<ImportResult> | ImportResult>(
        `${API_URI_INVENTORY}/v1/warehouses/import`,
        formData
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            return data.item || null;
          }
          return response as ImportResult;
        })
      );
  }
}
