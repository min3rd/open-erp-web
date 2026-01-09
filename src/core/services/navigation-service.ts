import { HttpClient, HttpParams } from '@angular/common/http';
import { DestroyRef, inject, Injectable, isDevMode } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject, catchError, fromEvent, map, Observable, of, tap } from 'rxjs';
import { API_URI_CONFIG } from '../constant';
import { ApiResponse, ApiSingleResponse, isApiResponse, unwrap } from '../api';
import { AuthService } from './auth-service';

type NavigationScope = 'global' | 'module';

interface NavigationApiItem {
  id?: string;
  label: string;
  icon?: string;
  subtitle?: string;
  routerLink?: string | string[];
  url?: string;
  items?: NavigationApiItem[];
  parentId?: string | null;
  permissions?: {
    include?: string[];
    exclude?: string[];
  };
  command?: string;
  disabled?: boolean;
  target?: string;
  badge?: string | number;
  badgeClass?: string;
  tooltip?: string;
  class?: string;
  order?: number;
  scope?: NavigationScope;
  module?: string;
  meta?: Record<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  private _modules = new BehaviorSubject<MenuItem[] | null>(null);
  private _items = new Map<string, BehaviorSubject<MenuItem[] | null>>();
  private currentPermissions: Set<string> = new Set();

  constructor() {
    this.authService.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.currentPermissions = new Set(user?.permissions ?? []);
    });

    if (typeof window !== 'undefined') {
      fromEvent<CustomEvent<{ scope?: NavigationScope; moduleKey?: string }>>(
        window,
        'navigation.updated'
      )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event) => {
          const scope = event.detail?.scope ?? 'global';
          this.refreshNavigation(scope, event.detail?.moduleKey);
        });
    }
  }

  get modules$(): Observable<MenuItem[] | null> {
    return this._modules.asObservable();
  }

  getModuleNavigation$(moduleKey: string): Observable<MenuItem[] | null> {
    return this.resolveModuleSubject(moduleKey).asObservable();
  }

  loadModules(version: string = 'v1', format: 'tree' | 'flat' = 'tree'): Observable<MenuItem[]> {
    return this.loadNavigation('global', { format, version });
  }

  loadModuleNavigation(
    moduleKey: string,
    format: 'tree' | 'flat' = 'tree'
  ): Observable<MenuItem[]> {
    return this.loadNavigation('module', { moduleKey, format });
  }

  refreshNavigation(scope: NavigationScope = 'global', moduleKey?: string): void {
    this.loadNavigation(scope, { moduleKey, forceRefresh: true }).subscribe();
  }

  private loadNavigation(
    scope: NavigationScope,
    options?: { moduleKey?: string; format?: 'tree' | 'flat'; version?: string; forceRefresh?: boolean }
  ): Observable<MenuItem[]> {
    const version = options?.version ?? 'v1';
    const format = options?.format ?? 'tree';
    const moduleKey = options?.moduleKey;
    const targetCache =
      scope === 'global'
        ? this._modules
        : this.resolveModuleSubject(moduleKey ?? 'default-module-cache');

    if (!options?.forceRefresh && targetCache.value) {
      return of(targetCache.value);
    }

    let params = new HttpParams().set('scope', scope).set('format', format);
    if (scope === 'module' && moduleKey) {
      params = params.set('moduleKey', moduleKey);
    }

    const endpoint = `${API_URI_CONFIG}/${version}/navigations`;

    return this.httpClient
      .get<ApiResponse<NavigationApiItem[]> | ApiSingleResponse<any> | NavigationApiItem[]>(
        endpoint,
        {
          params,
        }
      )
      .pipe(
        map((response) => this.mapResponseToMenuItems(response, scope, moduleKey, format)),
        tap((items) => targetCache.next(items)),
        catchError((error) => {
          if (isDevMode()) {
            const fallback = this.mapResponseToMenuItems(
              this.createDevNavigation(),
              scope,
              moduleKey,
              'tree'
            );
            targetCache.next(fallback);
            return of(fallback);
          }
          throw error;
        })
      );
  }

  private mapResponseToMenuItems(
    response: ApiResponse<NavigationApiItem[]> | ApiSingleResponse<any> | NavigationApiItem[],
    scope: NavigationScope,
    moduleKey?: string,
    format: 'tree' | 'flat' = 'tree'
  ): MenuItem[] {
    const items = this.filterByPermissions(
      this.normalizeToTree(this.extractNavigationItems(response), format)
    );
    return items.map((item) => this.mapNavigationItem(item, scope, moduleKey));
  }

  private extractNavigationItems(
    response: ApiResponse<NavigationApiItem[]> | ApiSingleResponse<any> | NavigationApiItem[]
  ): NavigationApiItem[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (isApiResponse(response)) {
      const data = unwrap(response as ApiResponse<any>);
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.items) {
        return data.items;
      }
      if (data?.item?.items) {
        return data.item.items;
      }
    }

    if ((response as ApiSingleResponse<any>)?.data?.item?.items) {
      return (response as ApiSingleResponse<any>).data?.item?.items ?? [];
    }

    console.warn('NavigationService: Unable to extract navigation items, returning empty array');
    return [];
  }

  private normalizeToTree(items: NavigationApiItem[], format: 'tree' | 'flat'): NavigationApiItem[] {
    if (format === 'tree') {
      return items;
    }

    const hasNestedItems = items.some((item) => item.items?.length);
    if (hasNestedItems) {
      return items;
    }

    const byId = new Map<string, NavigationApiItem>();
    const roots: NavigationApiItem[] = [];

    items.forEach((item) => {
      if (item.id) {
        byId.set(item.id, { ...item, items: [] });
      }
    });

    items.forEach((item) => {
      const parentId = item.parentId;
      if (parentId && byId.has(parentId)) {
        const parent = byId.get(parentId)!;
        parent.items = parent.items || [];
        parent.items.push({ ...item, items: [] });
      } else if (item.id) {
        roots.push(byId.get(item.id)!);
      }
    });

    return roots.length ? roots : items;
  }

  private mapNavigationItem(
    item: NavigationApiItem,
    scope: NavigationScope,
    moduleKey?: string
  ): MenuItem {
    const normalizedRouterLink = Array.isArray(item.routerLink)
      ? item.routerLink
      : item.routerLink
        ? [item.routerLink]
        : undefined;

    const badgeValue = item.badge;
    const mapped: MenuItem = {
      id: this.buildItemId(scope, item, moduleKey),
      label: item.label,
      icon: item.icon,
      routerLink: normalizedRouterLink,
      url: item.url,
      target: item.target,
      disabled: item.disabled,
      badge:
        typeof badgeValue === 'string' || typeof badgeValue === 'number'
          ? String(badgeValue)
          : undefined,
      badgeStyleClass: item.badgeClass,
      tooltip: item.tooltip,
      styleClass: item.class,
      items: item.items?.map((child) => this.mapNavigationItem(child, scope, moduleKey)),
      automationId: this.buildAutomationId(scope, item, moduleKey),
      state: {
        scope,
        moduleKey,
        navigationId: item.id,
        original: item,
      },
    };

    return mapped;
  }

  private filterByPermissions(items: NavigationApiItem[]): NavigationApiItem[] {
    return items
      .filter((item) => this.hasPermission(item))
      .map((item) => ({
        ...item,
        items: item.items ? this.filterByPermissions(item.items) : undefined,
      }));
  }

  private hasPermission(item: NavigationApiItem): boolean {
    if (!item.permissions) {
      return true;
    }

    const { include, exclude } = item.permissions;
    if (include?.length) {
      const hasInclude = include.some((permission) => this.currentPermissions.has(permission));
      if (!hasInclude) {
        return false;
      }
    }

    if (exclude?.length) {
      const hasExcluded = exclude.some((permission) => this.currentPermissions.has(permission));
      if (hasExcluded) {
        return false;
      }
    }

    return true;
  }

  private buildItemId(scope: NavigationScope, item: NavigationApiItem, moduleKey?: string): string {
    const slug = (item.id || item.label || 'nav-item').toString();
    const normalized = slug
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    return moduleKey
      ? `navigation-${scope}-${moduleKey}-${normalized}`
      : `navigation-${scope}-${normalized}`;
  }

  private buildAutomationId(
    scope: NavigationScope,
    item: NavigationApiItem,
    moduleKey?: string
  ): string {
    return `${this.buildItemId(scope, item, moduleKey)}-automation`;
  }

  private resolveModuleSubject(moduleKey: string): BehaviorSubject<MenuItem[] | null> {
    if (!this._items.has(moduleKey)) {
      this._items.set(moduleKey, new BehaviorSubject<MenuItem[] | null>(null));
    }
    return this._items.get(moduleKey)!;
  }

  private createDevNavigation(): NavigationApiItem[] {
    return [
      {
        id: 'dashboard',
        label: 'navigation.dashboard',
        icon: 'pi pi-home',
        routerLink: ['/dashboard'],
        scope: 'global',
      },
      {
        id: 'management',
        label: 'navigation.management',
        icon: 'pi pi-briefcase',
        routerLink: ['/modules/management'],
        scope: 'global',
      },
      {
        id: 'organization',
        label: 'navigation.organization',
        icon: 'pi pi-building',
        routerLink: ['/modules/organization'],
        scope: 'global',
      },
    ];
  }
}
