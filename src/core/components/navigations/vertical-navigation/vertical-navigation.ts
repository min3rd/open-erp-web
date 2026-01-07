import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../services/navigation-service';
import { Subject, takeUntil } from 'rxjs';
import { VerticalNaviagationModuleItem } from '../vertical-naviagation-module-item/vertical-naviagation-module-item';
import { TranslocoModule } from '@jsverse/transloco';
import { User } from '../../user/user';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '../../../services/layout-service';
import { OrganizationSwitcher } from '../../organization-switcher/organization-switcher';
import { LanguageSelector } from '../../language-selector/language-selector';
import { Router } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'layout-vertical-navigation',
  imports: [
    CommonModule,
    TranslocoModule,
    VerticalNaviagationModuleItem,
    User,
    ButtonModule,
    OrganizationSwitcher,
    LanguageSelector,
    TooltipModule,
  ],
  templateUrl: './vertical-navigation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerticalNavigation implements OnInit, OnDestroy {
  isMobile = input<boolean>(false);

  private layoutService = inject(LayoutService);
  private navigationService = inject(NavigationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  items: MenuItem[] | undefined;
  navMode = this.layoutService.navMode;
  navWidth = this.layoutService.navWidth;

  // For resize functionality
  isResizing = signal(false);

  ngOnInit() {
    this.navigationService.modules$.pipe(takeUntil(this._unsubscribeAll)).subscribe((modules) => {
      this.items = modules;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  logOut(): void {
    console.log("Haven't implement yet");
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  toggleNavMode(): void {
    this.layoutService.toggleNavMode();
  }

  navigateToRegisterOrganization(): void {
    this.router.navigate(['/modules/organization/new']);
    // Close mobile sidebar after navigation
    if (this.isMobile()) {
      this.layoutService.setSidebarVisible(false);
    }
  }

  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing.set(true);

    const startX = event.clientX;
    const startWidth = this.navWidth();

    const onMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = startWidth + deltaX;
      this.layoutService.setNavWidth(newWidth);
      this.cdr.markForCheck();
    };

    const onMouseUp = () => {
      this.isResizing.set(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      this.cdr.markForCheck();
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}

