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
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DrawerModule } from 'primeng/drawer';
import { MessageService } from 'primeng/api';
import { Select } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';

// Core components
import { GeoEditorComponent } from '../../../../../../core/components/geo-editor/geo-editor.component';
import { MapComponent } from '../../../../../../core/components/map/map.component';

// Services and types
import { DistrictService } from '../services/district.service';
import { ProvinceService } from '../../province/services/province.service';
import { District, CreateDistrictDto, UpdateDistrictDto } from '../district.types';
import { Province } from '../../province/province.types';

@Component({
  selector: 'management-district-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DrawerModule,
    Select,
    TextareaModule,
    GeoEditorComponent,
    MapComponent,
  ],
  templateUrl: './form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DistrictForm implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private districtService = inject(DistrictService);
  private provinceService = inject(ProvinceService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  // State
  protected readonly isVisible = signal(true);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly districtId = signal<string | null>(null);
  protected readonly isEditMode = computed(() => this.districtId() !== null);
  protected readonly currentGeometry = signal<GeoJSON.Geometry | null>(null);
  protected readonly provinces = signal<Province[]>([]);
  
  // Computed province options
  protected readonly provinceOptions = computed(() => {
    return this.provinces().map(p => ({
      label: p.name,
      value: p.id,
    }));
  });

  // Form
  protected districtForm!: FormGroup;

  ngOnInit(): void {
    // Initialize form
    this.districtForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2)]],
      nameVi: ['', [Validators.required, Validators.minLength(2)]],
      nameEn: ['', [Validators.required, Validators.minLength(2)]],
      provinceId: ['', [Validators.required]],
      population: [null],
      note: [''],
    });

    // Load provinces for dropdown
    this.provinceService.getProvinces({ page: 1, limit: 1000 }).subscribe({
      next: (data) => {
        this.provinces.set(data.items);
      },
      error: (error) => {
        console.error('Failed to load provinces:', error);
        this.messageService.add({
          severity: 'warn',
          summary: this.translocoService.translate('districtForm.messages.error'),
          detail: this.translocoService.translate('districtForm.messages.provinceLoadFailed'),
        });
      }
    });

    // Load district data from resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      const district = data['district'] as District | null;
      if (district) {
        this.districtId.set(district.id);
        this.districtForm.patchValue({
          code: district.code,
          nameVi: district.name.vi,
          nameEn: district.name.en,
          provinceId: district.provinceId,
          population: district.population,
          note: district.note,
        });
        this.currentGeometry.set(district.geometry || district.centroid || null);
      }
    });

    // Check if this is view mode
    const url = this.router.url;
    if (url.includes('/view')) {
      this.districtForm.disable();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle geometry change from GeoEditor
   */
  protected onGeometryChange(geometry: GeoJSON.Geometry | null): void {
    this.currentGeometry.set(geometry);
  }

  /**
   * Handle form submission
   */
  protected onSubmit(): void {
    if (this.districtForm.invalid) {
      Object.keys(this.districtForm.controls).forEach((key) => {
        this.districtForm.controls[key].markAsTouched();
      });
      return;
    }

    this.isSaving.set(true);

    const formData = this.districtForm.value;
    const geometry = this.currentGeometry();

    if (this.isEditMode()) {
      // Update existing district
      const updateDto: UpdateDistrictDto = {
        code: formData.code,
        name: {
          vi: formData.nameVi,
          en: formData.nameEn,
        },
        provinceId: formData.provinceId,
        population: formData.population || undefined,
        note: formData.note || undefined,
        centroid: geometry || undefined,
        geometry: geometry || undefined,
      };

      this.districtService.updateDistrict(this.districtId()!, updateDto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('districtForm.messages.success'),
            detail: this.translocoService.translate('districtForm.messages.updateSuccess'),
          });
          this.onClose();
        },
        error: (error) => {
          console.error('Update failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('districtForm.messages.error'),
            detail: this.translocoService.translate('districtForm.messages.updateFailed'),
          });
          this.isSaving.set(false);
        },
      });
    } else {
      // Create new district
      const createDto: CreateDistrictDto = {
        code: formData.code,
        name: {
          vi: formData.nameVi,
          en: formData.nameEn,
        },
        provinceId: formData.provinceId,
        population: formData.population || undefined,
        note: formData.note || undefined,
        centroid: geometry || undefined,
        geometry: geometry || undefined,
      };

      this.districtService.createDistrict(createDto).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('districtForm.messages.success'),
            detail: this.translocoService.translate('districtForm.messages.createSuccess'),
          });
          this.onClose();
        },
        error: (error) => {
          console.error('Create failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('districtForm.messages.error'),
            detail: this.translocoService.translate('districtForm.messages.createFailed'),
          });
          this.isSaving.set(false);
        },
      });
    }
  }

  /**
   * Close the drawer and navigate back
   */
  protected onClose(): void {
    this.isVisible.set(false);
    // Navigate back to list

    if (this.districtId()) {
      this.router.navigate(['../../'], { relativeTo: this.route });
      return;
    }

    this.router.navigate(['../'], { relativeTo: this.route });
  }

  /**
   * Get form control error message
   */
  protected getErrorMessage(controlName: string): string {
    const control = this.districtForm.get(controlName);
    if (!control || !control.touched || !control.errors) {
      return '';
    }

    const errors = control.errors;
    if (errors['required']) {
      return this.translocoService.translate(`districtForm.fields.${controlName}.errors.required`);
    }
    if (errors['minlength']) {
      return this.translocoService.translate(`districtForm.fields.${controlName}.errors.minlength`);
    }

    return '';
  }

  /**
   * Get whether form is in view-only mode
   */
  protected isViewMode(): boolean {
    return this.router.url.includes('/view');
  }
}
