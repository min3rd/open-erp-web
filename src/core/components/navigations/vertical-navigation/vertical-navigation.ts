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
import { filter, Subject, takeUntil } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { User } from '../../user/user';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '../../../services/layout-service';
import { OrganizationSwitcher } from '../../organization-switcher/organization-switcher';
import { LanguageSelector } from '../../language-selector/language-selector';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { PanelMenuModule } from 'primeng/panelmenu';

@Component({
  selector: 'layout-vertical-navigation',
  imports: [
    CommonModule,
    TranslocoModule,
    User,
    ButtonModule,
    OrganizationSwitcher,
    LanguageSelector,
    TooltipModule,
    RouterModule,
    RippleModule,
    PanelMenuModule,
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

  items = signal<MenuItem[]>([]);
  moduleItems = signal<MenuItem[]>([]);
  navMode = this.layoutService.navMode;
  navWidth = this.layoutService.navWidth;

  // For resize functionality
  isResizing = signal(false);

  panelMenuPt = {
    headerLink: ({ context }: any) => this.buildLinkAttributes(context?.item as MenuItem),
    itemLink: ({ context }: any) =>
      this.buildLinkAttributes(
        (context?.processedItem?.item as MenuItem) ?? (context?.item as MenuItem)
      ),
  };

  ngOnInit() {
    this.navigationService.modules$.pipe(takeUntil(this._unsubscribeAll)).subscribe((modules) => {
      this.items.set(this.withActiveState(modules ?? []));
      this.cdr.markForCheck();
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe(() => {
        this.updateModuleNavigation();
        this.refreshActiveState();
      });

    this.updateModuleNavigation();
    this.refreshActiveState();
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

  onMenuItemSelect(item: MenuItem): void {
    if (this.isMobile()) {
      this.layoutService.setSidebarVisible(false);
    }

    if (item.url && !item.routerLink) {
      window.open(item.url, item.target || '_self');
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

  isItemActive(item: MenuItem): boolean {
    const currentUrl = this.router.url;
    const routerLink = this.resolveRouterLink(item);

    if (routerLink) {
      return (
        currentUrl === routerLink ||
        currentUrl.startsWith(`${routerLink}/`) ||
        currentUrl.startsWith(routerLink)
      );
    }

    if (item.url) {
      return currentUrl.startsWith(item.url);
    }

    return item.items?.some((child) => this.isItemActive(child)) ?? false;
  }

  itemId(item: MenuItem): string {
    return item.id || `vertical-navigation-item-${this.slugify(item.label || '')}`;
  }

  private updateModuleNavigation(): void {
    const moduleKey = this.getModuleKeyFromUrl(this.router.url);

    if (!moduleKey) {
      this.moduleItems.set([]);
      this.cdr.markForCheck();
      return;
    }

    this.navigationService
      .loadModuleNavigation(moduleKey)
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((items) => {
        this.moduleItems.set(this.withActiveState(items));
        this.cdr.markForCheck();
      });
  }

  private refreshActiveState(): void {
    this.items.set(this.withActiveState(this.items()));
    if (this.moduleItems().length) {
      this.moduleItems.set(this.withActiveState(this.moduleItems()));
    }
    this.cdr.markForCheck();
  }

  private withActiveState(items: MenuItem[] | null | undefined): MenuItem[] {
    if (!items?.length) {
      return [];
    }

    return items.map((item) => {
      const active = this.isItemActive(item);
      const childItems = item.items ? this.withActiveState(item.items) : undefined;

      const baseClasses = [
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800',
      ];

      if (item.linkClass) {
        baseClasses.push(item.linkClass);
      }

      if (active) {
        baseClasses.push(
          'nav-item--active bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200'
        );
      }

      return {
        ...item,
        items: childItems,
        linkClass: baseClasses.join(' '),
        ariaCurrent: active ? 'page' : undefined,
        command: (event) => {
          if (typeof item.command === 'function') {
            item.command(event);
          }
          this.onMenuItemSelect(item);
        },
      };
    });
  }

  private resolveRouterLink(item: MenuItem): string | null {
    if (!item.routerLink) {
      return null;
    }

    if (Array.isArray(item.routerLink)) {
      const tree = this.router.createUrlTree(item.routerLink);
      return this.router.serializeUrl(tree);
    }

    if (typeof item.routerLink === 'string') {
      return item.routerLink;
    }

    return null;
  }

  private getModuleKeyFromUrl(url: string): string | null {
    const segments = url.split('/').filter((segment) => !!segment);
    const moduleIndex = segments.indexOf('modules');

    if (moduleIndex !== -1 && segments.length > moduleIndex + 1) {
      return segments[moduleIndex + 1];
    }

    return null;
  }

  private slugify(value: string): string {
    if (!value) {
      const randomSuffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : Date.now().toString(36);
      return `nav-item-${randomSuffix}`;
    }
    return value
      .toString()
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
  }

  private buildLinkAttributes(item: MenuItem | undefined) {
    if (!item) {
      return {};
    }

    return {
      id: this.itemId(item),
      'aria-current': this.isItemActive(item) ? 'page' : undefined,
      'aria-label': item.tooltip || item.label,
    };
  }
}
