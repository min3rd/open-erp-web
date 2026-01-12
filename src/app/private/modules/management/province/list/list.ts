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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TreeTableModule } from 'primeng/treetable';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToolbarModule } from 'primeng/toolbar';
import { MenuModule } from 'primeng/menu';
import { ContextMenuModule } from 'primeng/contextmenu';
import { ContextMenu } from 'primeng/contextmenu';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { MessageService, ConfirmationService } from 'primeng/api';
import { MenuItem, TreeNode } from 'primeng/api';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Select } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SplitterModule } from 'primeng/splitter';
import { TreeTableNodeExpandEvent } from 'primeng/treetable';

// Core components
import { MapComponent } from '../../../../../../core/components/map/map.component';

// Services
import { ProvinceService } from '../services/province.service';
import {
  Province,
  District,
  Ward,
  AdministrativeEntity,
  AdministrativeTreeNode,
  GetProvincesParams,
  EntityScope,
} from '../province.types';
import { mapToTreeNodes, canHaveChildren, getChildScope } from '../utils/tree-mapper';

@Component({
  selector: 'management-province-list',
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    TranslocoModule,
    TreeTableModule,
    ButtonModule,
    InputTextModule,
    ToolbarModule,
    MenuModule,
    ContextMenuModule,
    TooltipModule,
    PaginatorModule,
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
export class ProvinceList implements OnInit, OnDestroy {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @ViewChild('mobileSearchInput') mobileSearchInput?: ElementRef<HTMLInputElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private provinceService = inject(ProvinceService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // Constants
  private readonly SEARCH_FOCUS_DELAY = 100;

  // State signals
  protected readonly treeNodes = signal<AdministrativeTreeNode[]>([]);
  protected readonly selectedNode = signal<AdministrativeTreeNode | null>(null);
  protected readonly selectedEntity = signal<AdministrativeEntity | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalRecords = signal(0);
  protected readonly isMobile = signal(false);
  protected readonly isSearchOpen = signal(false);

  // Computed values
  protected readonly totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  protected readonly selectedGeometry = computed(() => this.selectedEntity()?.geometry || null);

  // Actions menu items
  protected get actionMenuItems(): MenuItem[] {
    return [
      {
        label: this.translocoService.translate('provinceList.actions.exportCSV'),
        icon: 'pi pi-download',
        command: () => this.onExportCSV(),
      },
      {
        label: this.translocoService.translate('provinceList.actions.exportGeoJSON'),
        icon: 'pi pi-map',
        command: () => this.onExportGeoJSON(),
      },
      {
        separator: true,
      },
      {
        label: this.translocoService.translate('provinceList.actions.import'),
        icon: 'pi pi-upload',
        command: () => this.onImport(),
      },
    ];
  }

  // Context menu items for row actions
  protected get contextMenuItems(): MenuItem[] {
    const entity = this.selectedEntity();
    if (!entity) return [];

    const items: MenuItem[] = [
      {
        label: this.translocoService.translate('provinceList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewEntity(entity),
      },
      {
        label: this.translocoService.translate('provinceList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditEntity(entity),
      },
    ];

    // Add "Create Child" options based on entity type
    if (canHaveChildren(entity)) {
      items.push({ separator: true });
      
      if (entity.scope === 'province') {
        items.push({
          label: this.translocoService.translate('provinceList.contextMenu.createDistrict'),
          icon: 'pi pi-plus',
          command: () => this.onCreateChild(entity, 'district'),
        });
      } else if (entity.scope === 'district') {
        items.push({
          label: this.translocoService.translate('provinceList.contextMenu.createWard'),
          icon: 'pi pi-plus',
          command: () => this.onCreateChild(entity, 'ward'),
        });
      }
    }

    items.push(
      { separator: true },
      {
        label: this.translocoService.translate('provinceList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteEntity(entity),
      }
    );

    return items;
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
  }

  ngOnInit(): void {
    // Load data from resolver if available
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const provinceListData = data['provinceList'];
      if (provinceListData) {
        // Convert flat list to tree nodes
        const provinces = provinceListData.items as Province[];
        const treeData = mapToTreeNodes(provinces);
        this.treeNodes.set(treeData);
        this.totalRecords.set(provinceListData.total);
        this.isLoading.set(false);
      }
    });

    // Subscribe to route params for pagination
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const page = parseInt(params['page'], 10) || 1;
      const limit = parseInt(params['limit'], 10) || 10;
      const search = params['filter'] || '';

      this.currentPage.set(page);
      this.pageSize.set(limit);
      this.searchQuery.set(search === 'all' ? '' : search);
    });
  }

  private hasParamsChanged(page: number, limit: number, search: string): boolean {
    return (
      this.currentPage() !== page ||
      this.pageSize() !== limit ||
      this.searchQuery() !== (search === 'all' ? '' : search)
    );
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
    this.router.navigate(['../../..', input.value || 'all', 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Handle page change
   */
  protected onPageChange(event: any): void {
    const newPage = event.page + 1;
    const newPageSize = event.rows;

    this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, newPageSize], {
      relativeTo: this.route,
    });
  }

  /**
   * Navigate to add new province
   */
  protected onAddProvince(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  /**
   * Export provinces to CSV
   */
  protected onExportCSV(): void {
    const params: GetProvincesParams = {
      search: this.searchQuery() || undefined,
    };

    this.provinceService.exportToCSV(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `provinces-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('provinceList.messages.success'),
          detail: this.translocoService.translate('provinceList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('provinceList.messages.error'),
          detail: this.translocoService.translate('provinceList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Export provinces to GeoJSON
   */
  protected onExportGeoJSON(): void {
    const params: GetProvincesParams = {
      search: this.searchQuery() || undefined,
    };

    this.provinceService.exportToGeoJSON(params).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `provinces-${new Date().toISOString().split('T')[0]}.geojson`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('provinceList.messages.success'),
          detail: this.translocoService.translate('provinceList.messages.exportSuccess'),
        });
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('provinceList.messages.error'),
          detail: this.translocoService.translate('provinceList.messages.exportFailed'),
        });
      },
    });
  }

  /**
   * Import provinces (placeholder)
   */
  protected onImport(): void {
    this.messageService.add({
      severity: 'info',
      summary: this.translocoService.translate('provinceList.messages.notImplemented'),
      detail: this.translocoService.translate('provinceList.messages.importSoon'),
    });
  }

  /**
   * Handle row click to select entity and show on map
   */
  protected onNodeSelect(event: any): void {
    const node: AdministrativeTreeNode = event.node;
    this.selectedNode.set(node);
    this.selectedEntity.set(node.data);
  }

  /**
   * Handle tree node expansion (lazy loading)
   */
  protected onNodeExpand(event: TreeTableNodeExpandEvent): void {
    const node = event.node as AdministrativeTreeNode;
    const entity = node.data;

    // If children are already loaded, skip
    if (node.children && node.children.length > 0) {
      return;
    }

    // Set loading state
    node.loading = true;

    // Lazy load children from server
    this.provinceService.getChildren(entity.code).subscribe({
      next: (children) => {
        node.children = children;
        node.loading = false;
        node.leaf = children.length === 0;
        // Trigger change detection
        this.treeNodes.set([...this.treeNodes()]);
      },
      error: (error) => {
        console.error('Failed to load children:', error);
        node.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('provinceList.messages.error'),
          detail: this.translocoService.translate('provinceList.messages.loadChildrenFailed'),
        });
        // Trigger change detection
        this.treeNodes.set([...this.treeNodes()]);
      },
    });
  }

  /**
   * Handle row right-click to show context menu
   */
  protected onRowRightClick(event: MouseEvent, node: AdministrativeTreeNode): void {
    event.preventDefault();
    this.selectedNode.set(node);
    this.selectedEntity.set(node.data);
    this.contextMenu.show(event);
  }

  /**
   * View entity details
   */
  protected onViewEntity(entity: AdministrativeEntity): void {
    this.router.navigate([entity.code], { relativeTo: this.route });
  }

  /**
   * Edit entity
   */
  protected onEditEntity(entity: AdministrativeEntity): void {
    this.router.navigate([entity.code, 'edit'], { relativeTo: this.route });
  }

  /**
   * Create a child entity under the selected parent
   */
  protected onCreateChild(parent: AdministrativeEntity, childScope: EntityScope): void {
    // Navigate to create route with parent info in query params
    this.router.navigate(['new'], {
      relativeTo: this.route,
      queryParams: {
        parentCode: parent.code,
        scope: childScope,
      },
    });
  }

  /**
   * Delete an entity
   */
  protected onDeleteEntity(entity: AdministrativeEntity): void {
    const hasChildren = canHaveChildren(entity);
    const message = hasChildren
      ? this.translocoService.translate('provinceList.confirmDelete.messageWithChildren', {
          name: entity.name,
        })
      : this.translocoService.translate('provinceList.confirmDelete.message', {
          name: entity.name,
        });

    this.confirmationService.confirm({
      header: this.translocoService.translate('provinceList.confirmDelete.header'),
      message,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('provinceList.confirmDelete.accept'),
      rejectLabel: this.translocoService.translate('provinceList.confirmDelete.reject'),
      accept: () => {
        this.deleteEntityByScope(entity);
      },
    });
  }

  /**
   * Delete entity based on its scope
   */
  private deleteEntityByScope(entity: AdministrativeEntity): void {
    let deleteObservable;

    switch (entity.scope) {
      case 'province':
        deleteObservable = this.provinceService.deleteProvince(entity.id);
        break;
      case 'district':
        deleteObservable = this.provinceService.deleteDistrict(entity.id);
        break;
      case 'ward':
        deleteObservable = this.provinceService.deleteWard(entity.id);
        break;
      default:
        return;
    }

    deleteObservable.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('provinceList.messages.success'),
          detail: this.translocoService.translate('provinceList.messages.deleteSuccess', {
            name: entity.name,
          }),
        });
        if (this.selectedEntity()?.id === entity.id) {
          this.selectedEntity.set(null);
          this.selectedNode.set(null);
        }
        // Reload the tree
        this.onRefresh();
      },
      error: (error) => {
        console.error('Delete failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('provinceList.messages.error'),
          detail: this.translocoService.translate('provinceList.messages.deleteFailed'),
        });
      },
    });
  }

  /**
   * Handle row click to select province and show on map (backward compatibility)
   */
  protected onRowClick(node: AdministrativeTreeNode): void {
    this.selectedNode.set(node);
    this.selectedEntity.set(node.data);
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
    this.router.navigate(['../../..', 'all', 1, this.pageSize()], {
      relativeTo: this.route,
    });
  }

  /**
   * Refresh province list
   */
  protected onRefresh(): void {
    this.provinceService
      .getProvinces({
        page: this.currentPage(),
        limit: this.pageSize(),
        search: this.searchQuery() || undefined,
      })
      .subscribe({
        next: (response) => {
          const provinces = response.items as Province[];
          const treeData = mapToTreeNodes(provinces);
          this.treeNodes.set(treeData);
          this.totalRecords.set(response.total);
        },
        error: (error) => {
          console.error('Refresh failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('provinceList.messages.error'),
            detail: this.translocoService.translate('provinceList.messages.loadFailed'),
          });
        },
      });
  }

  /**
   * Navigate to previous page
   */
  protected onPreviousPage(): void {
    if (this.currentPage() > 1) {
      const newPage = this.currentPage() - 1;
      this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, this.pageSize()], {
        relativeTo: this.route,
      });
    }
  }

  /**
   * Navigate to next page
   */
  protected onNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      const newPage = this.currentPage() + 1;
      this.router.navigate(['../../..', this.searchQuery() || 'all', newPage, this.pageSize()], {
        relativeTo: this.route,
      });
    }
  }

  /**
   * Change page size
   */
  protected onPageSizeChangeMobile(event: { value: number }): void {
    const newPageSize = event.value;
    this.router.navigate(['../../..', this.searchQuery() || 'all', 1, newPageSize], {
      relativeTo: this.route,
    });
  }

  /**
   * Get per-row menu items for mobile list
   */
  protected getRowMenuItems(node: AdministrativeTreeNode): MenuItem[] {
    const entity = node.data;
    const items: MenuItem[] = [
      {
        label: this.translocoService.translate('provinceList.contextMenu.view'),
        icon: 'pi pi-eye',
        command: () => this.onViewEntity(entity),
      },
      {
        label: this.translocoService.translate('provinceList.contextMenu.edit'),
        icon: 'pi pi-pencil',
        command: () => this.onEditEntity(entity),
      },
    ];

    // Add "Create Child" options based on entity type
    if (canHaveChildren(entity)) {
      items.push({ separator: true });

      if (entity.scope === 'province') {
        items.push({
          label: this.translocoService.translate('provinceList.contextMenu.createDistrict'),
          icon: 'pi pi-plus',
          command: () => this.onCreateChild(entity, 'district'),
        });
      } else if (entity.scope === 'district') {
        items.push({
          label: this.translocoService.translate('provinceList.contextMenu.createWard'),
          icon: 'pi pi-plus',
          command: () => this.onCreateChild(entity, 'ward'),
        });
      }
    }

    items.push(
      { separator: true },
      {
        label: this.translocoService.translate('provinceList.contextMenu.delete'),
        icon: 'pi pi-trash',
        command: () => this.onDeleteEntity(entity),
      }
    );

    return items;
  }

  /**
   * Get scope translation key for display
   */
  protected getScopeLabel(scope: string): string {
    return this.translocoService.translate(`provinceList.scope.${scope}`);
  }
}
