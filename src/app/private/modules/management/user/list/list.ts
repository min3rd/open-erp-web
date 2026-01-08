import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  effect,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ContextMenu } from 'primeng/contextmenu';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

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
    ContextMenuModule,
    SelectButtonModule,
    CheckboxModule,
    AvatarModule,
    TagModule,
    TooltipModule,
    PaginatorModule,
    InputGroupModule,
    InputGroupAddonModule,
  ],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class List implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private organizationContext = inject(OrganizationContextService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
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
  protected readonly selectedUser = signal<User | null>(null);

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly hasSelection = computed(() => this.selectedUsers().length > 0);
  protected readonly currentOrganization = computed(() =>
    this.organizationContext.currentOrganization()
  );
  protected readonly allSelected = computed(
    () => this.users().length > 0 && this.selectedUsers().length === this.users().length
  );

  // Scope options for toggle
  protected readonly scopeOptions = [
    { label: 'userList.scopeToggle.global', value: 'global', icon: 'pi pi-globe' },
    { label: 'userList.scopeToggle.organization', value: 'organization', icon: 'pi pi-building' },
  ];

  // Actions menu items getter for reactive disabled state
  protected get actionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('userList.actions.downloadCSV'),
        icon: 'pi pi-download',
        command: () => this.onDownloadCSV(),
      },
      {
        label: this.translocoService.translate('userList.actions.importUsers'),
        icon: 'pi pi-upload',
        command: () => this.onImportUsers(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('userList.actions.blockSelected'),
        icon: 'pi pi-ban',
        command: () => this.onBlockSelected(),
        disabled: !this.hasSelection(),
      },
      {
        label: this.translocoService.translate('userList.actions.revokeLoginSessions'),
        icon: 'pi pi-sign-out',
        command: () => this.onRevokeLoginSessions(),
        disabled: !this.hasSelection(),
      },
    ];
  }

  // Context menu items for row actions
  protected get contextMenuItems(): MenuItem[] {
    const user = this.selectedUser();
    if (!user) return [];

    return [
      {
        label: this.translocoService.translate('userList.contextMenu.viewDetails'),
        icon: 'pi pi-eye',
        command: () => this.onViewUserDetails(user),
      },
      {
        label: this.translocoService.translate('userList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditUser(user),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('userList.contextMenu.block'),
        icon: 'pi pi-ban',
        command: () => this.onBlockUser(user),
      },
      {
        label: this.translocoService.translate('userList.contextMenu.revokeSession'),
        icon: 'pi pi-sign-out',
        command: () => this.onRevokeUserSession(user),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('userList.contextMenu.sendNotification'),
        icon: 'pi pi-send',
        command: () => this.onSendNotification(user),
      },
    ];
  }

  constructor() {
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
      const search = params['filter'] || '';

      this.currentPage.set(page);
      this.pageSize.set(limit);
      this.searchQuery.set(search === 'all' ? '' : search);

      // Load initial data
      this.loadUsers();
    });

    // Listen for organization changes
    this.organizationContext.organizationChanged$.pipe(takeUntil(this.destroy$)).subscribe(() => {
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
        this.announceStatus(
          this.translocoService.translate('userList.messages.loaded', {
            count: response.data.length,
          })
        );
      },
      error: (error) => {
        console.error('Failed to load users:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.loadFailed'),
        });
        this.isLoading.set(false);
        this.announceStatus(this.translocoService.translate('userList.messages.errorLoading'));
      },
    });
  }

  /**
   * Handle search input changes
   */
  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Update URL with relative navigation
    this.router.navigate(['../../../', input.value || 'all', 1, this.pageSize()], {
      relativeTo: this.route,
    });
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

    // Update URL with relative navigation
    this.router.navigate(['../../..', this.searchQuery(), newPage, newPageSize], {
      relativeTo: this.route,
    });
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
          summary: this.translocoService.translate('userList.messages.success'),
          detail: this.translocoService.translate('userList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.exportFailed'),
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
      summary: this.translocoService.translate('userList.messages.notImplemented'),
      detail: this.translocoService.translate('userList.messages.importSoon'),
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
          summary: this.translocoService.translate('userList.messages.success'),
          detail: this.translocoService.translate('userList.messages.blockSuccess', {
            count: userIds.length,
          }),
        });
        this.selectedUsers.set([]);
        this.loadUsers();
      },
      error: (error) => {
        console.error('Block failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.blockFailed'),
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
          summary: this.translocoService.translate('userList.messages.success'),
          detail: this.translocoService.translate('userList.messages.revokeSuccess', {
            count: userIds.length,
          }),
        });
        this.selectedUsers.set([]);
      },
      error: (error) => {
        console.error('Revoke failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.revokeFailed'),
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
  }

  /**
   * Handle row click to navigate to user detail
   */
  protected onRowClick(user: User): void {
    this.router.navigate([user.id], { relativeTo: this.route });
  }

  /**
   * Handle row right-click to show context menu
   */
  protected onRowRightClick(event: MouseEvent, user: User): void {
    event.preventDefault();
    this.selectedUser.set(user);
    this.contextMenu.show(event);
  }

  /**
   * View user details
   */
  protected onViewUserDetails(user: User): void {
    this.router.navigate([user.id], { relativeTo: this.route });
  }

  /**
   * Edit user
   */
  protected onEditUser(user: User): void {
    this.router.navigate([user.id, 'edit'], { relativeTo: this.route });
  }

  /**
   * Block a single user
   */
  protected onBlockUser(user: User): void {
    this.userService.blockUsers([user.id]).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('userList.messages.success'),
          detail: this.translocoService.translate('userList.contextMenu.blockSuccess', {
            name: user.fullName,
          }),
        });
        this.loadUsers();
      },
      error: (error) => {
        console.error('Block failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.blockFailed'),
        });
      },
    });
  }

  /**
   * Revoke login session for a single user
   */
  protected onRevokeUserSession(user: User): void {
    this.userService.revokeLoginSessions([user.id]).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('userList.messages.success'),
          detail: this.translocoService.translate('userList.contextMenu.revokeSuccess', {
            name: user.fullName,
          }),
        });
      },
      error: (error) => {
        console.error('Revoke failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('userList.messages.error'),
          detail: this.translocoService.translate('userList.messages.revokeFailed'),
        });
      },
    });
  }

  /**
   * Send notification to user
   */
  protected onSendNotification(user: User): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('userList.messages.notImplemented'),
      detail: this.translocoService.translate('userList.contextMenu.sendNotificationSoon'),
    });
  }
}
