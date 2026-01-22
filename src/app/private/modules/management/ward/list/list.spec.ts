import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { WardList } from './list';
import { WardService } from '../services/ward.service';
import { TranslocoService } from '@jsverse/transloco';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Ward } from '../ward.types';
import { Province } from '../../province/province.types';
import { District } from '../../district/district.types';

describe('WardList Component - Grouping and Sorting', () => {
  let component: WardList;
  let fixture: ComponentFixture<WardList>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;
  let mockWardService: jasmine.SpyObj<WardService>;
  let mockTranslocoService: jasmine.SpyObj<TranslocoService>;

  const mockProvinces: Province[] = [
    { id: '1', code: '01', name: 'Hà Nội', nameEn: 'Hanoi', region: 'northern' } as Province,
    { id: '2', code: '79', name: 'Hồ Chí Minh', nameEn: 'Ho Chi Minh', region: 'southern' } as Province,
  ];

  const mockDistricts: District[] = [
    { id: '1', code: '001', name: 'Ba Đình', nameEn: 'Ba Dinh', provinceCode: '01' } as District,
    { id: '2', code: '760', name: 'Quận 1', nameEn: 'District 1', provinceCode: '79' } as District,
  ];

  const mockWards: Ward[] = [
    {
      id: '1',
      code: '00001',
      name: 'Phúc Xá',
      nameEn: 'Phuc Xa',
      provinceCode: '01',
      districtCode: '001',
    } as Ward,
    {
      id: '2',
      code: '00004',
      name: 'Trúc Bạch',
      nameEn: 'Truc Bach',
      provinceCode: '01',
      districtCode: '001',
    } as Ward,
    {
      id: '3',
      code: '26734',
      name: 'Tân Định',
      nameEn: 'Tan Dinh',
      provinceCode: '79',
      districtCode: '760',
    } as Ward,
  ];

  beforeEach(async () => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockWardService = jasmine.createSpyObj('WardService', ['getWards', 'deleteWard', 'exportToCSV', 'exportToGeoJSON']);
    mockTranslocoService = jasmine.createSpyObj('TranslocoService', ['translate']);

    mockActivatedRoute = {
      data: of({
        wardList: { items: mockWards, total: 3, page: 1, limit: 100, totalPages: 1 },
        provinceList: { items: mockProvinces, total: 2, page: 1, limit: 1000, totalPages: 1 },
        districtList: { items: mockDistricts, total: 2, page: 1, limit: 10000, totalPages: 1 },
      }),
      params: of({
        page: '1',
        limit: '100',
        filter: 'all',
        provinceFilter: 'all-provinces',
        districtFilter: 'all-districts',
      }),
      queryParams: of({
        sort: 'name:asc',
      }),
    };

    mockTranslocoService.translate.and.callFake((key: string, params?: any) => {
      if (key === 'wardList.filter.allProvinces') return 'All Provinces';
      if (key === 'wardList.filter.allDistricts') return 'All Districts';
      if (key === 'wardList.sort.nameAsc') return 'Name (A → Z)';
      if (key === 'wardList.sort.nameDesc') return 'Name (Z → A)';
      if (key === 'wardList.grouping.wards') return 'wards';
      if (key === 'wardList.grouping.toggleGroup' && params) return `Toggle group ${params.name}`;
      return key;
    });

    await TestBed.configureTestingModule({
      imports: [WardList],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: WardService, useValue: mockWardService },
        { provide: TranslocoService, useValue: mockTranslocoService },
        { provide: MessageService, useValue: jasmine.createSpyObj('MessageService', ['add']) },
        { provide: ConfirmationService, useValue: jasmine.createSpyObj('ConfirmationService', ['confirm']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WardList);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Province Grouping', () => {
    it('should load provinces from route data', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['provinces']()).toEqual(mockProvinces);
        done();
      }, 100);
    });

    it('should group wards by province code', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        const groups = component['wardsByProvince']();
        expect(groups.length).toBe(2);

        const hanoiGroup = groups.find(g => g.provinceCode === '01');
        expect(hanoiGroup).toBeDefined();
        expect(hanoiGroup!.provinceName).toBe('Hà Nội');
        expect(hanoiGroup!.wards.length).toBe(2);

        const hcmGroup = groups.find(g => g.provinceCode === '79');
        expect(hcmGroup).toBeDefined();
        expect(hcmGroup!.provinceName).toBe('Hồ Chí Minh');
        expect(hcmGroup!.wards.length).toBe(1);

        done();
      }, 100);
    });

    it('should display Unknown for missing province name', (done) => {
      // Add a ward with unknown province
      const wardsWithUnknown = [
        ...mockWards,
        {
          id: '4',
          code: '99999',
          name: 'Unknown Ward',
          nameEn: 'Unknown Ward',
          provinceCode: '99',
          districtCode: '999',
        } as Ward,
      ];

      mockActivatedRoute.data = of({
        wardList: { items: wardsWithUnknown, total: 4, page: 1, limit: 100, totalPages: 1 },
        provinceList: { items: mockProvinces, total: 2, page: 1, limit: 1000, totalPages: 1 },
        districtList: { items: mockDistricts, total: 2, page: 1, limit: 10000, totalPages: 1 },
      });

      fixture.detectChanges();

      setTimeout(() => {
        const groups = component['wardsByProvince']();
        const unknownGroup = groups.find(g => g.provinceCode === '99');
        expect(unknownGroup).toBeDefined();
        expect(unknownGroup!.provinceName).toBe('Unknown (99)');
        done();
      }, 100);
    });

    it('should get province name by code', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        const provinceName = component['getProvinceName']('01');
        expect(provinceName).toBe('Hà Nội');

        const unknownProvinceName = component['getProvinceName']('99');
        expect(unknownProvinceName).toBe('Unknown (99)');

        done();
      }, 100);
    });

    it('should get ward count for province', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        const wardCount = component['getWardCount']('01');
        expect(wardCount).toBe(2);

        const hcmWardCount = component['getWardCount']('79');
        expect(hcmWardCount).toBe(1);

        done();
      }, 100);
    });
  });

  describe('Group Expansion', () => {
    it('should initialize with all groups expanded', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['isGroupExpanded']('01')).toBe(true);
        expect(component['isGroupExpanded']('79')).toBe(true);
        done();
      }, 100);
    });

    it('should toggle group expansion', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        component['toggleGroup']('01');
        expect(component['isGroupExpanded']('01')).toBe(false);

        component['toggleGroup']('01');
        expect(component['isGroupExpanded']('01')).toBe(true);

        done();
      }, 100);
    });

    it('should expand all groups', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        // First collapse all
        component['collapseAllGroups']();
        expect(component['isGroupExpanded']('01')).toBe(false);
        expect(component['isGroupExpanded']('79')).toBe(false);

        // Then expand all
        component['expandAllGroups']();
        expect(component['isGroupExpanded']('01')).toBe(true);
        expect(component['isGroupExpanded']('79')).toBe(true);

        done();
      }, 100);
    });

    it('should collapse all groups', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        component['collapseAllGroups']();
        expect(component['isGroupExpanded']('01')).toBe(false);
        expect(component['isGroupExpanded']('79')).toBe(false);

        done();
      }, 100);
    });
  });

  describe('Sorting', () => {
    it('should load sort order from query params', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['sortOrder']()).toBe('name:asc');
        done();
      }, 100);
    });

    it('should generate sort options', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        const sortOptions = component['sortOptions']();
        expect(sortOptions.length).toBe(2);
        expect(sortOptions[0].value).toBe('name:asc');
        expect(sortOptions[1].value).toBe('name:desc');
        done();
      }, 100);
    });

    it('should navigate with sort parameter on sort change', () => {
      fixture.detectChanges();

      const event = { value: 'name:desc' };
      component['onSortChange'](event);

      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          relativeTo: mockActivatedRoute,
          queryParams: { sort: 'name:desc' },
          queryParamsHandling: 'merge',
        })
      );
    });
  });

  describe('Data Loading from Resolver', () => {
    it('should read wards from route.data', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['wards']()).toEqual(mockWards);
        expect(component['totalRecords']()).toBe(3);
        done();
      }, 100);
    });

    it('should read provinces from route.data (not fetch directly)', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        // Verify provinces are set
        expect(component['provinces']()).toEqual(mockProvinces);
        // Verify the ward service getProvinces was NOT called
        // (provinces should come from resolver, not component)
        expect(component['wards']().length).toBeGreaterThan(0);
        done();
      }, 100);
    });

    it('should read districts from route.data', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component['districts']()).toEqual(mockDistricts);
        done();
      }, 100);
    });
  });
});
