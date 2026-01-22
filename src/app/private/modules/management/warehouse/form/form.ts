import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DrawerModule } from 'primeng/drawer';
import { MessageService } from 'primeng/api';

// Services
import { WarehouseService } from '../services/warehouse.service';
import { Warehouse } from '../warehouse.types';

@Component({
  selector: 'management-warehouse-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DrawerModule,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WarehouseForm implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private warehouseService = inject(WarehouseService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  protected readonly warehouse = signal<Warehouse | null>(null);
  protected readonly isEditMode = signal(false);
  protected readonly isViewMode = signal(false);
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);

  protected form!: FormGroup;

  ngOnInit(): void {
    // Initialize form
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      address: [''],
      organizationId: [''],
      type: [''],
      status: [''],
    });

    // Determine mode from route
    const routePath = this.route.snapshot.url[this.route.snapshot.url.length - 1]?.path;
    this.isViewMode.set(routePath === 'view');
    this.isEditMode.set(routePath === 'edit');

    // Load warehouse data if available
    this.route.data.subscribe((data) => {
      const warehouse = data['warehouse'];
      if (warehouse) {
        this.warehouse.set(warehouse);
        this.form.patchValue(warehouse);
        if (this.isViewMode()) {
          this.form.disable();
        }
      }
    });
  }

  protected onSave(): void {
    if (this.form.invalid) {
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.getRawValue();

    const saveOperation = this.warehouse()
      ? this.warehouseService.updateWarehouse(this.warehouse()!.id, formValue)
      : this.warehouseService.createWarehouse(formValue);

    saveOperation.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('warehouseForm.messages.success'),
          detail: this.translocoService.translate(
            this.warehouse()
              ? 'warehouseForm.messages.updateSuccess'
              : 'warehouseForm.messages.createSuccess'
          ),
        });
        this.onClose();
      },
      error: (error) => {
        console.error('Save failed:', error);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('warehouseForm.messages.error'),
          detail: this.translocoService.translate('warehouseForm.messages.saveFailed'),
        });
        this.isLoading.set(false);
      },
    });
  }

  protected onClose(): void {
    this.isVisible.set(false);
    // Navigate back to list
    const urlSegments = this.route.snapshot.url;
    const stepsBack = this.warehouse() ? 3 : 1; // Different depths for edit vs new
    this.router.navigate([Array(stepsBack).fill('..')], { relativeTo: this.route });
  }
}
