import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_URI_USER } from '../constant';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'blocked';
  lastLogin?: string;
  createdAt: string;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  scope?: 'global' | 'organization';
  organizationId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);

  /**
   * Get users list with pagination and filtering
   * Calls the real backend API
   */
  getUsers(params: GetUsersParams): Observable<UserListResponse> {
    let httpParams = new HttpParams()
      .set('page', (params.page || 1).toString())
      .set('size', (params.limit || 10).toString());

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.scope === 'organization' && params.organizationId) {
      httpParams = httpParams.set('organizationId', params.organizationId);
    }

    return this.http
      .get<UserListResponse>(`${API_URI_USER}/v1/users`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * Bulk action: Block selected users
   */
  blockUsers(userIds: string[]): Observable<void> {
    return this.http
      .post<void>(`${API_URI_USER}/v1/users/block`, { userIds })
      .pipe(catchError(this.handleError));
  }

  /**
   * Bulk action: Revoke login sessions for selected users
   */
  revokeLoginSessions(userIds: string[]): Observable<void> {
    return this.http
      .post<void>(`${API_URI_USER}/v1/users/revoke-sessions`, { userIds })
      .pipe(catchError(this.handleError));
  }

  /**
   * Export users to CSV
   */
  exportToCSV(params: GetUsersParams): Observable<Blob> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('q', params.search);
    }

    if (params.scope === 'organization' && params.organizationId) {
      httpParams = httpParams.set('organizationId', params.organizationId);
    }

    return this.http
      .post(`${API_URI_USER}/v1/users/export`, params, {
        params: httpParams,
        responseType: 'blob',
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized. Please login again.';
          break;
        case 403:
          errorMessage = 'Forbidden. You do not have permission to perform this action.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = `Server error: ${error.status} - ${error.message}`;
      }
    }

    console.error('UserService error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
