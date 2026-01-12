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
  District,
  DistrictListResponse,
  GetDistrictsParams,
  CreateDistrictDto,
  UpdateDistrictDto,
  ImportResult,
} from '../district.types';

@Injectable({
  providedIn: 'root',
})
export class DistrictService {
  private http = inject(HttpClient);
  
  // BehaviorSubject to manage district list state
  private districtsSubject = new BehaviorSubject<District[]>([]);
  public districts$ = this.districtsSubject.asObservable();

  /**
   * Get districts list with pagination and filtering
   */
  getDistricts(params: GetDistrictsParams): Observable<DistrictListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('size', (params.limit || 10).toString());

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.provinceId) {
      httpParams = httpParams.set('provinceId', params.provinceId);
    }

    return this.http
      .get<ApiPaginatedResponse<District> | DistrictListResponse>(
        `${API_URI_COMMON}/v1/districts`,
        {
          params: httpParams,
        }
      )
      .pipe(
        map((response) => {
          // Check if response is the new API envelope format
          if (isApiResponse(response)) {
            const data = unwrap(response as ApiPaginatedResponse<District>);
            // Store the items in the subject for list management
            this.districtsSubject.next(data.items);
            return data;
          }
          // Legacy format - convert to ApiPaginatedData
          const legacyResponse = response as any;
          const data: DistrictListResponse = {
            items: legacyResponse.data || [],
            page: legacyResponse.page || 1,
            limit: legacyResponse.limit || 10,
            total: legacyResponse.total || 0,
            totalPages: legacyResponse.totalPages || 0,
          };
          this.districtsSubject.next(data.items);
          return data;
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
        }),
        tap((district) => {
          // Add the new district to the list
          const currentList = this.districtsSubject.value;
          this.districtsSubject.next([district, ...currentList]);
        })
      );
  }

  /**
   * Update a district
   */
  updateDistrict(id: string, dto: UpdateDistrictDto): Observable<District> {
    return this.http
      .patch<ApiSingleResponse<District> | District>(`${API_URI_COMMON}/v1/districts/${id}`, dto)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const singleResponse = response as ApiSingleResponse<District>;
            const data = unwrap(singleResponse);
            return data.item!;
          }
          return response as District;
        }),
        tap((district) => {
          // Update the district in the list
          const currentList = this.districtsSubject.value;
          const updatedList = currentList.map(d => d.id === district.id ? district : d);
          this.districtsSubject.next(updatedList);
        })
      );
  }

  /**
   * Delete a district
   */
  deleteDistrict(id: string): Observable<void> {
    return this.http.delete<void>(`${API_URI_COMMON}/v1/districts/${id}`).pipe(
      tap(() => {
        // Remove the district from the list
        const currentList = this.districtsSubject.value;
        const updatedList = currentList.filter(d => d.id !== id);
        this.districtsSubject.next(updatedList);
      })
    );
  }

  /**
   * Export districts to CSV
   */
  exportToCSV(params: GetDistrictsParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.provinceId) {
      httpParams = httpParams.set('provinceId', params.provinceId);
    }

    return this.http.post(
      `${API_URI_COMMON}/v1/districts/export/csv`,
      {},
      {
        params: httpParams,
        responseType: 'blob',
      }
    );
  }

  /**
   * Export districts to GeoJSON
   */
  exportToGeoJSON(params: GetDistrictsParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.provinceId) {
      httpParams = httpParams.set('provinceId', params.provinceId);
    }

    return this.http.post(
      `${API_URI_COMMON}/v1/districts/export/geojson`,
      {},
      {
        params: httpParams,
        responseType: 'blob',
      }
    );
  }

  /**
   * Import districts from file
   */
  importDistricts(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<ApiResponse<ImportResult> | ImportResult>(
        `${API_URI_COMMON}/v1/districts/import`,
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
