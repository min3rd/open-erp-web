import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  inject,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG imports
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { ChipModule } from 'primeng/chip';
import { PanelModule } from 'primeng/panel';
import { FloatLabelModule } from 'primeng/floatlabel';

// DTOs
import {
  NavigationItemDto,
  CreateNavigationItemDto,
  UpdateNavigationItemDto,
} from '../dto/navigation-item.dto';

@Component({
  selector: 'app-navigation-editor',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    CheckboxModule,
    InputNumberModule,
    ButtonModule,
    ChipModule,
    PanelModule,
    FloatLabelModule,
  ],
  templateUrl: './navigation-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationEditorComponent implements OnInit {
  // Inputs
  readonly item = input<NavigationItemDto | null>(null);
  readonly mode = input<'create' | 'edit' | 'view'>('create');
  readonly availableModules = input<{ label: string; value: string }[]>([]);
  readonly availableParents = input<NavigationItemDto[]>([]);

  // Outputs
  readonly save = output<CreateNavigationItemDto | UpdateNavigationItemDto>();
  readonly cancel = output<void>();

  private fb = inject(FormBuilder);
  private translocoService = inject(TranslocoService);

  // Form
  protected readonly form = signal<FormGroup>(this.createForm());
  protected readonly isSubmitting = signal(false);

  // Options
  protected readonly scopeOptions = [
    { label: 'navigationManagement.editor.form.scope.global', value: 'global' },
    { label: 'navigationManagement.editor.form.scope.module', value: 'module' },
  ];

  protected readonly tooltipPositionOptions = [
    { label: 'navigationManagement.editor.form.tooltipPosition.top', value: 'top' },
    { label: 'navigationManagement.editor.form.tooltipPosition.bottom', value: 'bottom' },
    { label: 'navigationManagement.editor.form.tooltipPosition.left', value: 'left' },
    { label: 'navigationManagement.editor.form.tooltipPosition.right', value: 'right' },
  ];

  // Permissions
  protected readonly includePermissions = signal<string[]>([]);
  protected readonly excludePermissions = signal<string[]>([]);

  constructor() {
    // Update form when item changes
    effect(() => {
      const currentItem = this.item();
      if (currentItem && this.mode() !== 'create') {
        this.patchForm(currentItem);
      }
    });

    // Watch scope changes to toggle moduleKey required
    effect(() => {
      const formValue = this.form().value;
      if (formValue.scope === 'module') {
        this.form().get('moduleKey')?.setValidators([Validators.required]);
      } else {
        this.form().get('moduleKey')?.clearValidators();
      }
      this.form().get('moduleKey')?.updateValueAndValidity();
    });
  }

  ngOnInit(): void {
    const currentItem = this.item();
    if (currentItem && this.mode() !== 'create') {
      this.patchForm(currentItem);
    }

    // Disable form in view mode
    if (this.mode() === 'view') {
      this.form().disable();
    }
  }

  /**
   * Create the form group
   */
  private createForm(): FormGroup {
    return this.fb.group({
      label: ['', [Validators.required]],
      icon: [''],
      subtitle: [''],
      routerLink: [''],
      url: [''],
      scope: ['global', [Validators.required]],
      moduleKey: [''],
      order: [0],
      disabled: [false],
      visible: [true],
      separator: [false],
      target: [''],
      badge: [''],
      badgeClass: [''],
      tooltip: [''],
      tooltipPosition: ['top'],
      shortcut: [''],
      class: [''],
      command: [''],
      meta: [''],
      parentId: [null],
    });
  }

  /**
   * Patch form with item data
   */
  private patchForm(item: NavigationItemDto): void {
    this.form().patchValue({
      label: item.label,
      icon: item.icon || '',
      subtitle: item.subtitle || '',
      routerLink: Array.isArray(item.routerLink) ? item.routerLink.join('/') : item.routerLink || '',
      url: item.url || '',
      scope: item.scope,
      moduleKey: item.moduleKey || '',
      order: item.order,
      disabled: item.disabled || false,
      visible: item.visible !== false,
      separator: item.separator || false,
      target: item.target || '',
      badge: item.badge || '',
      badgeClass: item.badgeClass || '',
      tooltip: item.tooltip || '',
      tooltipPosition: item.tooltipPosition || 'top',
      shortcut: item.shortcut || '',
      class: item.class || '',
      command: item.command || '',
      meta: item.meta ? JSON.stringify(item.meta, null, 2) : '',
    });

    // Set permissions
    if (item.permissions?.include) {
      this.includePermissions.set([...item.permissions.include]);
    }
    if (item.permissions?.exclude) {
      this.excludePermissions.set([...item.permissions.exclude]);
    }
  }

  /**
   * Handle form submission
   */
  protected onSubmit(): void {
    if (this.form().invalid) {
      this.form().markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.form().value;
    const dto: CreateNavigationItemDto | UpdateNavigationItemDto = {
      label: formValue.label,
      icon: formValue.icon || undefined,
      subtitle: formValue.subtitle || undefined,
      routerLink: formValue.routerLink ? formValue.routerLink.split('/').filter(Boolean) : undefined,
      url: formValue.url || undefined,
      scope: formValue.scope,
      moduleKey: formValue.moduleKey || undefined,
      order: formValue.order || 0,
      disabled: formValue.disabled || false,
      visible: formValue.visible !== false,
      separator: formValue.separator || false,
      target: formValue.target || undefined,
      badge: formValue.badge || undefined,
      badgeClass: formValue.badgeClass || undefined,
      tooltip: formValue.tooltip || undefined,
      tooltipPosition: formValue.tooltipPosition || undefined,
      shortcut: formValue.shortcut || undefined,
      class: formValue.class || undefined,
      command: formValue.command || undefined,
      parentId: formValue.parentId || undefined,
      permissions: {
        include: this.includePermissions().length > 0 ? this.includePermissions() : undefined,
        exclude: this.excludePermissions().length > 0 ? this.excludePermissions() : undefined,
      },
    };

    // Parse metadata if provided
    if (formValue.meta) {
      try {
        dto.meta = JSON.parse(formValue.meta);
      } catch (e) {
        console.error('Invalid JSON in meta field:', e);
      }
    }

    this.save.emit(dto);
    this.isSubmitting.set(false);
  }

  /**
   * Handle cancel
   */
  protected onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Get form control error message
   */
  protected getErrorMessage(controlName: string): string {
    const control = this.form().get(controlName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return this.translocoService.translate('navigationManagement.validation.requiredField');
    }
    if (control.errors['email']) {
      return this.translocoService.translate('navigationManagement.validation.invalidUrl');
    }

    return '';
  }

  /**
   * Check if field has error
   */
  protected hasError(controlName: string): boolean {
    const control = this.form().get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Add permission to include list
   */
  protected onAddIncludePermission(value: string): void {
    if (value && !this.includePermissions().includes(value)) {
      this.includePermissions.update((perms) => [...perms, value]);
    }
  }

  /**
   * Remove permission from include list
   */
  protected onRemoveIncludePermission(value: string): void {
    this.includePermissions.update((perms) => perms.filter((p) => p !== value));
  }

  /**
   * Add permission to exclude list
   */
  protected onAddExcludePermission(value: string): void {
    if (value && !this.excludePermissions().includes(value)) {
      this.excludePermissions.update((perms) => [...perms, value]);
    }
  }

  /**
   * Remove permission from exclude list
   */
  protected onRemoveExcludePermission(value: string): void {
    this.excludePermissions.update((perms) => perms.filter((p) => p !== value));
  }
}
