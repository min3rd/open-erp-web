import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { OrganizationLayoutService } from '../services/organization-layout.service';
import { Subject, takeUntil } from 'rxjs';
import { OrganizationContextService } from '../../../../../core/services/organization-context.service';

@Component({
  selector: 'organization-nav',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslocoModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './organization-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationNav implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private layoutService = inject(OrganizationLayoutService);
  private tenantContextService = inject(OrganizationContextService);
  private router = inject(Router);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  navMode = this.layoutService.navMode;

  currentOrganization = this.tenantContextService.currentOrganization;

  onToggleNavMode(): void {
    this.layoutService.toggleNavMode();
  }

  isActive(route: string): boolean {
    return this.router.isActive(route, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  ngOnInit(): void {
    this.tenantContextService.organizationChanged$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((org) => {
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
