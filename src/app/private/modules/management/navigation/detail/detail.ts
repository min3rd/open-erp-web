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
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { last, Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { DrawerModule } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

// Services and DTOs
import { NavigationManagementService } from '../services/navigation-management.service';
import {
  NavigationItemDto,
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
} from '../dto/navigation-item.dto';
import { NavigationEditorComponent } from '../components/navigation-editor.component';

@Component({
  selector: 'app-navigation-detail',
  imports: [CommonModule, TranslocoModule, DrawerModule, ButtonModule, NavigationEditorComponent],
  templateUrl: './detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationDetail implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private navigationService = inject(NavigationManagementService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  // State signals
  protected readonly isOpen = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isFormValid = signal(false);
  protected readonly formData = signal<any>(null);
  protected readonly item = signal<NavigationItemDto | null>(null);
  protected readonly mode = signal<'create' | 'edit' | 'view'>('view');
  protected readonly defaultScope = signal<'global' | 'module'>('global');
  protected readonly defaultModule = signal<string | null>(null);

  // Computed values
  protected readonly drawerTitle = computed(() => {
    const currentMode = this.mode();
    if (currentMode === 'create') {
      return this.translocoService.translate('navigationManagement.editor.title.create');
    } else if (currentMode === 'edit') {
      return this.translocoService.translate('navigationManagement.editor.title.edit');
    } else {
      return this.translocoService.translate('navigationManagement.editor.title.view');
    }
  });

  ngOnInit(): void {
    // Subscribe to route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['id'];
      const moduleId = params['moduleId']; // Check if we're in a module context
      const isEditRoute = this.route.snapshot.url.some((segment) => segment.path === 'edit');
      const isNewRoute = this.route.snapshot.url.some((segment) => segment.path === 'new');

      if (isNewRoute) {
        // Create mode
        this.mode.set('create');
        this.item.set(null);

        // Detect context from route
        if (moduleId) {
          // Creating in module context
          this.defaultScope.set('module');
          this.defaultModule.set(moduleId);
        } else {
          // Creating in global context
          this.defaultScope.set('global');
          this.defaultModule.set(null);
        }
      } else if (id) {
        // View or edit mode
        if (isEditRoute) {
          this.mode.set('edit');
        } else {
          this.mode.set('view');
        }
        this.loadItem(id);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load navigation item by ID
   */
  private loadItem(id: string): void {
    this.isLoading.set(true);
    this.navigationService
      .getNavigationItem(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (item) => {
          this.item.set(item);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load navigation item:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('navigationManagement.messages.error'),
            detail: error.message,
          });
          this.isLoading.set(false);
          this.onClose();
        },
      });
  }

  /**
   * Handle drawer close
   */
  protected onClose(): void {
    // Determine how many levels to go back based on context
    const moduleId = this.route.snapshot.params['moduleId'];
    const itemId = this.route.snapshot.params['id'];
    
    // If we're viewing/editing an item within a module, go back to the module view
    // Otherwise go back to the global list
    const navigateUp = moduleId && itemId ? '../../../' : '../../';
    
    this.router.navigate([navigateUp], { relativeTo: this.route }).then(() => {
      this.isOpen.set(false);
    });
  }

  /**
   * Handle form valid state change
   */
  protected onFormValidChange(isValid: boolean): void {
    this.isFormValid.set(isValid);
  }

  /**
   * Handle form data change
   */
  protected onFormDataChange(data: any): void {
    this.formData.set(data);
  }

  /**
   * Handle submit button click
   */
  protected onSubmit(): void {
    const data = this.formData();
    if (!data) {
      return;
    }

    this.isSaving.set(true);

    if (this.mode() === 'create') {
      this.navigationService
        .createNavigationItem(data as CreateNavigationItemDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('navigationManagement.messages.success'),
              detail: this.translocoService.translate(
                'navigationManagement.messages.createSuccess'
              ),
            });
            this.isSaving.set(false);
            this.onClose();
          },
          error: (error) => {
            console.error('Failed to create navigation item:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('navigationManagement.messages.error'),
              detail: error.message,
            });
            this.isSaving.set(false);
          },
        });
    } else if (this.mode() === 'edit' && this.item()) {
      this.navigationService
        .updateNavigationItem(this.item()!.id, data as UpdateNavigationItemDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('navigationManagement.messages.success'),
              detail: this.translocoService.translate(
                'navigationManagement.messages.updateSuccess'
              ),
            });
            this.isSaving.set(false);
            this.onClose();
          },
          error: (error) => {
            console.error('Failed to update navigation item:', error);
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('navigationManagement.messages.error'),
              detail: error.message,
            });
            this.isSaving.set(false);
          },
        });
    }
  }

  get availableModules() {
    return [
      {
        label: this.defaultModule() || 'Default Module',
        value: this.defaultModule() || 'default-module',
      },
    ];
  }
}
