import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TextareaModule } from 'primeng/textarea';
import { ChipModule } from 'primeng/chip';
import { PanelModule } from 'primeng/panel';
import { SelectButtonModule } from 'primeng/selectbutton';

// Services and DTOs
import { NavigationManagementService } from './services/navigation-management.service';
import { NavigationItemDto, CreateNavigationItemDto, UpdateNavigationItemDto } from './dto/navigation-item.dto';
import { NavigationEditorComponent } from './components/navigation-editor.component';

@Component({
  selector: 'management-navigation',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslocoModule,
    TreeModule,
    ButtonModule,
    ToolbarModule,
    TooltipModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    CheckboxModule,
    TextareaModule,
    ChipModule,
    PanelModule,
    SelectButtonModule,
    NavigationEditorComponent,
  ],
  templateUrl: './navigation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navigation implements OnInit, OnDestroy {
  private navigationService = inject(NavigationManagementService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();
  private resizeHandler: (() => void) | null = null;

  // State signals
  protected readonly isMobile = signal(false);
  protected readonly activeTab = signal<'global' | 'module'>('global');
  protected readonly isLoading = signal(false);
  protected readonly globalNavigationItems = signal<NavigationItemDto[]>([]);
  protected readonly moduleNavigationItems = signal<NavigationItemDto[]>([]);
  protected readonly selectedModule = signal<NavigationItemDto | null>(null);
  protected readonly selectedItem = signal<NavigationItemDto | null>(null);
  protected readonly isEditorOpen = signal(false);
  protected readonly editorMode = signal<'create' | 'edit' | 'view'>('view');

  // Tab options for mobile
  protected readonly tabOptions = [
    { label: 'navigationManagement.tabs.global', value: 'global' as const },
    { label: 'navigationManagement.tabs.module', value: 'module' as const },
  ];

  // Computed values
  protected readonly globalTreeNodes = computed(() => this.convertToTreeNodes(this.globalNavigationItems()));
  protected readonly moduleTreeNodes = computed(() => this.convertToTreeNodes(this.moduleNavigationItems()));
  protected readonly selectedTreeNode = signal<TreeNode | null>(null);

  constructor() {
    // Detect mobile viewport
    this.checkViewport();
    if (typeof window !== 'undefined') {
      this.resizeHandler = () => this.checkViewport();
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  ngOnInit(): void {
    this.loadGlobalNavigation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (typeof window !== 'undefined' && this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
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
   * Load global navigation items
   */
  protected loadGlobalNavigation(): void {
    this.isLoading.set(true);
    this.navigationService.getGlobalNavigation({ includeHidden: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.globalNavigationItems.set(items);
          this.isLoading.set(false);
          this.announceStatus(this.translocoService.translate('navigationManagement.messages.loaded'));
        },
        error: (error) => {
          console.error('Failed to load global navigation:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('navigationManagement.messages.error'),
            detail: error.message,
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Load module navigation items
   */
  protected loadModuleNavigation(moduleKey: string): void {
    this.isLoading.set(true);
    this.navigationService.getModuleNavigation(moduleKey, { includeHidden: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => {
          this.moduleNavigationItems.set(items);
          this.isLoading.set(false);
          this.announceStatus(this.translocoService.translate('navigationManagement.messages.loaded'));
        },
        error: (error) => {
          console.error('Failed to load module navigation:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('navigationManagement.messages.error'),
            detail: error.message,
          });
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Convert NavigationItemDto array to TreeNode array
   */
  private convertToTreeNodes(items: NavigationItemDto[]): TreeNode[] {
    return items.map((item) => this.convertItemToTreeNode(item));
  }

  /**
   * Convert a single NavigationItemDto to TreeNode
   */
  private convertItemToTreeNode(item: NavigationItemDto): TreeNode {
    return {
      key: item.id,
      label: item.label,
      data: item,
      icon: item.icon,
      children: item.items?.map((child) => this.convertItemToTreeNode(child)) || [],
      expanded: false,
      draggable: true,
      droppable: true,
    };
  }

  /**
   * Handle tab change
   */
  protected onTabChange(tab: 'global' | 'module'): void {
    this.activeTab.set(tab);
    if (tab === 'module' && !this.selectedModule()) {
      this.messageService.add({
        severity: 'info',
        summary: this.translocoService.translate('navigationManagement.messages.noModule'),
        detail: this.translocoService.translate('navigationManagement.messages.selectModule'),
      });
    }
  }

  /**
   * Handle tree node selection
   */
  protected onNodeSelect(event: any): void {
    const node = event.node as TreeNode;
    const item = node.data as NavigationItemDto;
    this.selectedItem.set(item);
    this.selectedTreeNode.set(node);

    // If it's a module item in global navigation, load its module navigation
    if (this.activeTab() === 'global' && item.scope === 'global' && item.moduleKey) {
      this.selectedModule.set(item);
      this.loadModuleNavigation(item.moduleKey);
    }
  }

  /**
   * Handle tree node unselection
   */
  protected onNodeUnselect(): void {
    this.selectedItem.set(null);
    this.selectedTreeNode.set(null);
  }

  /**
   * Open editor to create new item
   */
  protected onAddItem(): void {
    this.selectedItem.set(null);
    this.editorMode.set('create');
    this.isEditorOpen.set(true);
  }

  /**
   * Open editor to edit selected item
   */
  protected onEditItem(): void {
    if (this.selectedItem()) {
      this.editorMode.set('edit');
      this.isEditorOpen.set(true);
    }
  }

  /**
   * Delete selected item
   */
  protected onDeleteItem(): void {
    const item = this.selectedItem();
    if (!item) return;

    // Show confirmation dialog (implementation to be added)
    if (confirm(this.translocoService.translate('navigationManagement.deleteDialog.message', { label: item.label }))) {
      this.navigationService.deleteNavigationItem(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('navigationManagement.messages.success'),
              detail: this.translocoService.translate('navigationManagement.messages.deleteSuccess'),
            });
            this.selectedItem.set(null);
            this.loadGlobalNavigation();
            if (this.selectedModule()?.moduleKey) {
              this.loadModuleNavigation(this.selectedModule()!.moduleKey!);
            }
          },
          error: (error) => {
            console.error('Failed to delete navigation item:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('navigationManagement.messages.error'),
              detail: error.message,
            });
          },
        });
    }
  }

  /**
   * Refresh current navigation
   */
  protected onRefresh(): void {
    if (this.activeTab() === 'global') {
      this.loadGlobalNavigation();
    } else if (this.selectedModule()?.moduleKey) {
      this.loadModuleNavigation(this.selectedModule()!.moduleKey!);
    }
  }

  /**
   * Close editor
   */
  protected onCloseEditor(): void {
    this.isEditorOpen.set(false);
    this.selectedItem.set(null);
  }

  /**
   * Handle editor save
   */
  protected onSaveItem(item: CreateNavigationItemDto | UpdateNavigationItemDto): void {
    if (this.editorMode() === 'create') {
      this.navigationService.createNavigationItem(item as CreateNavigationItemDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('navigationManagement.messages.success'),
              detail: this.translocoService.translate('navigationManagement.messages.createSuccess'),
            });
            this.isEditorOpen.set(false);
            this.onRefresh();
          },
          error: (error) => {
            console.error('Failed to create navigation item:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('navigationManagement.messages.error'),
              detail: error.message,
            });
          },
        });
    } else if (this.editorMode() === 'edit' && this.selectedItem()) {
      this.navigationService.updateNavigationItem(this.selectedItem()!.id, item as UpdateNavigationItemDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('navigationManagement.messages.success'),
              detail: this.translocoService.translate('navigationManagement.messages.updateSuccess'),
            });
            this.isEditorOpen.set(false);
            this.onRefresh();
          },
          error: (error) => {
            console.error('Failed to update navigation item:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('navigationManagement.messages.error'),
              detail: error.message,
            });
          },
        });
    }
  }

  /**
   * Announce status changes for screen readers
   */
  private announceStatus(message: string): void {
    // The status region in the template will announce this
  }
}
