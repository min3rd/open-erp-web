import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import type { MenuItem, MenuApiResponse, LayoutConfig, LayoutType, ChatState } from './layout.types';

/**
 * Service for managing private layout state and menu data
 */
@Injectable({
  providedIn: 'root',
})
export class PrivateLayoutService {
  private http = inject(HttpClient);

  // Menu state
  private menuDataSignal = signal<MenuItem[]>([]);
  private menuLoadingSignal = signal<boolean>(false);
  private menuErrorSignal = signal<string | null>(null);

  // Layout configuration state
  private layoutConfigSignal = signal<LayoutConfig>({
    layoutType: 'vertical',
    menuCollapsible: true,
    chatCollapsible: true,
    menuInitiallyCollapsed: false,
    chatInitiallyCollapsed: true,
  });

  // UI state
  private menuCollapsedSignal = signal<boolean>(false);
  private chatStateSignal = signal<ChatState>({ isOpen: false, isLoaded: false });
  private mobileMenuOpenSignal = signal<boolean>(false);

  // Public computed signals
  readonly menuData = computed(() => this.menuDataSignal());
  readonly menuLoading = computed(() => this.menuLoadingSignal());
  readonly menuError = computed(() => this.menuErrorSignal());
  readonly layoutConfig = computed(() => this.layoutConfigSignal());
  readonly menuCollapsed = computed(() => this.menuCollapsedSignal());
  readonly chatState = computed(() => this.chatStateSignal());
  readonly mobileMenuOpen = computed(() => this.mobileMenuOpenSignal());

  /**
   * Initialize the layout service with configuration
   */
  initialize(config?: Partial<LayoutConfig>): void {
    if (config) {
      this.layoutConfigSignal.update((current) => ({ ...current, ...config }));
    }
    
    // Set initial collapsed states
    const finalConfig = this.layoutConfigSignal();
    this.menuCollapsedSignal.set(finalConfig.menuInitiallyCollapsed ?? false);
    this.chatStateSignal.set({
      isOpen: !finalConfig.chatInitiallyCollapsed,
      isLoaded: false,
    });
  }

  /**
   * Load menu data from API
   */
  loadMenuData(apiEndpoint: string = '/api/v1/menu'): Observable<MenuItem[]> {
    this.menuLoadingSignal.set(true);
    this.menuErrorSignal.set(null);

    return this.http.get<MenuApiResponse>(apiEndpoint).pipe(
      map((response) => {
        const items = this.filterVisibleItems(response.items);
        this.menuDataSignal.set(items);
        this.menuLoadingSignal.set(false);
        return items;
      }),
      catchError((error) => {
        console.error('Failed to load menu data:', error);
        this.menuErrorSignal.set('Failed to load menu data');
        this.menuLoadingSignal.set(false);
        return of([]);
      })
    );
  }

  /**
   * Set menu data directly (for testing or static menus)
   */
  setMenuData(items: MenuItem[]): void {
    this.menuDataSignal.set(this.filterVisibleItems(items));
  }

  /**
   * Toggle menu collapsed state
   */
  toggleMenu(): void {
    this.menuCollapsedSignal.update((collapsed) => !collapsed);
  }

  /**
   * Toggle mobile menu open state
   */
  toggleMobileMenu(): void {
    this.mobileMenuOpenSignal.update((open) => !open);
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.mobileMenuOpenSignal.set(false);
  }

  /**
   * Toggle chat panel
   */
  toggleChat(): void {
    this.chatStateSignal.update((state) => ({
      isOpen: !state.isOpen,
      isLoaded: state.isLoaded || !state.isOpen, // Mark as loaded when opening for first time
    }));
  }

  /**
   * Open chat panel
   */
  openChat(): void {
    this.chatStateSignal.update((state) => ({
      isOpen: true,
      isLoaded: true,
    }));
  }

  /**
   * Close chat panel
   */
  closeChat(): void {
    this.chatStateSignal.update((state) => ({
      ...state,
      isOpen: false,
    }));
  }

  /**
   * Update layout type
   */
  setLayoutType(layoutType: LayoutType): void {
    this.layoutConfigSignal.update((config) => ({ ...config, layoutType }));
  }

  /**
   * Filter menu items to show only visible and enabled items
   */
  private filterVisibleItems(items: MenuItem[]): MenuItem[] {
    return items
      .filter((item) => item.visible !== false)
      .map((item) => ({
        ...item,
        items: item.items ? this.filterVisibleItems(item.items) : undefined,
      }));
  }

  /**
   * Get mock menu data for development/testing
   */
  getMockMenuData(): MenuItem[] {
    return [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: '/dashboard',
        visible: true,
      },
      {
        id: 'sales',
        label: 'Sales',
        icon: 'pi pi-shopping-cart',
        visible: true,
        items: [
          {
            id: 'sales-orders',
            label: 'Orders',
            icon: 'pi pi-list',
            routerLink: '/sales/orders',
            visible: true,
          },
          {
            id: 'sales-invoices',
            label: 'Invoices',
            icon: 'pi pi-file',
            routerLink: '/sales/invoices',
            visible: true,
          },
          {
            id: 'sales-customers',
            label: 'Customers',
            icon: 'pi pi-users',
            routerLink: '/sales/customers',
            visible: true,
          },
        ],
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: 'pi pi-box',
        visible: true,
        items: [
          {
            id: 'inventory-products',
            label: 'Products',
            icon: 'pi pi-tag',
            routerLink: '/inventory/products',
            visible: true,
          },
          {
            id: 'inventory-warehouses',
            label: 'Warehouses',
            icon: 'pi pi-building',
            routerLink: '/inventory/warehouses',
            visible: true,
          },
        ],
      },
      {
        id: 'accounting',
        label: 'Accounting',
        icon: 'pi pi-chart-line',
        routerLink: '/accounting',
        visible: true,
        badge: '3',
        badgeSeverity: 'info',
      },
      {
        id: 'hr',
        label: 'Human Resources',
        icon: 'pi pi-users',
        visible: true,
        items: [
          {
            id: 'hr-employees',
            label: 'Employees',
            icon: 'pi pi-user',
            routerLink: '/hr/employees',
            visible: true,
          },
          {
            id: 'hr-attendance',
            label: 'Attendance',
            icon: 'pi pi-calendar',
            routerLink: '/hr/attendance',
            visible: true,
          },
          {
            id: 'hr-payroll',
            label: 'Payroll',
            icon: 'pi pi-money-bill',
            routerLink: '/hr/payroll',
            visible: true,
          },
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'pi pi-cog',
        routerLink: '/settings',
        visible: true,
      },
    ];
  }
}
