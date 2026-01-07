import { TestBed, ComponentFixture } from '@angular/core/testing';
import { RegisterBusiness } from './register-business';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { OrganizationService } from '../../../../core/services/organization-service';
import { of, throwError } from 'rxjs';

describe('RegisterBusiness Component', () => {
  let component: RegisterBusiness;
  let fixture: ComponentFixture<RegisterBusiness>;
  let organizationService: OrganizationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegisterBusiness,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [provideRouter([]), provideHttpClient(), MessageService, OrganizationService],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterBusiness);
    component = fixture.componentInstance;
    organizationService = TestBed.inject(OrganizationService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize with invalid form', () => {
      expect(component['registrationForm'].valid).toBeFalsy();
    });

    it('should validate tax ID field', () => {
      const taxIdControl = component['registrationForm'].get('taxId');
      expect(taxIdControl?.valid).toBeFalsy();

      // Invalid: too short
      taxIdControl?.setValue('123');
      expect(taxIdControl?.valid).toBeFalsy();

      // Invalid: contains letters
      taxIdControl?.setValue('12345ABCDE');
      expect(taxIdControl?.valid).toBeFalsy();

      // Valid: 10 digits
      taxIdControl?.setValue('0123456789');
      expect(taxIdControl?.valid).toBeTruthy();

      // Valid: 13 digits
      taxIdControl?.setValue('0123456789012');
      expect(taxIdControl?.valid).toBeTruthy();
    });

    it('should validate business name field', () => {
      const nameControl = component['registrationForm'].get('name');
      expect(nameControl?.valid).toBeFalsy();

      nameControl?.setValue('AB');
      expect(nameControl?.valid).toBeFalsy();

      nameControl?.setValue('Valid Business Name');
      expect(nameControl?.valid).toBeTruthy();
    });

    it('should validate contact email field', () => {
      const emailControl = component['registrationForm'].get('contactEmail');
      expect(emailControl?.valid).toBeFalsy();

      emailControl?.setValue('invalid-email');
      expect(emailControl?.valid).toBeFalsy();

      emailControl?.setValue('valid@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });

    it('should validate contact phone field', () => {
      const phoneControl = component['registrationForm'].get('contactPhone');
      expect(phoneControl?.valid).toBeFalsy();

      // Invalid: too short
      phoneControl?.setValue('123');
      expect(phoneControl?.valid).toBeFalsy();

      // Valid: Vietnamese format
      phoneControl?.setValue('0123456789');
      expect(phoneControl?.valid).toBeTruthy();

      // Valid: with country code
      phoneControl?.setValue('+84123456789');
      expect(phoneControl?.valid).toBeTruthy();
    });

    it('should validate founded date field', () => {
      const dateControl = component['registrationForm'].get('foundedDate');
      expect(dateControl?.valid).toBeFalsy();

      dateControl?.setValue(new Date('2020-01-01'));
      expect(dateControl?.valid).toBeTruthy();
    });

    it('should have valid form when all required fields are filled', () => {
      component['registrationForm'].patchValue({
        taxId: '0123456789',
        name: 'Test Business Name',
        internationalName: 'Test International Name',
        headquartersAddress: '123 Test Street, Test City',
        legalRepresentative: 'John Doe',
        contactPhone: '0123456789',
        contactEmail: 'test@example.com',
        foundedDate: new Date('2020-01-01'),
      });

      expect(component['registrationForm'].valid).toBeTruthy();
    });
  });

  describe('Tax ID Lookup', () => {
    it('should call VietQR API when valid tax ID is entered', (done) => {
      const mockResponse = {
        code: '00',
        desc: 'Success',
        data: {
          id: '0123456789',
          name: 'Test Company',
          internationalName: 'Test Company International',
          shortName: 'TC',
          address: '123 Test Street',
          status: 'Active',
        },
      };

      const spy = vi.spyOn(organizationService, 'lookupBusinessByTaxId').mockReturnValue(of(mockResponse));

      component['registrationForm'].get('taxId')?.setValue('0123456789');

      // Wait for debounce
      setTimeout(() => {
        expect(spy).toHaveBeenCalledWith('0123456789');
        expect(component['taxLookupData']()).toEqual(mockResponse.data);
        done();
      }, 600);
    });

    it('should auto-populate fields when tax lookup succeeds', (done) => {
      const mockResponse = {
        code: '00',
        desc: 'Success',
        data: {
          id: '0123456789',
          name: 'Test Company',
          internationalName: 'Test Company International',
          shortName: 'TC',
          address: '123 Test Street',
          status: 'Active',
        },
      };

      vi.spyOn(organizationService, 'lookupBusinessByTaxId').mockReturnValue(of(mockResponse));

      component['registrationForm'].get('taxId')?.setValue('0123456789');

      setTimeout(() => {
        expect(component['registrationForm'].get('name')?.value).toBe('Test Company');
        expect(component['registrationForm'].get('internationalName')?.value).toBe(
          'Test Company International'
        );
        expect(component['registrationForm'].get('headquartersAddress')?.value).toBe(
          '123 Test Street'
        );
        done();
      }, 600);
    });

    it('should handle tax lookup failure gracefully', (done) => {
      vi.spyOn(organizationService, 'lookupBusinessByTaxId').mockReturnValue(of(null));

      component['registrationForm'].get('taxId')?.setValue('0123456789');

      setTimeout(() => {
        expect(component['taxLookupData']()).toBeNull();
        done();
      }, 600);
    });
  });

  describe('Form Submission', () => {
    it('should mark all fields as touched on invalid submit', async () => {
      const markAllAsTouchedSpy = vi.spyOn(component['registrationForm'], 'markAllAsTouched');
      await component['onSubmit']();
      expect(markAllAsTouchedSpy).toHaveBeenCalled();
    });

    it('should call organization service on valid submit', async () => {
      const mockResponse = {
        id: '123',
        taxId: '0123456789',
        name: 'Test Business',
        internationalName: 'Test International',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0123456789',
        contactEmail: 'test@example.com',
        foundedDate: '2020-01-01T00:00:00.000Z',
        businessActivities: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      const spy = vi
        .spyOn(organizationService, 'createOrganization')
        .mockReturnValue(of(mockResponse));

      component['registrationForm'].patchValue({
        taxId: '0123456789',
        name: 'Test Business',
        internationalName: 'Test International',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0123456789',
        contactEmail: 'test@example.com',
        foundedDate: new Date('2020-01-01'),
      });

      await component['onSubmit']();
      expect(spy).toHaveBeenCalled();
    });

    it('should set submitting state during submission', () => {
      component['registrationForm'].patchValue({
        taxId: '0123456789',
        name: 'Test Business',
        internationalName: 'Test International',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0123456789',
        contactEmail: 'test@example.com',
        foundedDate: new Date('2020-01-01'),
      });

      vi.spyOn(organizationService, 'createOrganization').mockReturnValue(
        of({
          id: '123',
          taxId: '0123456789',
          name: 'Test Business',
          internationalName: 'Test International',
          headquartersAddress: '123 Test Street',
          legalRepresentative: 'John Doe',
          contactPhone: '0123456789',
          contactEmail: 'test@example.com',
          foundedDate: '2020-01-01T00:00:00.000Z',
          businessActivities: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        })
      );

      component['onSubmit']();
      expect(component['isSubmitting']()).toBeTruthy();
    });
  });

  describe('Error Messages', () => {
    it('should return null error for untouched fields', () => {
      const error = component['getFieldError']('taxId');
      expect(error).toBeNull();
    });

    it('should return error key for touched invalid fields', () => {
      const taxIdControl = component['registrationForm'].get('taxId');
      taxIdControl?.markAsTouched();
      const error = component['getFieldError']('taxId');
      expect(error).toBe('registerBusiness.form.taxId.errors.required');
    });

    it('should return pattern error for invalid tax ID', () => {
      const taxIdControl = component['registrationForm'].get('taxId');
      taxIdControl?.setValue('123');
      taxIdControl?.markAsTouched();
      const error = component['getFieldError']('taxId');
      expect(error).toBe('registerBusiness.form.taxId.errors.pattern');
    });
  });

  describe('Navigation', () => {
    it('should navigate to login', () => {
      const router = TestBed.inject(Router);
      const navigateSpy = vi.spyOn(router, 'navigate');
      component['navigateToLogin']();
      expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    });
  });
});
