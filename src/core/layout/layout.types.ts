/**
 * Layout types and interfaces for the private layout system
 */

/**
 * Layout type configuration
 */
export type LayoutType = 'horizontal' | 'vertical';

/**
 * Menu item representing a navigation element
 */
export interface MenuItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Display label */
  label: string;
  /** Icon class (e.g., PrimeIcons) */
  icon?: string;
  /** Router link */
  routerLink?: string;
  /** External URL */
  url?: string;
  /** Child menu items for nested navigation */
  items?: MenuItem[];
  /** Whether the item is enabled/disabled based on permissions */
  disabled?: boolean;
  /** Badge value to display */
  badge?: string;
  /** Badge severity */
  badgeSeverity?: 'success' | 'info' | 'warn' | 'danger';
  /** Whether the item is visible */
  visible?: boolean;
  /** Command handler */
  command?: (event?: any) => void;
}

/**
 * API response for menu data
 */
export interface MenuApiResponse {
  items: MenuItem[];
}

/**
 * Chat panel state
 */
export interface ChatState {
  isOpen: boolean;
  isLoaded: boolean;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  /** Layout type to use */
  layoutType: LayoutType;
  /** Whether menu is collapsible on desktop */
  menuCollapsible?: boolean;
  /** Whether chat panel is collapsible */
  chatCollapsible?: boolean;
  /** Initial menu collapsed state */
  menuInitiallyCollapsed?: boolean;
  /** Initial chat collapsed state */
  chatInitiallyCollapsed?: boolean;
}
