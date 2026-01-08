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
import { Subject, takeUntil } from 'rxjs';

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
  imports: [
    CommonModule,
    TranslocoModule,
    DrawerModule,
    ButtonModule,
    NavigationEditorComponent,
  ],
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
  protected readonly item = signal<NavigationItemDto | null>(null);
  protected readonly mode = signal<'create' | 'edit' | 'view'>('view');

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
      const isEditRoute = this.route.snapshot.url.some((segment) => segment.path === 'edit');
      const isNewRoute = this.route.snapshot.url.some((segment) => segment.path === 'new');

      if (isNewRoute) {
        // Create mode
        this.mode.set('create');
        this.item.set(null);
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
    this.isOpen.set(false);
    // Navigate back to list
    setTimeout(() => {
      this.router.navigate(['../../'], { relativeTo: this.route });
    }, 300); // Wait for drawer animation
  }

  /**
   * Handle save
   */
  protected onSave(dto: CreateNavigationItemDto | UpdateNavigationItemDto): void {
    if (this.mode() === 'create') {
      this.navigationService
        .createNavigationItem(dto as CreateNavigationItemDto)
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
            this.onClose();
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
    } else if (this.mode() === 'edit' && this.item()) {
      this.navigationService
        .updateNavigationItem(this.item()!.id, dto as UpdateNavigationItemDto)
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
            this.onClose();
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
}
