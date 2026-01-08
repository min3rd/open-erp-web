import { TestBed, ComponentFixture } from '@angular/core/testing';
import { List } from './list';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { UserService } from '../../../../../../core/services/user-service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';
import { MessageService } from 'primeng/api';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';

describe('List', () => {
  let component: List;
  let fixture: ComponentFixture<List>;
  let userService: Partial<UserService>;
  let organizationContext: Partial<OrganizationContextService>;

  const mockUsers = [
    {
      id: 'user-1',
      username: 'user1',
      email: 'user1@example.com',
      fullName: 'User One',
      phone: '+84900000001',
      avatar: 'https://i.pravatar.cc/150?img=1',
      status: 'active' as const,
      lastLogin: '2024-01-01T00:00:00.000Z',
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'user-2',
      username: 'user2',
      email: 'user2@example.com',
      fullName: 'User Two',
      phone: '+84900000002',
      avatar: 'https://i.pravatar.cc/150?img=2',
      status: 'active' as const,
      lastLogin: '2024-01-02T00:00:00.000Z',
      createdAt: '2023-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    userService = {
      getUsers: vi.fn().mockReturnValue(
        of({
          data: mockUsers,
          total: 2,
          page: 1,
          limit: 10,
        })
      ),
      blockUsers: vi.fn().mockReturnValue(of(void 0)),
      revokeLoginSessions: vi.fn().mockReturnValue(of(void 0)),
      exportToCSV: vi.fn().mockReturnValue(of(new Blob(['test'], { type: 'text/csv' }))),
    };

    organizationContext = {
      currentOrganization: signal(null),
      organizationChanged$: new Subject(),
    };

    await TestBed.configureTestingModule({
      imports: [
        List,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [
        provideRouter([
          {
            path: 'management/user/:filter/:page/:limit',
            component: List,
          },
        ]),
        { provide: UserService, useValue: userService },
        { provide: OrganizationContextService, useValue: organizationContext },
        MessageService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(List);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on initialization', () => {
    expect(userService.getUsers).toHaveBeenCalled();
  });

  it('should have all required DOM elements with correct IDs', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#user-list-toolbar')).toBeTruthy();
    expect(compiled.querySelector('#user-list-scope-toggle')).toBeTruthy();
    expect(compiled.querySelector('#user-list-search')).toBeTruthy();
    expect(compiled.querySelector('#user-list-add-button')).toBeTruthy();
    expect(compiled.querySelector('#user-list-actions-button')).toBeTruthy();
    expect(compiled.querySelector('#user-list-content')).toBeTruthy();
    expect(compiled.querySelector('#user-list-table')).toBeTruthy();
    expect(compiled.querySelector('#user-list-pagination')).toBeTruthy();
    expect(compiled.querySelector('#user-list-page-size')).toBeTruthy();
    expect(compiled.querySelector('#user-list-status')).toBeTruthy();
  });

  it('should filter users when search query changes', async () => {
    vi.clearAllMocks();
    (userService.getUsers as any).mockReturnValue(
      of({
        data: [mockUsers[0]],
        total: 1,
        page: 1,
        limit: 10,
      })
    );

    const searchInput = fixture.nativeElement.querySelector(
      '#user-list-search'
    ) as HTMLInputElement;
    searchInput.value = 'User One';
    searchInput.dispatchEvent(new Event('input'));

    // Wait for debounce (300ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(userService.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'User One',
      })
    );
  });

  it('should export to CSV when download action is triggered', () => {
    component['onDownloadCSV']();
    expect(userService.exportToCSV).toHaveBeenCalled();
  });

  it('should block selected users', () => {
    component['selectedUsers'].set([mockUsers[0], mockUsers[1]]);
    component['onBlockSelected']();
    expect(userService.blockUsers).toHaveBeenCalledWith(['user-1', 'user-2']);
  });

  it('should revoke login sessions for selected users', () => {
    component['selectedUsers'].set([mockUsers[0]]);
    component['onRevokeLoginSessions']();
    expect(userService.revokeLoginSessions).toHaveBeenCalledWith(['user-1']);
  });

  it('should format dates correctly', () => {
    const dateString = '2024-01-01T00:00:00.000Z';
    const formatted = component['formatDate'](dateString);
    expect(formatted).toBeTruthy();
    expect(formatted).not.toBe('Never');

    const emptyFormatted = component['formatDate']('');
    expect(emptyFormatted).toBe('Never');
  });

  it('should return correct status severity', () => {
    expect(component['getStatusSeverity']('active')).toBe('success');
    expect(component['getStatusSeverity']('inactive')).toBe('warn');
    expect(component['getStatusSeverity']('blocked')).toBe('danger');
    expect(component['getStatusSeverity']('unknown')).toBe('secondary');
  });

  it('should have proper aria-live region for status announcements', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const statusRegion = compiled.querySelector('#user-list-status');

    expect(statusRegion).toBeTruthy();
    expect(statusRegion?.getAttribute('role')).toBe('status');
    expect(statusRegion?.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion?.getAttribute('aria-atomic')).toBe('true');
  });
});
