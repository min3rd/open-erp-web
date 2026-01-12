import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { API_URI_COMMON } from '../../../../../../core/constant';
import { 
  ApiPaginatedResponse, 
  ApiResponse, 
  ApiSingleResponse,
  unwrap, 
  isApiResponse 
} from '../../../../../../core/api';
import {
  Province,
  District,
  Ward,
  AdministrativeEntity,
  ProvinceListResponse,
  AdministrativeEntityListResponse,
  GetProvincesParams,
  GetDistrictsParams,
  GetWardsParams,
  GetAdministrativeEntitiesParams,
  CreateProvinceDto,
  CreateDistrictDto,
  CreateWardDto,
  UpdateProvinceDto,
  UpdateDistrictDto,
  UpdateWardDto,
  ImportResult,
  AdministrativeTreeNode,
} from '../province.types';
import { mapToTreeNodes } from '../utils/tree-mapper';

@Injectable({
  providedIn: 'root',
})
export class ProvinceService {
  private http = inject(HttpClient);
  
  // BehaviorSubject to manage province list state
  private provincesSubject = new BehaviorSubject<Province[]>([]);
  public provinces$ = this.provincesSubject.asObservable();

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
            // Store the items in the subject for list management
            this.provincesSubject.next(data.items);
            return data;
          }
          // Legacy format - convert to ApiPaginatedData
          const legacyResponse = response as any;
          const data: ProvinceListResponse = {
            items: legacyResponse.data || [],
            page: legacyResponse.page || 1,
            limit: legacyResponse.limit || 10,
            total: legacyResponse.total || 0,
            totalPages: legacyResponse.totalPages || 0,
          };
          this.provincesSubject.next(data.items);
          return data;
        })
      );
  }

  /**
   * Get a single province by ID
   */
  getProvince(id: string): Observable<Province> {
    return this.http
      .get<ApiSingleResponse<Province> | Province>(`${API_URI_COMMON}/v1/provinces/${id}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<Province>;
            const data = unwrap(singleResponse);
            return data.item!;
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
      .post<ApiSingleResponse<Province> | Province>(`${API_URI_COMMON}/v1/provinces`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<Province>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as Province;
        }),
        tap((province) => {
          // Add the new province to the list
          const currentList = this.provincesSubject.value;
          this.provincesSubject.next([province, ...currentList]);
        })
      );
  }

  /**
   * Update a province
   */
  updateProvince(id: string, dto: UpdateProvinceDto): Observable<Province> {
    return this.http
      .patch<ApiSingleResponse<Province> | Province>(`${API_URI_COMMON}/v1/provinces/${id}`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<Province>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as Province;
        }),
        tap((province) => {
          // Update the province in the list
          const currentList = this.provincesSubject.value;
          const updatedList = currentList.map(p => p.id === province.id ? province : p);
          this.provincesSubject.next(updatedList);
        })
      );
  }

  /**
   * Delete a province
   */
  deleteProvince(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URI_COMMON}/v1/provinces/${id}`).pipe(
      tap(() => {
        // Remove the province from the list
        const currentList = this.provincesSubject.value;
        const updatedList = currentList.filter(p => p.id !== id);
        this.provincesSubject.next(updatedList);
      })
    );
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

  // ========================
  // District Operations
  // ========================

  /**
   * Get districts list with filtering
   */
  getDistricts(params: GetDistrictsParams): Observable<AdministrativeEntityListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('size', (params.limit || 10).toString());

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.provinceCode) {
      httpParams = httpParams.set('provinceCode', params.provinceCode);
    }

    if (params.parentCode) {
      httpParams = httpParams.set('parentCode', params.parentCode);
    }

    return this.http
      .get<ApiPaginatedResponse<District> | AdministrativeEntityListResponse>(
        `${API_URI_COMMON}/v1/districts`,
        {
          params: httpParams,
        }
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response as ApiPaginatedResponse<District>);
          }
          const legacyResponse = response as any;
          return {
            items: legacyResponse.data || [],
            page: legacyResponse.page || 1,
            limit: legacyResponse.limit || 10,
            total: legacyResponse.total || 0,
            totalPages: legacyResponse.totalPages || 0,
          };
        })
      );
  }

  /**
   * Get a single district by ID
   */
  getDistrict(id: string): Observable<District> {
    return this.http
      .get<ApiSingleResponse<District> | District>(`${API_URI_COMMON}/v1/districts/${id}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<District>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as District;
        })
      );
  }

  /**
   * Create a new district
   */
  createDistrict(dto: CreateDistrictDto): Observable<District> {
    return this.http
      .post<ApiSingleResponse<District> | District>(`${API_URI_COMMON}/v1/districts`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<District>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as District;
        })
      );
  }

  /**
   * Update a district
   */
  updateDistrict(id: string, dto: UpdateDistrictDto): Observable<District> {
    return this.http
      .patch<ApiSingleResponse<District> | District>(
        `${API_URI_COMMON}/v1/districts/${id}`,
        dto
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<District>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as District;
        })
      );
  }

  /**
   * Delete a district
   */
  deleteDistrict(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URI_COMMON}/v1/districts/${id}`);
  }

  // ========================
  // Ward Operations
  // ========================

  /**
   * Get wards list with filtering
   */
  getWards(params: GetWardsParams): Observable<AdministrativeEntityListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('size', (params.limit || 10).toString());

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.districtCode) {
      httpParams = httpParams.set('districtCode', params.districtCode);
    }

    if (params.parentCode) {
      httpParams = httpParams.set('parentCode', params.parentCode);
    }

    return this.http
      .get<ApiPaginatedResponse<Ward> | AdministrativeEntityListResponse>(
        `${API_URI_COMMON}/v1/wards`,
        {
          params: httpParams,
        }
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response as ApiPaginatedResponse<Ward>);
          }
          const legacyResponse = response as any;
          return {
            items: legacyResponse.data || [],
            page: legacyResponse.page || 1,
            limit: legacyResponse.limit || 10,
            total: legacyResponse.total || 0,
            totalPages: legacyResponse.totalPages || 0,
          };
        })
      );
  }

  /**
   * Get a single ward by ID
   */
  getWard(id: string): Observable<Ward> {
    return this.http
      .get<ApiSingleResponse<Ward> | Ward>(`${API_URI_COMMON}/v1/wards/${id}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<Ward>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as Ward;
        })
      );
  }

  /**
   * Create a new ward
   */
  createWard(dto: CreateWardDto): Observable<Ward> {
    return this.http
      .post<ApiSingleResponse<Ward> | Ward>(`${API_URI_COMMON}/v1/wards`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<Ward>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as Ward;
        })
      );
  }

  /**
   * Update a ward
   */
  updateWard(id: string, dto: UpdateWardDto): Observable<Ward> {
    return this.http
      .patch<ApiSingleResponse<Ward> | Ward>(`${API_URI_COMMON}/v1/wards/${id}`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<Ward>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as Ward;
        })
      );
  }

  /**
   * Delete a ward
   */
  deleteWard(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URI_COMMON}/v1/wards/${id}`);
  }

  // ========================
  // Tree Operations
  // ========================

  /**
   * Get administrative entities in tree or flat format
   */
  getAdministrativeEntities(
    params: GetAdministrativeEntitiesParams
  ): Observable<AdministrativeEntityListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('size', (params.limit || 10).toString());

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.region) {
      httpParams = httpParams.set('region', params.region);
    }

    if (params.scope) {
      httpParams = httpParams.set('scope', params.scope);
    }

    if (params.parentCode) {
      httpParams = httpParams.set('parentCode', params.parentCode);
    }

    if (params.format) {
      httpParams = httpParams.set('format', params.format);
    }

    if (params.lazy !== undefined) {
      httpParams = httpParams.set('lazy', params.lazy.toString());
    }

    return this.http
      .get<ApiPaginatedResponse<AdministrativeEntity> | AdministrativeEntityListResponse>(
        `${API_URI_COMMON}/v1/administrative-entities`,
        {
          params: httpParams,
        }
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response as ApiPaginatedResponse<AdministrativeEntity>);
          }
          const legacyResponse = response as any;
          return {
            items: legacyResponse.data || [],
            page: legacyResponse.page || 1,
            limit: legacyResponse.limit || 10,
            total: legacyResponse.total || 0,
            totalPages: legacyResponse.totalPages || 0,
          };
        })
      );
  }

  /**
   * Get children of a specific administrative entity (for lazy loading)
   */
  getChildren(parentCode: string): Observable<AdministrativeTreeNode[]> {
    return this.http
      .get<ApiPaginatedResponse<AdministrativeEntity> | AdministrativeEntityListResponse>(
        `${API_URI_COMMON}/v1/administrative-entities`,
        {
          params: new HttpParams().set('parentCode', parentCode).set('size', '1000'),
        }
      )
      .pipe(
        map((response) => {
          let items: AdministrativeEntity[];
          if (isApiResponse(response)) {
            const data = unwrap(response as ApiPaginatedResponse<AdministrativeEntity>);
            items = data.items;
          } else {
            const legacyResponse = response as any;
            items = legacyResponse.data || [];
          }
          return mapToTreeNodes(items);
        })
      );
  }
}
