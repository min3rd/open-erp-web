import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { Toolbar } from 'primeng/toolbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { ButtonModule } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { MultiSelect } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';

// Services and types
import {
  UserDetailService,
  UserDetail,
  UserMembership,
  UserRolesPermissions,
  OrganizationBasic,
  Role,
} from '../services/user-detail.service';
import { UserRolesPermissionsData } from '../resolvers/user-roles-permissions.resolver';
import { AuthService } from '../../../../../core/services/auth-service';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';

type ScopeType = 'global' | 'organization';

interface ScopeOption {
  label: string;
  value: ScopeType;
}

@Component({
  selector: 'management-user-roles-assignment',
  imports: [
    CommonModule,
    FormsModule,
    TranslocoModule,
    Toolbar,
    SelectButtonModule,
    TableModule,
    TagModule,
    SkeletonModule,
    ButtonModule,
    Dialog,
    MultiSelect,
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
  ],
  templateUrl: './roles-assignment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesAssignment implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private userDetailService = inject(UserDetailService);
  private authService = inject(AuthService);
  private orgContextService = inject(OrganizationContextService);
  private translocoService = inject(TranslocoService);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();

  // State signals
  protected readonly user = signal<UserDetail | null>(null);
  protected readonly currentUser = signal<any>(null);
  protected readonly rolesPermissions = signal<UserRolesPermissions | null>(null);
  protected readonly organizations = signal<OrganizationBasic[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly selectedScope = signal<ScopeType>('organization');
  protected readonly currentOrganization = this.orgContextService.currentOrganization;

  // Dialog states
  protected readonly showGrantRolesDialog = signal(false);
  protected readonly showManageOrgRolesDialog = signal(false);
  protected readonly selectedOrgForManage = signal<OrganizationBasic | null>(null);
  protected readonly availableRoles = signal<Role[]>([]);
  protected readonly selectedRoleIds = signal<string[]>([]);
  protected readonly isGrantingRoles = signal(false);

  // Scope options for SelectButton
  protected readonly scopeOptions = computed<ScopeOption[]>(() => [
    {
      label: this.translocoService.translate('userDetail.rolesAssignment.scopeSelector.global'),
      value: 'global',
    },
    {
      label: this.translocoService.translate('userDetail.rolesAssignment.scopeSelector.organization'),
      value: 'organization',
    },
  ]);

  // Check if current user has global permissions
  protected readonly hasGlobalPermissions = computed(() => {
    const user = this.currentUser();
    if (!user || !user.permissions) return false;
    
    const permissions = user.permissions;
    return permissions.includes('MANAGE_USER') || permissions.includes('MANAGE_ORG');
  });

  // Computed values for display
  protected readonly globalRoles = computed(() => 
    this.rolesPermissions()?.globalRoles || []
  );

  protected readonly globalPermissions = computed(() => 
    this.rolesPermissions()?.globalPermissions || []
  );

  protected readonly orgRoles = computed(() => 
    this.rolesPermissions()?.orgRoles || []
  );

  protected readonly orgPermissions = computed(() => 
    this.rolesPermissions()?.orgPermissions || []
  );

  ngOnInit(): void {
    // Get current authenticated user
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUser.set(user);
    });

    // Get user from parent route resolver
    this.route.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['userDetail']) {
        const userData = data['userDetail'] as UserDetail;
        this.user.set(userData);
      }
    });

    // Get roles/permissions data from route resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['rolesPermissionsData']) {
        const rpData = data['rolesPermissionsData'] as UserRolesPermissionsData;
        this.rolesPermissions.set(rpData.rolesPermissions);
        this.organizations.set(rpData.organizations);
      }
    });

    // Subscribe to user updates from service
    this.userDetailService.userUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedUser) => {
        if (updatedUser && updatedUser.id === this.user()?.id) {
          this.user.set(updatedUser);
          this.reloadRolesPermissions();
        }
      });

    // Subscribe to organization changes
    this.orgContextService.organizationChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.selectedScope() === 'organization') {
          this.reloadRolesPermissions();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Reload roles and permissions data
   */
  private reloadRolesPermissions(): void {
    const userData = this.user();
    if (!userData) return;

    this.isLoading.set(true);
    
    const orgId = this.selectedScope() === 'organization' 
      ? this.currentOrganization()?.id 
      : undefined;

    this.userDetailService
      .getUserRolesPermissions(userData.id, orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.rolesPermissions.set(data);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load roles/permissions:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: this.translocoService.translate('userDetail.rolesAssignment.loadError'),
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Handle scope change
   */
  protected onScopeChange(event: any): void {
    this.selectedScope.set(event.value);
    this.reloadRolesPermissions();
  }

  /**
   * Open grant roles dialog
   */
  protected openGrantRolesDialog(scope: 'global' | 'organization'): void {
    const orgId = scope === 'organization' ? this.currentOrganization()?.id : undefined;
    
    this.isLoading.set(true);
    this.userDetailService
      .getAvailableRoles(orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.availableRoles.set(roles);
          this.selectedRoleIds.set([]);
          this.showGrantRolesDialog.set(true);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load available roles:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: error.message,
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Grant roles to user
   */
  protected grantRoles(): void {
    const userData = this.user();
    const orgId = this.currentOrganization()?.id;
    const roleIds = this.selectedRoleIds();

    if (!userData || !orgId || roleIds.length === 0) return;

    this.isGrantingRoles.set(true);
    this.userDetailService
      .grantRolesToUserInOrg(orgId, userData.id, roleIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('userDetail.messages.success'),
            detail: this.translocoService.translate('userDetail.rolesAssignment.dialogs.grantRoles.success'),
          });
          this.showGrantRolesDialog.set(false);
          this.isGrantingRoles.set(false);
          this.reloadRolesPermissions();
        },
        error: (error) => {
          console.error('Failed to grant roles:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: this.translocoService.translate('userDetail.rolesAssignment.dialogs.grantRoles.error'),
          });
          this.isGrantingRoles.set(false);
        },
      });
  }

  /**
   * Open manage organization roles dialog
   */
  protected openManageOrgRolesDialog(org: OrganizationBasic): void {
    this.selectedOrgForManage.set(org);
    this.isLoading.set(true);
    
    this.userDetailService
      .getAvailableRoles(org.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.availableRoles.set(roles);
          // TODO: Load current roles for this org
          this.selectedRoleIds.set([]);
          this.showManageOrgRolesDialog.set(true);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load available roles:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: error.message,
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Save organization roles
   */
  protected saveOrgRoles(): void {
    const userData = this.user();
    const org = this.selectedOrgForManage();
    const roleIds = this.selectedRoleIds();

    if (!userData || !org) return;

    this.isGrantingRoles.set(true);
    this.userDetailService
      .grantRolesToUserInOrg(org.id, userData.id, roleIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('userDetail.messages.success'),
            detail: this.translocoService.translate('userDetail.rolesAssignment.dialogs.manageOrgRoles.success'),
          });
          this.showManageOrgRolesDialog.set(false);
          this.isGrantingRoles.set(false);
          
          // Reload organizations to get updated roles
          const userId = userData.id;
          this.userDetailService
            .getUserOrganizations(userId)
            .pipe(takeUntil(this.destroy$))
            .subscribe((orgs) => {
              this.organizations.set(orgs);
            });
        },
        error: (error) => {
          console.error('Failed to save organization roles:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('userDetail.messages.error'),
            detail: this.translocoService.translate('userDetail.rolesAssignment.dialogs.manageOrgRoles.error'),
          });
          this.isGrantingRoles.set(false);
        },
      });
  }

  /**
   * Format date for display
   */
  protected formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  }

  /**
   * Get role names as comma-separated string
   */
  protected getRolesDisplay(roles: Role[]): string {
    if (!roles || roles.length === 0) return '-';
    return roles.map(r => r.name).join(', ');
  }

  /**
   * Get permission names as comma-separated string
   */
  protected getPermissionsDisplay(permissions: any[]): string {
    if (!permissions || permissions.length === 0) return '-';
    return permissions.map(p => p.name || p).join(', ');
  }
}

