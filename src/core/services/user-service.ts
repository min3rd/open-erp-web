import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { API_URI_ORGANIZATION } from '../constant';

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
   * For now, this returns mock data. Replace with actual API call when backend is ready.
   */
  getUsers(params: GetUsersParams): Observable<UserListResponse> {
    // Mock data for development
    const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
      id: `user-${i + 1}`,
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      fullName: `User ${i + 1} Full Name`,
      phone: `+84${String(900000000 + i)}`,
      avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
      status: i % 5 === 0 ? 'inactive' : i % 7 === 0 ? 'blocked' : 'active',
      lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // Apply search filter
    let filtered = mockUsers;
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = mockUsers.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower) ||
          user.phone?.toLowerCase().includes(searchLower) ||
          user.username.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filtered.slice(startIndex, endIndex);

    const response: UserListResponse = {
      data: paginatedUsers,
      total: filtered.length,
      page,
      limit,
    };

    // Simulate network delay
    return of(response).pipe(delay(300));

    // When backend is ready, use this instead:
    // let httpParams = new HttpParams()
    //   .set('page', (params.page || 1).toString())
    //   .set('limit', (params.limit || 10).toString());
    //
    // if (params.search) {
    //   httpParams = httpParams.set('search', params.search);
    // }
    //
    // if (params.scope === 'organization' && params.organizationId) {
    //   httpParams = httpParams.set('organizationId', params.organizationId);
    // }
    //
    // const endpoint = params.scope === 'organization'
    //   ? `${API_URI_ORGANIZATION}/organizations/${params.organizationId}/members`
    //   : `${API_URI_ORGANIZATION}/users`;
    //
    // return this.http.get<UserListResponse>(endpoint, { params: httpParams });
  }

  /**
   * Bulk action: Block selected users
   */
  blockUsers(userIds: string[]): Observable<void> {
    // Mock implementation
    return of(void 0).pipe(delay(500));
    // return this.http.post<void>(`${API_URI_ORGANIZATION}/users/bulk/block`, { userIds });
  }

  /**
   * Bulk action: Revoke login sessions for selected users
   */
  revokeLoginSessions(userIds: string[]): Observable<void> {
    // Mock implementation
    return of(void 0).pipe(delay(500));
    // return this.http.post<void>(`${API_URI_ORGANIZATION}/users/bulk/revoke-sessions`, { userIds });
  }

  /**
   * Export users to CSV
   */
  exportToCSV(params: GetUsersParams): Observable<Blob> {
    // Mock implementation
    const csvContent = 'ID,Username,Email,Full Name,Phone,Status\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    return of(blob).pipe(delay(500));
    // return this.http.post(`${API_URI_ORGANIZATION}/users/export`, params, {
    //   responseType: 'blob',
    // });
  }
}
