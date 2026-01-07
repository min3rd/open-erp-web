import { TestBed } from '@angular/core/testing';
import { OrganizationService, CreateOrganizationDto, OrganizationType, OrganizationStatus } from './organization-service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

describe('OrganizationService - New Field Tests', () => {
  let service: OrganizationService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrganizationService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrganizationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('CreateOrganizationDto', () => {
    it('should include all new required fields', () => {
      const dto: CreateOrganizationDto = {
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date().toISOString(),
        type: 'company',
        status: 'active',
        country: 'VN',
      };

      expect(dto.type).toBe('company');
      expect(dto.status).toBe('active');
      expect(dto.country).toBe('VN');
    });

    it('should accept all organization types', () => {
      const types: OrganizationType[] = ['holding', 'company', 'joint-venture', 'partner', 'branch'];
      
      types.forEach(type => {
        const dto: CreateOrganizationDto = {
          taxId: '1234567890',
          name: 'Test Company',
          internationalName: 'Test Company Ltd',
          headquartersAddress: '123 Test Street',
          legalRepresentative: 'John Doe',
          contactPhone: '0901234567',
          contactEmail: 'test@example.com',
          foundedDate: new Date().toISOString(),
          type: type,
          status: 'active',
          country: 'VN',
        };
        
        expect(dto.type).toBe(type);
      });
    });

    it('should accept all organization statuses', () => {
      const statuses: OrganizationStatus[] = ['active', 'inactive', 'pending'];
      
      statuses.forEach(status => {
        const dto: CreateOrganizationDto = {
          taxId: '1234567890',
          name: 'Test Company',
          internationalName: 'Test Company Ltd',
          headquartersAddress: '123 Test Street',
          legalRepresentative: 'John Doe',
          contactPhone: '0901234567',
          contactEmail: 'test@example.com',
          foundedDate: new Date().toISOString(),
          type: 'company',
          status: status,
          country: 'VN',
        };
        
        expect(dto.status).toBe(status);
      });
    });

    it('should accept optional description and website fields', () => {
      const dto: CreateOrganizationDto = {
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date().toISOString(),
        type: 'company',
        status: 'active',
        country: 'VN',
        description: 'This is a test description',
        website: 'https://example.com',
      };

      expect(dto.description).toBe('This is a test description');
      expect(dto.website).toBe('https://example.com');
    });

    it('should work without optional fields', () => {
      const dto: CreateOrganizationDto = {
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date().toISOString(),
        type: 'company',
        status: 'active',
        country: 'VN',
      };

      expect(dto.description).toBeUndefined();
      expect(dto.website).toBeUndefined();
    });
  });

  describe('createOrganization with new fields', () => {
    it('should send POST request with new fields', () => {
      const dto: CreateOrganizationDto = {
        taxId: '1234567890',
        name: 'Test Company',
        internationalName: 'Test Company Ltd',
        headquartersAddress: '123 Test Street',
        legalRepresentative: 'John Doe',
        contactPhone: '0901234567',
        contactEmail: 'test@example.com',
        foundedDate: new Date().toISOString(),
        type: 'holding',
        status: 'active',
        country: 'VN',
        description: 'A test holding company',
        website: 'https://test.com',
      };

      service.createOrganization(dto).subscribe();

      const req = httpMock.expectOne((request) => request.url.includes('/organizations'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.type).toBe('holding');
      expect(req.request.body.status).toBe('active');
      expect(req.request.body.country).toBe('VN');
      expect(req.request.body.description).toBe('A test holding company');
      expect(req.request.body.website).toBe('https://test.com');

      req.flush({
        id: '123',
        ...dto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  });
});
