import { TestBed } from '@angular/core/testing';
import { UserService, GetUsersParams } from './user-service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return users with pagination', async () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
    };

    const response = await new Promise((resolve) => {
      service.getUsers(params).subscribe((res) => resolve(res));
    });

    expect(response).toBeTruthy();
    expect((response as any).data).toBeTruthy();
    expect((response as any).data.length).toBeLessThanOrEqual(10);
    expect((response as any).page).toBe(1);
    expect((response as any).limit).toBe(10);
    expect((response as any).total).toBeGreaterThan(0);
  });

  it('should filter users by search query', async () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      search: 'user1',
    };

    const response = await new Promise((resolve) => {
      service.getUsers(params).subscribe((res) => resolve(res));
    });

    expect(response).toBeTruthy();
    expect((response as any).data.length).toBeGreaterThan(0);

    // At least one user should match the search
    const hasMatch = (response as any).data.some(
      (user: any) =>
        user.fullName.toLowerCase().includes('user1') ||
        user.email.toLowerCase().includes('user1') ||
        user.username.toLowerCase().includes('user1')
    );
    expect(hasMatch).toBe(true);
  });

  it('should return empty results when no users match search', async () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
      search: 'nonexistentuser12345',
    };

    const response = await new Promise((resolve) => {
      service.getUsers(params).subscribe((res) => resolve(res));
    });

    expect(response).toBeTruthy();
    expect((response as any).data.length).toBe(0);
    expect((response as any).total).toBe(0);
  });

  it('should handle different page sizes', async () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 25,
    };

    const response = await new Promise((resolve) => {
      service.getUsers(params).subscribe((res) => resolve(res));
    });

    expect(response).toBeTruthy();
    expect((response as any).data.length).toBeLessThanOrEqual(25);
    expect((response as any).limit).toBe(25);
  });

  it('should handle pagination correctly', async () => {
    const page1Params: GetUsersParams = {
      page: 1,
      limit: 10,
    };

    const page1Response = await new Promise((resolve) => {
      service.getUsers(page1Params).subscribe((res) => resolve(res));
    });

    const page2Params: GetUsersParams = {
      page: 2,
      limit: 10,
    };

    const page2Response = await new Promise((resolve) => {
      service.getUsers(page2Params).subscribe((res) => resolve(res));
    });

    expect((page2Response as any).page).toBe(2);
    expect((page2Response as any).limit).toBe(10);

    // Ensure different data on different pages (if there are enough users)
    if ((page1Response as any).total > 10) {
      expect((page1Response as any).data[0].id).not.toBe((page2Response as any).data[0]?.id);
    }
  });

  it('should block users', async () => {
    const userIds = ['user-1', 'user-2'];

    const result = await new Promise((resolve) => {
      service.blockUsers(userIds).subscribe((res) => resolve(res));
    });

    expect(result).toBeUndefined();
  });

  it('should revoke login sessions', async () => {
    const userIds = ['user-1', 'user-2'];

    const result = await new Promise((resolve) => {
      service.revokeLoginSessions(userIds).subscribe((res) => resolve(res));
    });

    expect(result).toBeUndefined();
  });

  it('should export to CSV', async () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 10,
    };

    const blob = await new Promise((resolve) => {
      service.exportToCSV(params).subscribe((res) => resolve(res));
    });

    expect(blob).toBeTruthy();
    expect(blob instanceof Blob).toBe(true);
    expect((blob as Blob).type).toBe('text/csv');
  });

  it('should return users with correct structure', async () => {
    const params: GetUsersParams = {
      page: 1,
      limit: 5,
    };

    const response = await new Promise((resolve) => {
      service.getUsers(params).subscribe((res) => resolve(res));
    });

    expect((response as any).data).toBeTruthy();

    if ((response as any).data.length > 0) {
      const user = (response as any).data[0];
      expect(user.id).toBeTruthy();
      expect(user.username).toBeTruthy();
      expect(user.email).toBeTruthy();
      expect(user.fullName).toBeTruthy();
      expect(user.status).toBeTruthy();
      expect(['active', 'inactive', 'blocked']).toContain(user.status);
      expect(user.createdAt).toBeTruthy();
    }
  });
});
