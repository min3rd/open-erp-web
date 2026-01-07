import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { API_URI_AUTH } from '../constant';

export interface VietQRBusinessResponse {
  code: string;
  desc: string;
  data: {
    id: string;
    name: string;
    internationalName: string;
    shortName: string;
    address: string;
    status: string;
  };
}

export interface CreateOrganizationDto {
  taxId: string;
  name: string;
  internationalName: string;
  headquartersAddress: string;
  legalRepresentative: string;
  contactPhone: string;
  contactEmail: string;
  foundedDate: string;
  businessActivities?: string[];
}

export interface OrganizationResponse {
  id: string;
  taxId: string;
  name: string;
  internationalName: string;
  headquartersAddress: string;
  legalRepresentative: string;
  contactPhone: string;
  contactEmail: string;
  foundedDate: string;
  businessActivities?: string[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  private httpClient = inject(HttpClient);
  private readonly VIETQR_API_URL = 'https://api.vietqr.io/v2/business';

  /**
   * Look up business information by tax ID using VietQR API
   */
  lookupBusinessByTaxId(taxId: string): Observable<VietQRBusinessResponse | null> {
    return this.httpClient.get<VietQRBusinessResponse>(`${this.VIETQR_API_URL}/${taxId}`).pipe(
      map((response) => {
        if (response.code === '00') {
          return response;
        }
        return null;
      }),
      catchError((error) => {
        console.error('VietQR API error:', error);
        return of(null);
      })
    );
  }

  /**
   * Create a new organization
   */
  createOrganization(
    dto: CreateOrganizationDto,
    version: string = 'v1'
  ): Observable<OrganizationResponse> {
    return this.httpClient.post<OrganizationResponse>(
      `${API_URI_AUTH}/${version}/organizations`,
      dto
    );
  }
}
