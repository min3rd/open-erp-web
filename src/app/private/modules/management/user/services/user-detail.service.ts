import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_URI_USER } from '../../../../../../core/constant';
import {
  ApiResponse,
  ApiSingleResponse,
  unwrap,
  isApiResponse,
  ApiResponseError,
} from '../../../../../../core/api';
import { User } from '../../../../../../core/services/user-service';

/**
 * Extended user detail interface with additional fields
 */
export interface UserDetail extends User {
  roles?: string[];
  permissions?: string[];
  memberships?: UserMembership[];
  metadata?: Record<string, any>;
  updatedAt?: string;
}

/**
 * User membership/tenant information
 */
export interface UserMembership {
  id: string;
  organizationId: string;
  organizationName: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
}

/**
 * User activity log entry
 */
export interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * User activity logs response
 */
export interface UserActivityLogsResponse {
  data: UserActivityLog[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Service for user detail operations
 * Handles fetching and managing user detail data
 */
@Injectable({
  providedIn: 'root',
})
export class UserDetailService {
  private http = inject(HttpClient);

  // Observable to notify subscribers of user updates
  private userUpdatedSubject = new BehaviorSubject<UserDetail | null>(null);
  public userUpdated$ = this.userUpdatedSubject.asObservable();

  /**
   * Get user detail by ID
   */
  getUserDetail(userId: string): Observable<UserDetail> {
    return this.http
      .get<ApiSingleResponse<UserDetail>>(`${API_URI_USER}/v1/users/${userId}`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const data = unwrap(response);
            return data.item as UserDetail;
          }
          // Legacy format fallback
          return response as unknown as UserDetail;
        }),
        tap((user) => {
          // Emit user update to subscribers
          this.userUpdatedSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get user memberships/tenants
   */
  getUserMemberships(userId: string): Observable<UserMembership[]> {
    return this.http
      .get<ApiResponse<UserMembership[]>>(`${API_URI_USER}/v1/users/${userId}/memberships`)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as unknown as UserMembership[];
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get user activity logs
   */
  getUserActivityLogs(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Observable<UserActivityLogsResponse> {
    const params = new HttpParams().set('page', page.toString()).set('limit', limit.toString());

    return this.http
      .get<ApiResponse<UserActivityLogsResponse>>(
        `${API_URI_USER}/v1/users/${userId}/activity-logs`,
        { params }
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as unknown as UserActivityLogsResponse;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update user
   */
  updateUser(userId: string, data: Partial<UserDetail>): Observable<UserDetail> {
    return this.http
      .patch<ApiSingleResponse<UserDetail>>(`${API_URI_USER}/v1/users/${userId}`, data)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            const result = unwrap(response);
            return result.item as UserDetail;
          }
          return response as unknown as UserDetail;
        }),
        tap((user) => {
          // Emit user update to subscribers
          this.userUpdatedSubject.next(user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Disable/block a user
   */
  disableUser(userId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${API_URI_USER}/v1/users/${userId}/disable`, {})
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            unwrap(response);
            return;
          }
          return response as void;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Enable a user
   */
  enableUser(userId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${API_URI_USER}/v1/users/${userId}/enable`, {})
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            unwrap(response);
            return;
          }
          return response as void;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Reset user password
   */
  resetPassword(userId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${API_URI_USER}/v1/users/${userId}/reset-password`, {})
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            unwrap(response);
            return;
          }
          return response as void;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Send user invitation
   */
  sendInvitation(userId: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${API_URI_USER}/v1/users/${userId}/send-invitation`, {})
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            unwrap(response);
            return;
          }
          return response as void;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Impersonate user (if allowed)
   */
  impersonateUser(userId: string): Observable<{ token: string }> {
    return this.http
      .post<ApiResponse<{ token: string }>>(
        `${API_URI_USER}/v1/users/${userId}/impersonate`,
        {}
      )
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as unknown as { token: string };
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Admin: Reset user password
   */
  adminResetPassword(
    identifier: string,
    data: {
      password?: string;
      forceResetOnNextLogin?: boolean;
      sendEmail?: boolean;
      revokeSessions?: boolean;
      reason?: string;
    }
  ): Observable<{
    success: boolean;
    userId: string;
    generatedPassword?: string;
    emailSent: boolean;
    sessionsRevoked: boolean;
    tokenVersion: number;
  }> {
    return this.http
      .post<
        ApiResponse<{
          success: boolean;
          userId: string;
          generatedPassword?: string;
          emailSent: boolean;
          sessionsRevoked: boolean;
          tokenVersion: number;
        }>
      >(`${API_URI_USER}/v1/admin/users/${identifier}/reset-password`, data)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as any;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Admin: Revoke user sessions
   */
  adminRevokeSessions(
    identifier: string,
    data: {
      revokeRefreshTokens?: boolean;
      revokeAllDevices?: boolean;
      reason?: string;
    }
  ): Observable<{
    success: boolean;
    userId: string;
    tokensRevoked: number;
    tokenVersion: number;
  }> {
    return this.http
      .post<
        ApiResponse<{
          success: boolean;
          userId: string;
          tokensRevoked: number;
          tokenVersion: number;
        }>
      >(`${API_URI_USER}/v1/admin/users/${identifier}/revoke-sessions`, data)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as any;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Admin: Block user
   */
  adminBlockUser(
    identifier: string,
    data: {
      reason: string;
      softBlock?: boolean;
      revokeSessions?: boolean;
      sendEmail?: boolean;
    }
  ): Observable<{
    success: boolean;
    userId: string;
    blockedAt: Date;
    reason: string;
    emailSent: boolean;
    sessionsRevoked: boolean;
  }> {
    return this.http
      .post<
        ApiResponse<{
          success: boolean;
          userId: string;
          blockedAt: Date;
          reason: string;
          emailSent: boolean;
          sessionsRevoked: boolean;
        }>
      >(`${API_URI_USER}/v1/admin/users/${identifier}/block`, data)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as any;
        }),
        tap(() => {
          // Reload user to update status
          const user = this.userUpdatedSubject.value;
          if (user && (user.id === identifier || user.username === identifier || user.email === identifier)) {
            this.getUserDetail(user.id).subscribe();
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Admin: Unblock user
   */
  adminUnblockUser(
    identifier: string,
    data: {
      reason?: string;
      sendEmail?: boolean;
    }
  ): Observable<{
    success: boolean;
    userId: string;
    emailSent: boolean;
  }> {
    return this.http
      .post<
        ApiResponse<{
          success: boolean;
          userId: string;
          emailSent: boolean;
        }>
      >(`${API_URI_USER}/v1/admin/users/${identifier}/unblock`, data)
      .pipe(
        map((response) => {
          if (isApiResponse(response)) {
            return unwrap(response);
          }
          return response as any;
        }),
        tap(() => {
          // Reload user to update status
          const user = this.userUpdatedSubject.value;
          if (user && (user.id === identifier || user.username === identifier || user.email === identifier)) {
            this.getUserDetail(user.id).subscribe();
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse | ApiResponseError): Observable<never> {
    let errorMessage = 'An error occurred';

    // Handle ApiResponseError from unwrap
    if (error instanceof ApiResponseError) {
      errorMessage = error.message;
      console.error('UserDetailService API error:', errorMessage, error);
      return throwError(() => error);
    }

    // Handle HTTP errors
    if (error instanceof HttpErrorResponse) {
      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network error: ${error.error.message}`;
      } else {
        // Check if error response has API envelope
        if (isApiResponse(error.error)) {
          try {
            unwrap(error.error);
          } catch (apiError) {
            if (apiError instanceof ApiResponseError) {
              return throwError(() => apiError);
            }
          }
        }

        // Backend returned an unsuccessful response code
        switch (error.status) {
          case 401:
            errorMessage = 'Unauthorized. Please login again.';
            break;
          case 403:
            errorMessage = 'Forbidden. You do not have permission to perform this action.';
            break;
          case 404:
            errorMessage = 'User not found.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            errorMessage = `Server error: ${error.status} - ${error.message}`;
        }
      }
    }

    console.error('UserDetailService error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
