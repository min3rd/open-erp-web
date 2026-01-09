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
import { TimelineModule } from 'primeng/timeline';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';

// Services and types
import {
  UserDetailService,
  UserDetail,
  UserActivityLog,
} from '../services/user-detail.service';

@Component({
  selector: 'management-user-audit-logs',
  imports: [CommonModule, TranslocoModule, TimelineModule, ButtonModule, SkeletonModule],
  templateUrl: './audit-logs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogs implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private userDetailService = inject(UserDetailService);
  private translocoService = inject(TranslocoService);
  private destroy$ = new Subject<void>();

  protected readonly user = signal<UserDetail | null>(null);
  protected readonly activityLogs = signal<UserActivityLog[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly isLoadingMore = signal(false);
  protected readonly currentPage = signal(1);
  protected readonly totalLogs = signal(0);
  protected readonly hasMore = signal(true);

  ngOnInit(): void {
    // Get user from parent route resolver
    this.route.parent?.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['userDetail']) {
        const userData = data['userDetail'] as UserDetail;
        this.user.set(userData);
      }
    });

    // Get activity logs from route resolver
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      if (data['activityLogs']) {
        const logsData = data['activityLogs'];
        this.activityLogs.set(logsData.data);
        this.currentPage.set(logsData.page);
        this.totalLogs.set(logsData.total);
        this.hasMore.set(logsData.data.length < logsData.total);
      } else {
        // If no data from resolver, load it
        const userData = this.user();
        if (userData) {
          this.loadActivityLogs(userData.id);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load user activity logs
   */
  private loadActivityLogs(userId: string, page: number = 1): void {
    if (page === 1) {
      this.isLoading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }

    this.userDetailService
      .getUserActivityLogs(userId, page, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (page === 1) {
            this.activityLogs.set(response.data);
          } else {
            this.activityLogs.set([...this.activityLogs(), ...response.data]);
          }
          this.currentPage.set(response.page);
          this.totalLogs.set(response.total);
          this.hasMore.set(this.activityLogs().length < response.total);
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
        error: (error) => {
          console.error('Failed to load activity logs:', error);
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
      });
  }

  /**
   * Load more activity logs
   */
  protected onLoadMore(): void {
    const currentUser = this.user();
    if (!currentUser || !this.hasMore() || this.isLoadingMore()) {
      return;
    }
    this.loadActivityLogs(currentUser.id, this.currentPage() + 1);
  }

  /**
   * Format timestamp for display
   */
  protected formatTimestamp(timestamp: string): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
}

