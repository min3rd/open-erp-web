import { ChangeDetectionStrategy, Component, signal, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidationErrors,
} from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToolbarModule } from 'primeng/toolbar';
import { MessageService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import {
  OrganizationService,
  CreateOrganizationDto,
  VietQRBusinessResponse,
} from '../../../../../core/services/organization-service';

interface BusinessRegistrationForm {
  taxId: FormControl<string>;
  name: FormControl<string>;
  internationalName: FormControl<string>;
  headquartersAddress: FormControl<string>;
  legalRepresentative: FormControl<string>;
  contactPhone: FormControl<string>;
  contactEmail: FormControl<string>;
  foundedDate: FormControl<Date | null>;
  businessActivities: FormControl<string[]>;
}

@Component({
  selector: 'organization-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    DatePickerModule,
    AutoCompleteModule,
    ToolbarModule,
  ],
  templateUrl: './detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Detail implements OnDestroy {
  private router = inject(Router);
  private organizationService = inject(OrganizationService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  protected readonly isSubmitting = signal(false);
  protected readonly isTaxLookupLoading = signal(false);
  protected readonly businessActivitySuggestions = signal<string[]>([]);
  protected readonly maxDate = new Date();

  // Common business activity suggestions for Vietnam
  private readonly defaultActivitySuggestions = [
    'Software Development',
    'IT Consulting',
    'Manufacturing',
    'Retail',
    'Wholesale',
    'Import/Export',
    'Construction',
    'Real Estate',
    'Finance',
    'Insurance',
    'Healthcare',
    'Education',
    'Transportation',
    'Logistics',
    'Hospitality',
    'Food & Beverage',
    'Agriculture',
    'Marketing',
    'Advertising',
    'E-commerce',
  ];

  protected readonly registrationForm = new FormGroup<BusinessRegistrationForm>({
    taxId: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[0-9]{10,13}$/)],
    }),
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    internationalName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    headquartersAddress: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
    legalRepresentative: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    contactPhone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.phoneValidator],
    }),
    contactEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    foundedDate: new FormControl<Date | null>(null, {
      validators: [Validators.required],
    }),
    businessActivities: new FormControl<string[]>([], {
      nonNullable: true,
    }),
  });

  constructor() {
    // Setup tax ID lookup with debounce
    this.registrationForm
      .get('taxId')
      ?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((taxId) => {
        if (taxId && taxId.length >= 10 && this.registrationForm.get('taxId')?.valid) {
          this.lookupTaxId(taxId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isNewMode(): boolean {
    return this.router.url.includes('/new');
  }

  get isDetailMode(): boolean {
    return this.router.url.includes('/detail');
  }

  private phoneValidator(control: FormControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

    // Vietnamese phone number validation (10-11 digits, optionally with country code)
    const phoneRegex = /^(\+84|84|0)?([0-9]{9,10})$/;
    return phoneRegex.test(value) ? null : { invalidPhone: true };
  }

  private lookupTaxId(taxId: string): void {
    this.isTaxLookupLoading.set(true);
    this.organizationService.lookupBusinessByTaxId(taxId).subscribe({
      next: (response: VietQRBusinessResponse | null) => {
        this.isTaxLookupLoading.set(false);
        if (response && response.data) {
          // Show success toast with business info
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('registerBusiness.taxLookup.found'),
            detail: this.translocoService.translate('registerBusiness.taxLookup.autoFilled', {
              name: response.data.name,
            }),
            life: 5000,
          });

          // Auto-populate form fields
          this.registrationForm.patchValue({
            name: response.data.name || '',
            internationalName: response.data.internationalName || '',
            headquartersAddress: response.data.address || '',
          });
        }
      },
      error: (error: any) => {
        this.isTaxLookupLoading.set(false);
        console.error('Tax lookup failed:', error);
        // Show error toast
        this.messageService.add({
          severity: 'warn',
          summary: this.translocoService.translate('registerBusiness.taxLookup.notFound'),
          detail: this.translocoService.translate('registerBusiness.taxLookup.manualEntry'),
          life: 4000,
        });
      },
    });
  }

  protected getFieldError(fieldName: keyof BusinessRegistrationForm): string | null {
    const control = this.registrationForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    const errorKeys: { [key: string]: string } = {
      required: 'registerBusiness.form.{{field}}.errors.required',
      email: 'registerBusiness.form.{{field}}.errors.email',
      minlength: 'registerBusiness.form.{{field}}.errors.minlength',
      pattern: 'registerBusiness.form.{{field}}.errors.pattern',
      invalidPhone: 'registerBusiness.form.{{field}}.errors.invalidPhone',
    };

    for (const [errorType, errorKey] of Object.entries(errorKeys)) {
      if (errors[errorType]) {
        return errorKey.replace('{{field}}', fieldName);
      }
    }

    return null;
  }

  protected onSearchBusinessActivity(event: any): void {
    const query = event.query?.toLowerCase() || '';
    if (query) {
      const filtered = this.defaultActivitySuggestions.filter((activity) =>
        activity.toLowerCase().includes(query)
      );
      this.businessActivitySuggestions.set(filtered);
    } else {
      this.businessActivitySuggestions.set(this.defaultActivitySuggestions);
    }
  }

  protected async onSubmit(): Promise<void> {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formValue = this.registrationForm.value;

      // Prepare DTO for backend
      const dto: CreateOrganizationDto = {
        taxId: formValue.taxId || '',
        name: formValue.name || '',
        internationalName: formValue.internationalName || '',
        headquartersAddress: formValue.headquartersAddress || '',
        legalRepresentative: formValue.legalRepresentative || '',
        contactPhone: formValue.contactPhone || '',
        contactEmail: formValue.contactEmail || '',
        foundedDate: formValue.foundedDate
          ? formValue.foundedDate.toISOString()
          : new Date().toISOString(),
        businessActivities: formValue.businessActivities || [],
      };

      this.organizationService.createOrganization(dto).subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('registerBusiness.messages.success'),
            detail: this.translocoService.translate('registerBusiness.messages.successDetail'),
          });
          // Navigate to organization detail view
          this.router.navigate(['/organization/detail']);
        },
        error: (error: any) => {
          console.error('Organization registration failed:', error);
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('registerBusiness.messages.error'),
            detail:
              error?.error?.message ||
              this.translocoService.translate('registerBusiness.messages.errorDetail'),
          });
          this.isSubmitting.set(false);
        },
      });
    } catch (error) {
      console.error('Registration failed:', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('registerBusiness.messages.error'),
        detail: this.translocoService.translate('registerBusiness.messages.errorDetail'),
      });
      this.isSubmitting.set(false);
    }
  }
}
