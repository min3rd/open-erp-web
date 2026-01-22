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
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ContextMenu } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MenuItem } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Select } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SplitterModule } from 'primeng/splitter';

// Core components and constants
import { MapComponent } from '../../../../../../core/components/map/map.component';
import { PaginationComponent } from '../../../../../../core/components/pagination/pagination';
import { PAGE_SIZE_OPTIONS } from '../../../../../../core/constant';

// Services
import { WardService } from '../services/ward.service';
import { Ward } from '../ward.types';
import { Province } from '../../province/province.types';
import { District } from '../../district/district.types';

@Component({
  selector: 'management-ward-list',
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    MenuModule,
    ContextMenuModule,
    TooltipModule,
    PaginationComponent,
    InputGroupModule,
    InputGroupAddonModule,
    Select,
    ConfirmDialogModule,
    SplitterModule,
    MapComponent,
  ],
  providers: [ConfirmationService],
  templateUrl: './list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WardList implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private wardService = inject(WardService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Constants
  private readonly SEARCH_FOCUS_DELAY = 100;
  protected readonly PAGE_SIZE_OPTIONS = PAGE_SIZE_OPTIONS;

  // State signals
  protected readonly wards = signal<Ward[]>([]);
  protected readonly selectedWard = signal<Ward | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(PAGE_SIZE_OPTIONS[0]);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);
  protected readonly provinces = signal<Province[]>([]);
  protected readonly districts = signal<District[]>([]);
  protected readonly selectedProvinceCode = signal<string>('all-provinces');
  protected readonly selectedDistrictCode = signal<string>('all-districts');
  protected readonly sortOrder = signal<'name:asc' | 'name:desc'>('name:asc');
  protected readonly expandedGroups = signal<Set<string>>(new Set());

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly selectedGeometry = computed(() => {
    const ward = this.selectedWard();
    if (!ward) return null;

    // Return geometry if available
    if (ward.geometry) return ward.geometry;

    // Convert centroid to GeoJSON Point if available
    if (ward.centroid) {
      const centroidPoint: GeoJSON.Point = {
        type: 'Point',
        coordinates: [ward.centroid.lon, ward.centroid.lat],
      };
      return centroidPoint;
    }

    return null;
  });

  // Group wards by province
  protected readonly wardsByProvince = computed(() => {
    const wardsList = this.wards();
    const provincesList = this.provinces();
    const groups = new Map<string, { provinceName: string; wards: Ward[] }>();

    wardsList.forEach((ward) => {
      const provinceCode = ward.provinceCode;
      if (!groups.has(provinceCode)) {
        const province = provincesList.find((p) => p.code === provinceCode);
        const provinceName = province?.name || `Unknown (${provinceCode})`;
        
        // Log warning if province name not found
        if (!province) {
          console.warn(`Province name not found for code: ${provinceCode}`);
        }
        
        groups.set(provinceCode, {
          provinceName,
          wards: [],
        });
      }
      groups.get(provinceCode)!.wards.push(ward);
    });

    return Array.from(groups.entries()).map(([code, data]) => ({
      provinceCode: code,
      provinceName: data.provinceName,
      wards: data.wards,
    }));
  });

  // Province filter options for dropdown
  protected readonly provinceOptions = computed(() => {
    const provs = this.provinces();
    return [
      {
        label: this.translocoService.translate('wardList.filter.allProvinces'),
        value: 'all-provinces',
      },
      ...provs.map((p) => ({ label: p.name, value: p.code })),
    ];
  });

  // District filter options for dropdown (filtered by province)
  protected readonly districtOptions = computed(() => {
    const dists = this.districts();
    const selectedProvince = this.selectedProvinceCode();
    
    const filteredDistricts =
      selectedProvince === 'all-provinces'
        ? dists
        : dists.filter((d) => d.provinceCode === selectedProvince);

    return [
      {
        label: this.translocoService.translate('wardList.filter.allDistricts'),
        value: 'all-districts',
      },
      ...filteredDistricts.map((d) => ({ label: d.name, value: d.code })),
    ];
  });

  // Actions menu items
  protected get actionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('wardList.actions.exportCSV'),
        icon: 'pi pi-download',
        command: () => this.onExportCSV(),
      },
      {
        label: this.translocoService.translate('wardList.actions.exportGeoJSON'),
        icon: 'pi pi-map',
        command: () => this.onExportGeoJSON(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('wardList.actions.import'),
        icon: 'pi pi-upload',
        command: () => this.onImport(),
      },
    ];
  }

  // Context menu items for row actions
  protected get contextMenuItems(): MenuItem[] {
    const ward = this.selectedWard();
    if (!ward) return [];

    return [
      {
        label: this.translocoService.translate('wardList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewWard(ward),
      },
      {
        label: this.translocoService.translate('wardList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditWard(ward),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('wardList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteWard(ward),
      },
    ];
  }

  constructor() {
    // Detect mobile viewport
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }

    // Focus mobile search input when it opens
    effect(() => {
      if (this.isSearchOpen() && this.mobileSearchInput) {
        setTimeout(() => {
          this.mobileSearchInput?.nativeElement?.focus();
        }, this.SEARCH_FOCUS_DELAY);
      }
    });

    // Reset district filter when province changes
    effect(() => {
      const provinceCode = this.selectedProvinceCode();
      // If province changes and we have a district selected that doesn't belong to this province
      const districtCode = this.selectedDistrictCode();
      if (districtCode !== 'all-districts') {
        const district = this.districts().find((d) => d.code === districtCode);
        if (district && district.provinceCode !== provinceCode && provinceCode !== 'all-provinces') {
          this.selectedDistrictCode.set('all-districts');
        }
      }
    });
  }

  ngOnInit(): void {
    // Load data from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const wardListData = data['wardList'];
      if (wardListData) {
        this.wards.set(wardListData.items);
        this.totalRecords.set(wardListData.total);
        this.isLoading.set(false);
      }

      if (data['provinceList']) {
        this.provinces.set(data['provinceList'].items);
      }

      if (data['districtList']) {
        this.districts.set(data['districtList'].items);
      }

      this.cdr.markForCheck();
    });

    // Subscribe to route params for pagination and filters
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || PAGE_SIZE_OPTIONS[0];
      const normalizedLimit = PAGE_SIZE_OPTIONS.includes(limit) ? limit : PAGE_SIZE_OPTIONS[0];
      const search = params['filter'] || '';
      const provinceFilter = params['provinceFilter'] || 'all-provinces';
      const districtFilter = params['districtFilter'] || 'all-districts';

      this.currentPage.set(page);
      this.pageSize.set(normalizedLimit);
      this.searchQuery.set(search === 'all' ? '' : search);
      this.selectedProvinceCode.set(provinceFilter);
      this.selectedDistrictCode.set(districtFilter);
      this.cdr.markForCheck();
    });

    // Subscribe to query params for sort
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((queryParams) => {
      const sort = queryParams['sort'] || 'name:asc';
      this.sortOrder.set(sort as 'name:asc' | 'name:desc');
      this.cdr.markForCheck();
    });

    // Initialize all groups as expanded
    this.expandAllGroups();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  /**
   * Handle search input changes
   */
  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.router.navigate(
      [
        '../../../../..',
        this.selectedProvinceCode(),
        this.selectedDistrictCode(),
        input.value || 'all',
        1,
        this.pageSize(),
      ],
      {
        relativeTo: this.route,
      }
    );
  }

  /**
   * Handle province filter change
   */
  protected onProvinceFilterChange(event: any): void {
    const provinceCode = event.value;
    // Reset district filter when province changes
    this.router.navigate(
      ['../../../../..', provinceCode, 'all-districts', this.searchQuery() || 'all', 1, this.pageSize()],
      {
        relativeTo: this.route,
      }
    );
  }

  /**
   * Handle district filter change
   */
  protected onDistrictFilterChange(event: any): void {
    const districtCode = event.value;
    this.router.navigate(
      [
        '../../../../..',
        this.selectedProvinceCode(),
        districtCode,
        this.searchQuery() || 'all',
        1,
        this.pageSize(),
      ],
      {
        relativeTo: this.route,
      }
    );
  }

  /**
   * Handle page change
   */
  protected onPageChange(event: { page: number; pageSize: number }): void {
    const newPage = event.page;
    const newPageSize = event.pageSize;

    this.router.navigate(
      [
        '../../../../..',
        this.selectedProvinceCode(),
        this.selectedDistrictCode(),
        this.searchQuery() || 'all',
        newPage,
        newPageSize,
      ],
      {
        relativeTo: this.route,
      }
    );
  }

  /**
   * Navigate to add new ward
   */
  protected onAddWard(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * Export wards to CSV
   */
  protected onExportCSV(): void {
    const params = {
      q: this.searchQuery() || undefined,
      provinceCode:
        this.selectedProvinceCode() !== 'all-provinces' ? this.selectedProvinceCode() : undefined,
      districtCode:
        this.selectedDistrictCode() !== 'all-districts' ? this.selectedDistrictCode() : undefined,
    };

    this.wardService.exportToCSV(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wards-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('wardList.messages.success'),
          detail: this.translocoService.translate('wardList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('wardList.messages.error'),
          detail: this.translocoService.translate('wardList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Export wards to GeoJSON
   */
  protected onExportGeoJSON(): void {
    const params = {
      q: this.searchQuery() || undefined,
      provinceCode:
        this.selectedProvinceCode() !== 'all-provinces' ? this.selectedProvinceCode() : undefined,
      districtCode:
        this.selectedDistrictCode() !== 'all-districts' ? this.selectedDistrictCode() : undefined,
    };

    this.wardService.exportToGeoJSON(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wards-${new Date().toISOString().split('T')[0]}.geojson`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('wardList.messages.success'),
          detail: this.translocoService.translate('wardList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('wardList.messages.error'),
          detail: this.translocoService.translate('wardList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Import wards (placeholder)
   */
  protected onImport(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('wardList.messages.notImplemented'),
      detail: this.translocoService.translate('wardList.messages.importSoon'),
    });
  }

  /**
   * Handle row click to select ward and show on map
   */
  protected onRowClick(ward: Ward): void {
    this.selectedWard.set(ward);
  }

  /**
   * Handle row right-click to show context menu
   */
  protected onRowRightClick(event: MouseEvent, ward: Ward): void {
    event.preventDefault();
    this.selectedWard.set(ward);
    this.contextMenu.show(event);
  }

  /**
   * View ward details
   */
  protected onViewWard(ward: Ward): void {
    this.router.navigate([ward.code], { relativeTo: this.route });
  }

  /**
   * Edit ward
   */
  protected onEditWard(ward: Ward): void {
    this.router.navigate([ward.code, 'edit'], { relativeTo: this.route });
  }

  /**
   * Delete a ward
   */
  protected onDeleteWard(ward: Ward): void {
    this.confirmationService.confirm({
      header: this.translocoService.translate('wardList.confirmDelete.header'),
      message: this.translocoService.translate('wardList.confirmDelete.message', {
        name: ward.name || ward.nameEn,
      }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('wardList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('wardList.confirmDelete.reject'),
      accept: () => {
        this.wardService.deleteWard(ward.code).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('wardList.messages.success'),
              detail: this.translocoService.translate('wardList.messages.deleteSuccess', {
                name: ward.name || ward.nameEn,
              }),
            });
            if (this.selectedWard()?.code === ward.code) {
              this.selectedWard.set(null);
            }
          },
          error: (error) => {
            console.error('Delete failed:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('wardList.messages.error'),
              detail: this.translocoService.translate('wardList.messages.deleteFailed'),
            });
          },
        });
      },
    });
  }

  /**
   * Check viewport size to detect mobile
   */
  private checkViewport(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  /**
   * Toggle search input visibility on mobile
   */
  protected toggleSearch(): void {
    this.isSearchOpen.set(!this.isSearchOpen());
  }

  /**
   * Close search on mobile
   */
  protected closeSearch(): void {
    this.isSearchOpen.set(false);
    this.searchQuery.set('');
    this.router.navigate(
      ['../../../..', this.selectedProvinceCode(), this.selectedDistrictCode(), 'all', 1, this.pageSize()],
      {
        relativeTo: this.route,
      }
    );
  }

  /**
   * Refresh ward list
   */
  protected onRefresh(): void {
    window.location.reload();
  }

  /**
   * Navigate to previous page
   */
  protected onPreviousPage(): void {
    if (this.currentPage() > 1) {
      const newPage = this.currentPage() - 1;
      this.router.navigate(
        [
          '../../../..',
          this.selectedProvinceCode(),
          this.selectedDistrictCode(),
          this.searchQuery() || 'all',
          newPage,
          this.pageSize(),
        ],
        {
          relativeTo: this.route,
        }
      );
    }
  }

  /**
   * Navigate to next page
   */
  protected onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      const newPage = this.currentPage() + 1;
      this.router.navigate(
        [
          '../../../..',
          this.selectedProvinceCode(),
          this.selectedDistrictCode(),
          this.searchQuery() || 'all',
          newPage,
          this.pageSize(),
        ],
        {
          relativeTo: this.route,
        }
      );
    }
  }

  /**
   * Change page size
   */
  protected onPageSizeChangeMobile(event: { value: number }): void {
    const newPageSize = event.value;
    this.router.navigate(
      [
        '../../../..',
        this.selectedProvinceCode(),
        this.selectedDistrictCode(),
        this.searchQuery() || 'all',
        1,
        newPageSize,
      ],
      {
        relativeTo: this.route,
      }
    );
  }

  /**
   * Get per-row menu items for mobile list
   */
  protected getRowMenuItems(ward: Ward): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('wardList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewWard(ward),
      },
      {
        label: this.translocoService.translate('wardList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditWard(ward),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('wardList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteWard(ward),
      },
    ];
  }

  /**
   * Handle sort order change
   */
  protected onSortChange(event: any): void {
    const sortValue = event.value as 'name:asc' | 'name:desc';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: sortValue },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Toggle sort order between asc and desc
   */
  protected toggleSort(): void {
    const newSort = this.sortOrder() === 'name:asc' ? 'name:desc' : 'name:asc';
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: newSort },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Toggle group expansion
   */
  protected toggleGroup(provinceCode: string): void {
    const expanded = this.expandedGroups();
    const newExpanded = new Set(expanded);
    
    if (newExpanded.has(provinceCode)) {
      newExpanded.delete(provinceCode);
    } else {
      newExpanded.add(provinceCode);
    }
    
    this.expandedGroups.set(newExpanded);
  }

  /**
   * Check if group is expanded
   */
  protected isGroupExpanded(provinceCode: string): boolean {
    return this.expandedGroups().has(provinceCode);
  }

  /**
   * Expand all groups
   */
  protected expandAllGroups(): void {
    const allCodes = this.wardsByProvince().map((g) => g.provinceCode);
    this.expandedGroups.set(new Set(allCodes));
  }

  /**
   * Collapse all groups
   */
  protected collapseAllGroups(): void {
    this.expandedGroups.set(new Set());
  }
}
