import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { MenuItem } from 'primeng/api';

// Services
import { UserService, User, GetUsersParams } from '../../../../../../core/services/user-service';
import { OrganizationContextService } from '../../../../../../core/services/organization-context.service';

@Component({
  selector: 'management-user-list',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    MenuModule,
    SelectButtonModule,
    CheckboxModule,
    AvatarModule,
    TagModule,
    TooltipModule,
    PaginatorModule,
  ],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private tenantContext = inject(OrganizationContextService);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();

  // Search subject for debouncing
  private searchSubject$ = new Subject<string>();

  // State signals
  protected readonly users = signal<User[]>([]);
  protected readonly selectedUsers = signal<User[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalRecords = signal(0);
  protected readonly scope = signal<'global' | 'organization'>('global');

  // Computed values
  protected readonly totalPages = computed(() =>
    Math.ceil(this.totalRecords() / this.pageSize())
  );
  protected readonly hasSelection = computed(() => this.selectedUsers().length > 0);
  protected readonly currentOrganization = computed(() => this.tenantContext.currentOrganization());
  protected readonly allSelected = computed(() => 
    this.users().length > 0 && this.selectedUsers().length === this.users().length
  );

  // Scope options for toggle
  protected readonly scopeOptions = [
    { label: 'Global', value: 'global', icon: 'pi pi-globe' },
    { label: 'Organization', value: 'organization', icon: 'pi pi-building' },
  ];

  // Actions menu items getter for reactive disabled state
  protected get actionMenuItems(): MenuItem[] {
    return [
      {
        label: 'Download CSV',
        icon: 'pi pi-download',
        command: () => this.onDownloadCSV(),
      },
      {
        label: 'Import Users',
        icon: 'pi pi-upload',
        command: () => this.onImportUsers(),
      },
      {
        separator: true,
      },
      {
        label: 'Block Selected',
        icon: 'pi pi-ban',
        command: () => this.onBlockSelected(),
        disabled: !this.hasSelection(),
      },
      {
        label: 'Revoke Login Sessions',
        icon: 'pi pi-sign-out',
        command: () => this.onRevokeLoginSessions(),
        disabled: !this.hasSelection(),
      },
    ];
  }

  constructor() {
    // Setup search debouncing
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.currentPage.set(1); // Reset to first page on new search
        this.loadUsers();
      });

    // Load users when scope changes
    effect(() => {
      this.scope();
      this.currentPage.set(1); // Reset to first page on scope change
      this.loadUsers();
    });
  }

  ngOnInit(): void {
    // Subscribe to route params for pagination
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || 10;
      
      this.currentPage.set(page);
      this.pageSize.set(limit);
      
      // Load initial data
      this.loadUsers();
    });

    // Listen for organization changes
    this.tenantContext.organizationChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.scope() === 'organization') {
          this.loadUsers();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load users from the API
   */
  private loadUsers(): void {
    this.isLoading.set(true);

    const params: GetUsersParams = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchQuery() || undefined,
      scope: this.scope(),
    };

    if (this.scope() === 'organization' && this.currentOrganization()) {
      params.organizationId = this.currentOrganization()!.id;
    }

    this.userService.getUsers(params).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalRecords.set(response.total);
        this.isLoading.set(false);
        this.announceStatus(`Loaded ${response.data.length} users`);
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load users',
        });
        this.isLoading.set(false);
        this.announceStatus('Error loading users');
      },
    });
  }

  /**
   * Handle search input changes
   */
  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject$.next(input.value);
  }

  /**
   * Handle scope toggle change
   */
  protected onScopeChange(value: 'global' | 'organization'): void {
    this.scope.set(value);
    this.selectedUsers.set([]); // Clear selection on scope change
  }

  /**
   * Handle page change
   */
  protected onPageChange(event: any): void {
    const newPage = event.page + 1; // PrimeNG uses 0-based index
    const newPageSize = event.rows;

    // Update URL
    this.router.navigate(['/management/user', 'all', newPage, newPageSize]);
  }

  /**
   * Handle page size change
   */
  protected onPageSizeChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.onPageChange({ page: 0, rows: +select.value });
  }

  /**
   * Toggle select all users on current page
   */
  protected onToggleSelectAll(event: any): void {
    if (event.checked) {
      // Select all users on current page
      this.selectedUsers.set([...this.users()]);
    } else {
      // Deselect all
      this.selectedUsers.set([]);
    }
  }

  /**
   * Navigate to add new user
   */
  protected onAddUser(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * Download users as CSV
   */
  protected onDownloadCSV(): void {
    const params: GetUsersParams = {
      search: this.searchQuery() || undefined,
      scope: this.scope(),
    };

    if (this.scope() === 'organization' && this.currentOrganization()) {
      params.organizationId = this.currentOrganization()!.id;
    }

    this.userService.exportToCSV(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Users exported successfully',
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to export users',
        });
      },
    });
  }

  /**
   * Import users (placeholder)
   */
  protected onImportUsers(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Not Implemented',
      detail: 'User import functionality will be implemented soon',
    });
  }

  /**
   * Block selected users
   */
  protected onBlockSelected(): void {
    const userIds = this.selectedUsers().map((u) => u.id);
    if (userIds.length === 0) return;

    this.userService.blockUsers(userIds).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `${userIds.length} user(s) blocked successfully`,
        });
        this.selectedUsers.set([]);
        this.loadUsers();
      },
      error: (error) => {
        console.error('Block failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to block users',
        });
      },
    });
  }

  /**
   * Revoke login sessions for selected users
   */
  protected onRevokeLoginSessions(): void {
    const userIds = this.selectedUsers().map((u) => u.id);
    if (userIds.length === 0) return;

    this.userService.revokeLoginSessions(userIds).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Login sessions revoked for ${userIds.length} user(s)`,
        });
        this.selectedUsers.set([]);
      },
      error: (error) => {
        console.error('Revoke failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to revoke login sessions',
        });
      },
    });
  }

  /**
   * Get status tag severity
   */
  protected getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warn';
      case 'blocked':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Format date for display
   */
  protected formatDate(dateString: string): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  }

  /**
   * Announce status changes for screen readers
   */
  private announceStatus(message: string): void {
    // The status region in the template will announce this
    // This is handled by the aria-live region in the template
    console.log('[A11y]', message);
  }
}
