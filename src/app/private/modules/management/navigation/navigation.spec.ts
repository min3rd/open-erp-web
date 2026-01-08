import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Navigation } from './navigation';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NavigationManagementService } from './services/navigation-management.service';
import { MessageService } from 'primeng/api';
import { API_URI_CONFIG } from '../../../../../core/constant';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Navigation', () => {
  let component: Navigation;
  let fixture: ComponentFixture<Navigation>;
  let httpMock: HttpTestingController;
  const baseUrl = `${API_URI_CONFIG}/v1/navigations`;

  const mockGlobalNavigationItems = [
    {
      id: 'nav-1',
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard',
      scope: 'global' as const,
      order: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'nav-2',
      label: 'Users',
      icon: 'pi pi-users',
      routerLink: '/users',
      scope: 'global' as const,
      moduleKey: 'user-management',
      order: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Navigation,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        NavigationManagementService,
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navigation);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: [], total: 0 });
    expect(component).toBeTruthy();
  });

  it('should load global navigation on init', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    expect(component['globalNavigationItems']().length).toBe(2);
    expect(component['globalNavigationItems']()[0].label).toBe('Dashboard');
  });

  it('should have required DOM elements with unique IDs', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#navigation-management-container')).toBeTruthy();
    expect(compiled.querySelector('#navigation-management-toolbar')).toBeTruthy();
    expect(compiled.querySelector('#navigation-management-add-button')).toBeTruthy();
    expect(compiled.querySelector('#navigation-management-refresh-button')).toBeTruthy();
    expect(compiled.querySelector('#navigation-management-edit-button')).toBeTruthy();
    expect(compiled.querySelector('#navigation-management-delete-button')).toBeTruthy();
    expect(compiled.querySelector('#navigation-management-content')).toBeTruthy();
    expect(compiled.querySelector('#navigation-management-status')).toBeTruthy();
  });

  it('should show loading state', () => {
    component['isLoading'].set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusRegion = compiled.querySelector('#navigation-management-status');
    expect(statusRegion?.textContent).toContain('Loading');

    // Complete the request
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: [], total: 0 });
  });

  it('should display desktop two-pane layout', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['isMobile'].set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#navigation-management-global-pane')).toBeTruthy();
    expect(compiled.querySelector('#navigation-management-module-pane')).toBeTruthy();
    expect(compiled.querySelector('#navigation-management-global-tree')).toBeTruthy();
  });

  it('should display mobile single-column layout with tabs', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['isMobile'].set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#navigation-management-tab-selector')).toBeTruthy();
    expect(compiled.querySelector('#navigation-management-global-tree-mobile')).toBeTruthy();
  });

  it('should convert navigation items to tree nodes', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    expect(component['globalTreeNodes']().length).toBe(2);
    expect(component['globalTreeNodes']()[0].label).toBe('Dashboard');
    expect(component['globalTreeNodes']()[0].data.id).toBe('nav-1');
  });

  it('should handle node selection', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    const mockEvent = {
      node: {
        key: 'nav-1',
        label: 'Dashboard',
        data: mockGlobalNavigationItems[0],
      },
    };

    component['onNodeSelect'](mockEvent);

    expect(component['selectedItem']()).toEqual(mockGlobalNavigationItems[0]);
    expect(component['selectedTreeNode']()).toEqual(mockEvent.node);
  });

  it('should load module navigation when module item is selected', () => {
    const req1 = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req1.flush({ data: mockGlobalNavigationItems, total: 2 });

    const moduleItem = mockGlobalNavigationItems[1];
    const mockEvent = {
      node: {
        key: moduleItem.id,
        label: moduleItem.label,
        data: moduleItem,
      },
    };

    component['activeTab'].set('global');
    component['onNodeSelect'](mockEvent);

    const req2 = httpMock.expectOne(
      `${baseUrl}/module/${moduleItem.moduleKey}?includeHidden=true`
    );
    expect(req2.request.method).toBe('GET');
    req2.flush({ data: [], total: 0 });

    expect(component['selectedModule']()).toEqual(moduleItem);
  });

  it('should open editor in create mode', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['onAddItem']();

    expect(component['isEditorOpen']()).toBe(true);
    expect(component['editorMode']()).toBe('create');
    expect(component['selectedItem']()).toBeNull();
  });

  it('should open editor in edit mode when item is selected', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['selectedItem'].set(mockGlobalNavigationItems[0]);
    component['onEditItem']();

    expect(component['isEditorOpen']()).toBe(true);
    expect(component['editorMode']()).toBe('edit');
  });

  it('should not open editor in edit mode when no item is selected', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['selectedItem'].set(null);
    component['isEditorOpen'].set(false);
    component['onEditItem']();

    expect(component['isEditorOpen']()).toBe(false);
  });

  it('should delete navigation item', () => {
    const req1 = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req1.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['selectedItem'].set(mockGlobalNavigationItems[0]);

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    component['onDeleteItem']();

    const req2 = httpMock.expectOne(`${baseUrl}/nav-1`);
    expect(req2.request.method).toBe('DELETE');
    req2.flush(null);

    // Expect reload
    const req3 = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req3.flush({ data: [], total: 0 });

    expect(component['selectedItem']()).toBeNull();
  });

  it('should not delete when user cancels confirmation', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['selectedItem'].set(mockGlobalNavigationItems[0]);

    // Mock window.confirm to return false
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component['onDeleteItem']();

    // No DELETE request should be made
    httpMock.expectNone(`${baseUrl}/nav-1`);
  });

  it('should refresh current navigation', () => {
    const req1 = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req1.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['activeTab'].set('global');
    component['onRefresh']();

    const req2 = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    expect(req2.request.method).toBe('GET');
    req2.flush({ data: mockGlobalNavigationItems, total: 2 });
  });

  it('should close editor', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['isEditorOpen'].set(true);
    component['selectedItem'].set(mockGlobalNavigationItems[0]);

    component['onCloseEditor']();

    expect(component['isEditorOpen']()).toBe(false);
    expect(component['selectedItem']()).toBeNull();
  });

  it('should handle tab change on mobile', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['isMobile'].set(true);
    component['onTabChange']('module');

    expect(component['activeTab']()).toBe('module');
  });

  it('should detect mobile viewport correctly', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    // Default is desktop (window width >= 768)
    expect(component['isMobile']()).toBe(false);

    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    component['checkViewport']();

    expect(component['isMobile']()).toBe(true);
  });

  it('should have proper aria-live region for status announcements', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusRegion = compiled.querySelector('#navigation-management-status');

    expect(statusRegion).toBeTruthy();
    expect(statusRegion?.getAttribute('role')).toBe('status');
    expect(statusRegion?.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion?.getAttribute('aria-atomic')).toBe('true');
  });

  it('should disable edit and delete buttons when no item is selected', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const editButton = compiled.querySelector('#navigation-management-edit-button button') as HTMLButtonElement;
    const deleteButton = compiled.querySelector('#navigation-management-delete-button button') as HTMLButtonElement;

    expect(editButton?.disabled).toBe(true);
    expect(deleteButton?.disabled).toBe(true);
  });

  it('should enable edit and delete buttons when item is selected', () => {
    const req = httpMock.expectOne(`${baseUrl}/global?includeHidden=true`);
    req.flush({ data: mockGlobalNavigationItems, total: 2 });

    component['selectedItem'].set(mockGlobalNavigationItems[0]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const editButton = compiled.querySelector('#navigation-management-edit-button button') as HTMLButtonElement;
    const deleteButton = compiled.querySelector('#navigation-management-delete-button button') as HTMLButtonElement;

    expect(editButton?.disabled).toBe(false);
    expect(deleteButton?.disabled).toBe(false);
  });
});
