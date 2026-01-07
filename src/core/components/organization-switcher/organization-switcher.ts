import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { TenantContextService, TenantOrganization } from '../../services/tenant-context.service';
import { OrganizationService } from '../../services/organization-service';

@Component({
  selector: 'organization-switcher',
  imports: [CommonModule, TranslocoModule, Select, FormsModule],
  templateUrl: './organization-switcher.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationSwitcher implements OnInit {
  private tenantContextService = inject(TenantContextService);
  private organizationService = inject(OrganizationService);

  organizations = this.tenantContextService.userOrganizations;
  selectedOrganization = this.tenantContextService.currentOrganization;

  loading = signal(false);
  error = signal<string | null>(null);
  showLabel = input<boolean>(true);

  // For dropdown display
  dropdownOptions = computed(() => {
    return this.organizations().map((org: TenantOrganization) => ({
      label: org.name,
      value: org.id,
      subtitle: org.taxId,
      data: org,
    }));
  });

  // Use writable signal for two-way binding
  selectedOrgId = signal<string | null>(this.selectedOrganization()?.id || null);

  ngOnInit(): void {
    // Load user's organizations if not already loaded
    if (this.organizations().length === 0) {
      this.loadUserOrganizations();
    }

    // Watch for changes to selected organization from context
    this.tenantContextService.organizationChanged$.subscribe((org) => {
      this.selectedOrgId.set(org?.id || null);
    });
  }

  onOrganizationChange(organizationId: string): void {
    if (organizationId) {
      const success = this.tenantContextService.switchOrganization(organizationId);
      if (!success) {
        this.error.set('Failed to switch organization');
      }
    }
  }

  private loadUserOrganizations(): void {
    this.loading.set(true);
    this.error.set(null);

    // Call backend API to get user's organizations
    this.organizationService.getUserOrganizations().subscribe({
      next: (orgs) => {
        const tenantOrgs: TenantOrganization[] = orgs.map((org) => ({
          id: org.id,
          name: org.name,
          internationalName: org.internationalName,
          taxId: org.taxId,
        }));
        this.tenantContextService.setUserOrganizations(tenantOrgs);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load user organizations:', err);
        this.error.set('Failed to load organizations');
        this.loading.set(false);
      },
    });
  }
}
