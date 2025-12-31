import { ChangeDetectionStrategy, Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService, VerifyEmailDto } from '../../../../core/services/auth';
import { MessageService } from 'primeng/api';

interface VerifyAccountForm {
  email: FormControl<string>;
  verificationCode: FormControl<string>;
}

interface ApiResponse {
  error?: {
    errorCode?: string;
    message?: string;
    details?: any;
    supportUrl?: string;
  };
}

@Component({
  selector: 'public-verify-account',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoModule,
    NgOptimizedImage,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './verify-account.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyAccount implements OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private translocoService = inject(TranslocoService);

  protected readonly isSubmitting = signal(false);
  protected readonly isResending = signal(false);
  protected readonly resendCooldown = signal(0);
  private resendTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly verifyForm = new FormGroup<VerifyAccountForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    verificationCode: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  protected getFieldError(fieldName: keyof VerifyAccountForm): string | null {
    const control = this.verifyForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    const errors = control.errors;
    if (errors['required']) {
      return `verifyAccount.form.${fieldName}.errors.required`;
    }
    if (errors['email']) {
      return `verifyAccount.form.${fieldName}.errors.email`;
    }
    if (errors['minlength']) {
      return `verifyAccount.form.${fieldName}.errors.minlength`;
    }
    if (errors['pattern']) {
      return `verifyAccount.form.${fieldName}.errors.pattern`;
    }
    return null;
  }

  protected navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  protected onSubmit(): void {
    if (this.verifyForm.invalid) {
      this.verifyForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.verifyForm.value;
    this.authService
      .verifyEmail({
        email: formValue.email!,
        code: formValue.verificationCode!,
      })
      .subscribe({
        next: (response: ApiResponse) => {
          if (response.error) {
            this.messageService.add({
              severity: 'error',
              summary: this.translocoService.translate('verifyAccount.messages.verificationError'),
              detail: this.translocoService.translate(
                response.error.message ?? 'error.unknown',
                response.error.details
              ),
            });
          } else {
            this.messageService.add({
              severity: 'success',
              summary: this.translocoService.translate('verifyAccount.messages.verificationSuccess'),
            });
            // Navigate to login after 2 seconds
            setTimeout(() => {
              this.router.navigate(['/auth/login']);
            }, 2000);
          }
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('verifyAccount.messages.verificationError'),
          });
        },
        complete: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  protected onResendCode(): void {
    const emailControl = this.verifyForm.get('email');
    if (!emailControl?.value || emailControl.invalid) {
      emailControl?.markAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: this.translocoService.translate('verifyAccount.form.email.errors.required'),
      });
      return;
    }

    if (this.resendCooldown() > 0) {
      return;
    }

    this.isResending.set(true);

    this.authService.resendVerificationCode(emailControl.value).subscribe({
      next: (response: ApiResponse) => {
        if (response.error) {
          this.messageService.add({
            severity: 'error',
            summary: this.translocoService.translate('verifyAccount.messages.resendError'),
            detail: this.translocoService.translate(
              response.error.message ?? 'error.unknown',
              response.error.details
            ),
          });
        } else {
          this.messageService.add({
            severity: 'success',
            summary: this.translocoService.translate('verifyAccount.messages.resendSuccess'),
          });
          this.startResendCooldown();
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('verifyAccount.messages.resendError'),
        });
      },
      complete: () => {
        this.isResending.set(false);
      },
    });
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
    
    this.resendTimer = setInterval(() => {
      const current = this.resendCooldown();
      if (current <= 1) {
        this.resendCooldown.set(0);
        if (this.resendTimer) {
          clearInterval(this.resendTimer);
          this.resendTimer = null;
        }
      } else {
        this.resendCooldown.set(current - 1);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
      this.resendTimer = null;
    }
  }
}
