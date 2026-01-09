/**
 * Navigation Item DTO matching backend MenuItem structure
 * Represents a single navigation menu item with all its properties
 */
export interface NavigationItemDto {
  id: string;
  label: string;
  icon?: string;
  subtitle?: string;
  routerLink?: string | string[];
  url?: string;
  permissions?: {
    include?: string[];
    exclude?: string[];
  };
  command?: string;
  items?: NavigationItemDto[];
  disabled?: boolean;
  target?: string;
  badge?: string | number;
  badgeClass?: string;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  shortcut?: string;
  class?: string;
  order: number;
  scope: 'global' | 'module';
  moduleKey?: string;
  meta?: Record<string, any>;
  visible?: boolean;
  separator?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Request DTO for creating a new navigation item
 */
export interface CreateNavigationItemDto {
  label: string;
  icon?: string;
  subtitle?: string;
  routerLink?: string | string[];
  url?: string;
  permissions?: {
    include?: string[];
    exclude?: string[];
  };
  command?: string;
  parentId?: string;
  disabled?: boolean;
  target?: string;
  badge?: string | number;
  badgeClass?: string;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  shortcut?: string;
  class?: string;
  order?: number;
  scope: 'global' | 'module';
  moduleKey?: string;
  meta?: Record<string, any>;
  visible?: boolean;
  separator?: boolean;
}

/**
 * Request DTO for updating an existing navigation item
 */
export interface UpdateNavigationItemDto {
  label?: string;
  icon?: string;
  subtitle?: string;
  routerLink?: string | string[];
  url?: string;
  permissions?: {
    include?: string[];
    exclude?: string[];
  };
  command?: string;
  parentId?: string | null;
  disabled?: boolean;
  target?: string;
  badge?: string | number;
  badgeClass?: string;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  shortcut?: string;
  class?: string;
  order?: number;
  scope?: 'global' | 'module';
  moduleKey?: string;
  meta?: Record<string, any>;
  visible?: boolean;
  separator?: boolean;
}

/**
 * Response DTO for navigation list queries
 */
export interface NavigationListResponse {
  items: NavigationItemDto[];
  scope: 'global' | 'module';
  total: number;
}

/**
 * Request DTO for reordering navigation items
 */
export interface ReorderNavigationItemDto {
  id: string;
  newOrder: number;
  newParentId?: string | null;
}

/**
 * Request DTO for moving a navigation item
 */
export interface MoveNavigationItemDto {
  id: string;
  targetParentId: string | null;
  targetOrder: number;
  targetScope?: 'global' | 'module';
  targetModuleKey?: string;
}

/**
 * Query parameters for getting navigation items
 */
export interface GetNavigationParams {
  scope?: 'global' | 'module';
  moduleKey?: string;
  includeHidden?: boolean;
}

/**
 * Permission set for testing navigation visibility
 */
export interface PermissionSet {
  permissions: string[];
}
