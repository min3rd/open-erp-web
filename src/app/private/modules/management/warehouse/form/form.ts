import { ChangeDetectionStrategy, Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DrawerModule } from 'primeng/drawer';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';

// Core components
import { GeoEditorComponent } from '../../../../../../core/components/geo-editor/geo-editor.component';
import { MapComponent } from '../../../../../../core/components/map/map.component';

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
    TextareaModule,
    DrawerModule,
    AutoCompleteModule,
    Select,
    GeoEditorComponent,
    MapComponent,
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
  protected readonly currentGeometry = signal<GeoJSON.Geometry | null>(null);

  // Warehouse type options (from backend enum)
  protected readonly warehouseTypes = [
    'Distribution Center',
    'Storage',
    'Hub',
    'Cross-Dock',
    'Cold Storage',
    'Retail',
  ];
  protected readonly filteredTypes = signal<string[]>(this.warehouseTypes);

  // Status options
  protected readonly statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Under Construction', value: 'under_construction' },
    { label: 'Maintenance', value: 'maintenance' },
  ];

  protected form!: FormGroup;
  
  // Computed geometry for map preview
  protected readonly mapGeometry = computed(() => this.currentGeometry());

  ngOnInit(): void {
    // Initialize form
    this.form = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      address: [''],
      organizationId: [''],
      type: [''],
      status: ['active'], // Default to active
      latitude: [null],
      longitude: [null],
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
        
        // Load geometry if available
        if (warehouse.geometry) {
          this.currentGeometry.set(warehouse.geometry);
          
          // Extract lat/lng from point geometry
          if (warehouse.geometry.type === 'Point' && Array.isArray(warehouse.geometry.coordinates)) {
            this.form.patchValue({
              longitude: warehouse.geometry.coordinates[0],
              latitude: warehouse.geometry.coordinates[1],
            });
          }
        }
        
        if (this.isViewMode()) {
          this.form.disable();
        }
      }
    });
  }

  /**
   * Handle geometry change from geo editor
   */
  protected onGeometryChange(geometry: GeoJSON.Geometry | null): void {
    this.currentGeometry.set(geometry);
    
    // Extract lat/lng from point geometry
    if (geometry?.type === 'Point' && Array.isArray(geometry.coordinates)) {
      this.form.patchValue({
        longitude: geometry.coordinates[0],
        latitude: geometry.coordinates[1],
      });
    }
  }

  /**
   * Filter warehouse types for autocomplete
   */
  protected filterTypes(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.filteredTypes.set(
      this.warehouseTypes.filter((type) => type.toLowerCase().includes(query))
    );
  }

  protected onSave(): void {
    if (this.form.invalid) {
      return;
    }

    this.isLoading.set(true);
    const formValue = this.form.getRawValue();

    // Build geometry from lat/lng if available
    const geometry = this.currentGeometry();
    
    // If no geometry but we have lat/lng, create a Point geometry
    if (!geometry && formValue.latitude && formValue.longitude) {
      const pointGeometry: GeoJSON.Point = {
        type: 'Point',
        coordinates: [formValue.longitude, formValue.latitude],
      };
      formValue.geometry = pointGeometry;
    } else if (geometry) {
      formValue.geometry = geometry;
    }

    // Remove lat/lng from the payload as they're not part of the DTO
    delete formValue.latitude;
    delete formValue.longitude;

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
    // Navigate back to list - use relative navigation to parent
    if (this.warehouse()) {
      // For edit/view mode: go up 3 levels (../../../)
      this.router.navigate(['../../..'], { relativeTo: this.route });
    } else {
      // For new mode: go up 1 level (../)
      this.router.navigate(['..'], { relativeTo: this.route });
    }
  }
}
