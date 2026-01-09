import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NavigationService } from './navigation-service';
import { API_URI_CONFIG } from '../constant';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from './auth-service';
import { of } from 'rxjs';

class AuthServiceStub {
  user$ = of({ permissions: ['nav:view'] });
}

describe('NavigationService', () => {
  let service: NavigationService;
  let httpMock: HttpTestingController;
  const baseUrl = `${API_URI_CONFIG}/v1/navigations`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    });

    service = TestBed.inject(NavigationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should load global navigation with scope and format params', () => {
    const mockResponse = {
      success: true,
      data: [
        { id: 'dash', label: 'navigation.dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
      ],
    };

    service.loadModules().subscribe((items) => {
      expect(items.length).toBe(1);
      expect(items[0].id).toBe('navigation-global-dash');
      expect(items[0].routerLink).toEqual(['/dashboard']);
    });

    const req = httpMock.expectOne((request) => request.url === baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('scope')).toBe('global');
    expect(req.request.params.get('format')).toBe('tree');
    req.flush(mockResponse);
  });

  it('should build tree from flat navigation items and filter by permissions', () => {
    const mockResponse = {
      success: true,
      data: [
        { id: 'parent', label: 'navigation.management', routerLink: '/modules/management' },
        {
          id: 'child',
          label: 'navigation.organization',
          routerLink: '/modules/management/org',
          parentId: 'parent',
          permissions: { exclude: ['nav:view'] },
        },
      ],
    };

    service.loadModules('v1', 'flat').subscribe((items) => {
      expect(items.length).toBe(2);
      expect(items[0].items?.length).toBe(0);
      expect(items[0].routerLink).toEqual(['/modules/management']);
    });

    const req = httpMock.expectOne((request) => request.url === baseUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('format')).toBe('flat');
    expect(req.request.params.get('scope')).toBe('global');
    req.flush(mockResponse);
  });
});
