import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  computed,
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

    // TODO: Replace with actual API call to get user's organizations
    // For now, using mock data
    const mockOrganizations: TenantOrganization[] = [
      {
        id: 'demo-org-id',
        name: 'Demo Organization',
        internationalName: 'Demo Org',
        taxId: '0123456789',
      },
    ];

    this.tenantContextService.setUserOrganizations(mockOrganizations);
    this.loading.set(false);

    // In production, this would be:
    /*
    this.organizationService.getUserOrganizations().subscribe({
      next: (orgs) => {
        this.tenantContextService.setUserOrganizations(orgs);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load organizations');
        this.loading.set(false);
      },
    });
    */
  }
}
