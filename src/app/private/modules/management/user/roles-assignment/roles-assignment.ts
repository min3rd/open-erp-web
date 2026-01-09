import {
  ChangeDetectionStrategy,
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG imports
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';

// Services and types
import {
  UserDetailService,
  UserDetail,
  UserMembership,
} from '../services/user-detail.service';

@Component({
  selector: 'management-user-roles-assignment',
  imports: [CommonModule, TranslocoModule, TableModule, TagModule, SkeletonModule],
  templateUrl: './roles-assignment.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesAssignment implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private userDetailService = inject(UserDetailService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  protected readonly user = signal<UserDetail | null>(null);
  protected readonly memberships = signal<UserMembership[]>([]);
  protected readonly isLoading = signal(false);

  ngOnInit(): void {
    // Get user from parent route resolver
    this.route.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['userDetail']) {
        const userData = data['userDetail'] as UserDetail;
        this.user.set(userData);
      }
    });

    // Get memberships from route resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['memberships']) {
        this.memberships.set(data['memberships']);
      } else {
        // If no data from resolver, load it
        const userData = this.user();
        if (userData) {
          this.loadMemberships(userData.id);
        }
      }
    });

    // Subscribe to user updates from service
    this.userDetailService.userUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((updatedUser) => {
        if (updatedUser && updatedUser.id === this.user()?.id) {
          this.user.set(updatedUser);
          this.loadMemberships(updatedUser.id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load user memberships
   */
  private loadMemberships(userId: string): void {
    this.isLoading.set(true);
    this.userDetailService
      .getUserMemberships(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (memberships) => {
          this.memberships.set(memberships);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load memberships:', error);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Get status tag severity
   */
  protected getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warn';
      case 'inactive':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  /**
   * Format date for display
   */
  protected formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  }
}

