import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API_URI_COMMON } from '../../../../../../core/constant';
import { ApiPaginatedResponse, ApiResponse, unwrap, isApiResponse } from '../../../../../../core/api';
import {
  Province,
  ProvinceListResponse,
  GetProvincesParams,
  CreateProvinceDto,
  UpdateProvinceDto,
  ImportResult,
} from '../province.types';

@Injectable({
  providedIn: 'root',
})
export class ProvinceService {
  private http = inject(HttpClient);

  /**
   * Get provinces list with pagination and filtering
   */
  getProvinces(params: GetProvincesParams): Observable<ProvinceListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('size', (params.limit || 10).toString());

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.region) {
      httpParams = httpParams.set('region', params.region);
    }

    return this.http
      .get<ApiPaginatedResponse<Province> | ProvinceListResponse>(
        `${API_URI_COMMON}/v1/provinces`,
        {
          params: httpParams,
        }
      )
      .pipe(
        map((response) => {
          // Check if response is the new API envelope format
          if (isApiResponse(response)) {
            const data = unwrap(response as ApiPaginatedResponse<Province>);
            return {
              data: data.items,
              total: data.total,
              page: data.page,
              limit: data.limit,
              totalPages: data.totalPages,
            };
          }
          // Legacy format
          return response as ProvinceListResponse;
        })
      );
  }

  /**
   * Get a single province by ID
   */
  getProvince(id: string): Observable<Province> {
    return this.http
      .get<ApiResponse<Province> | Province>(`${API_URI_COMMON}/v1/provinces/${id}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response as ApiResponse<Province>);
          }
          return response as Province;
        })
      );
  }

  /**
   * Create a new province
   */
  createProvince(dto: CreateProvinceDto): Observable<Province> {
    return this.http
      .post<ApiResponse<Province> | Province>(`${API_URI_COMMON}/v1/provinces`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response as ApiResponse<Province>);
          }
          return response as Province;
        })
      );
  }

  /**
   * Update a province
   */
  updateProvince(id: string, dto: UpdateProvinceDto): Observable<Province> {
    return this.http
      .patch<ApiResponse<Province> | Province>(`${API_URI_COMMON}/v1/provinces/${id}`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response as ApiResponse<Province>);
          }
          return response as Province;
        })
      );
  }

  /**
   * Delete a province
   */
  deleteProvince(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URI_COMMON}/v1/provinces/${id}`);
  }

  /**
   * Export provinces to CSV
   */
  exportToCSV(params: GetProvincesParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.region) {
      httpParams = httpParams.set('region', params.region);
    }

    return this.http.post(
      `${API_URI_COMMON}/v1/provinces/export/csv`,
      {},
      {
        params: httpParams,
        responseType: 'blob',
      }
    );
  }

  /**
   * Export provinces to GeoJSON
   */
  exportToGeoJSON(params: GetProvincesParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.region) {
      httpParams = httpParams.set('region', params.region);
    }

    return this.http.post(
      `${API_URI_COMMON}/v1/provinces/export/geojson`,
      {},
      {
        params: httpParams,
        responseType: 'blob',
      }
    );
  }

  /**
   * Import provinces from file
   */
  importProvinces(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiResponse<ImportResult> | ImportResult>(
        `${API_URI_COMMON}/v1/provinces/import`,
        formData
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response as ApiResponse<ImportResult>);
          }
          return response as ImportResult;
        })
      );
  }
}
