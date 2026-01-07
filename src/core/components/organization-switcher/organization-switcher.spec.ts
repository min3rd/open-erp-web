import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationSwitcher } from './organization-switcher';
import { TenantContextService } from '../../services/tenant-context.service';
import { OrganizationService } from '../../services/organization-service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { getTranslocoModule } from '../../testing/transloco-testing.module';

describe('OrganizationSwitcher', () => {
  let component: OrganizationSwitcher;
  let fixture: ComponentFixture<OrganizationSwitcher>;
  let tenantContextService: TenantContextService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationSwitcher, getTranslocoModule()],
      providers: [
        TenantContextService,
        OrganizationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    tenantContextService = TestBed.inject(TenantContextService);
    fixture = TestBed.createComponent(OrganizationSwitcher);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display organizations from tenant context', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org',
        internationalName: 'Test Org',
        taxId: '1234567890',
      },
    ];

    tenantContextService.setUserOrganizations(mockOrgs);
    fixture.detectChanges();

    expect(component.organizations().length).toBe(1);
    expect(component.dropdownOptions().length).toBe(1);
  });

  it('should call tenantContextService when organization changes', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org 1',
        internationalName: 'Test Org 1',
        taxId: '1234567890',
      },
      {
        id: 'org-2',
        name: 'Test Org 2',
        internationalName: 'Test Org 2',
        taxId: '0987654321',
      },
    ];

    tenantContextService.setUserOrganizations(mockOrgs);
    spyOn(tenantContextService, 'switchOrganization').and.returnValue(true);

    component.onOrganizationChange('org-2');

    expect(tenantContextService.switchOrganization).toHaveBeenCalledWith('org-2');
  });

  it('should set error when organization switch fails', () => {
    const mockOrgs = [
      {
        id: 'org-1',
        name: 'Test Org',
        internationalName: 'Test Org',
        taxId: '1234567890',
      },
    ];

    tenantContextService.setUserOrganizations(mockOrgs);
    spyOn(tenantContextService, 'switchOrganization').and.returnValue(false);

    component.onOrganizationChange('invalid-id');

    expect(component.error()).toBe('Failed to switch organization');
  });
});
