# Private Layout System

A comprehensive layout system for the private area of the Open ERP Web application, featuring both horizontal and vertical layout variants with responsive design, accessibility features, and dynamic menu management.

## Features

- **Two Layout Variants**:
  - **Vertical Layout**: Side menu (collapsible) + content area + chat panel (right)
  - **Horizontal Layout**: Sticky top menu + content area + chat panel (right)
- **Responsive Design**: Optimized layouts for desktop and mobile
- **Mobile Experience**: Bottom tab bar with full-screen menu grid and search functionality
- **Dynamic Menu**: Menu items loaded from API with permission-based filtering
- **Lazy Loading**: Chat panel is lazy-loaded to optimize initial bundle size
- **Accessibility**: WCAG AA compliant with keyboard navigation, focus management, and ARIA labels
- **Built with**: Angular 21, Tailwind CSS, and PrimeNG

## Architecture

### Components

```
src/core/layout/
├── layout.ts                 # Main layout switcher component
├── layout.html              # Main layout template
├── layout.types.ts          # TypeScript types and interfaces
├── layout.service.ts        # Layout state management service
├── horizontal/
│   ├── horizontal.ts        # Horizontal layout component
│   └── horizontal.html      # Horizontal layout template
├── vertical/
│   ├── vertical.ts          # Vertical layout component
│   └── vertical.html        # Vertical layout template
├── menu/
│   ├── side-menu.ts         # Side menu for vertical layout
│   ├── top-menu.ts          # Top menu for horizontal layout
│   └── mobile-menu.ts       # Mobile full-screen menu with grid
└── chat/
    └── chat.ts              # Chat panel component (lazy-loaded)
```

## Usage

### Basic Usage

#### In Route Configuration

```typescript
import { Routes } from '@angular/router';
import { Layout } from '../core/layout/layout';

export const routes: Routes = [
  {
    path: 'app',
    component: Layout,
    data: { layoutType: 'vertical' }, // or 'horizontal'
    children: [
      // Your feature routes here
      { path: 'dashboard', component: DashboardComponent },
      { path: 'settings', component: SettingsComponent },
    ],
  },
];
```

#### As a Standalone Component

```typescript
import { Layout } from '../core/layout/layout';

@Component({
  template: `<app-layout [layoutType]="'horizontal'" />`,
  imports: [Layout],
})
export class MyComponent {}
```

### Configuration

The layout can be configured through the `PrivateLayoutService`:

```typescript
import { inject } from '@angular/core';
import { PrivateLayoutService } from '../core/layout/layout.service';

export class MyComponent {
  private layoutService = inject(PrivateLayoutService);

  ngOnInit() {
    // Initialize with custom configuration
    this.layoutService.initialize({
      layoutType: 'vertical',
      menuCollapsible: true,
      chatCollapsible: true,
      menuInitiallyCollapsed: false,
      chatInitiallyCollapsed: true,
    });

    // Load menu data from API
    this.layoutService.loadMenuData('/api/v1/menu').subscribe();
  }
}
```

## Menu API Contract

### API Endpoint

**GET** `/api/v1/menu`

### Request Headers

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Response Format

```typescript
{
  "items": [
    {
      "id": "dashboard",
      "label": "Dashboard",
      "icon": "pi pi-home",
      "routerLink": "/dashboard",
      "visible": true,
      "disabled": false
    },
    {
      "id": "sales",
      "label": "Sales",
      "icon": "pi pi-shopping-cart",
      "visible": true,
      "items": [
        {
          "id": "sales-orders",
          "label": "Orders",
          "icon": "pi pi-list",
          "routerLink": "/sales/orders",
          "visible": true
        },
        {
          "id": "sales-invoices",
          "label": "Invoices",
          "icon": "pi pi-file",
          "routerLink": "/sales/invoices",
          "visible": true,
          "badge": "3",
          "badgeSeverity": "info"
        }
      ]
    }
  ]
}
```

### MenuItem Interface

```typescript
interface MenuItem {
  id: string;                // Unique identifier
  label: string;             // Display label
  icon?: string;             // PrimeIcons class (e.g., 'pi pi-home')
  routerLink?: string;       // Angular router link
  url?: string;              // External URL
  items?: MenuItem[];        // Nested menu items
  disabled?: boolean;        // Whether item is disabled
  visible?: boolean;         // Whether item is visible (default: true)
  badge?: string;            // Badge text to display
  badgeSeverity?: 'success' | 'info' | 'warn' | 'danger'; // Badge color
  command?: () => void;      // Custom click handler
}
```

### Icons

Use [PrimeIcons](https://primeng.org/icons) for menu icons:

- `pi pi-home` - Home/Dashboard
- `pi pi-shopping-cart` - Sales
- `pi pi-box` - Inventory
- `pi pi-chart-line` - Analytics
- `pi pi-users` - Users/HR
- `pi pi-cog` - Settings

## Layout Behavior

### Desktop - Vertical Layout

```
┌──────────┬──────────────────────┬──────────┐
│          │                      │          │
│   Menu   │      Content         │   Chat   │
│  (side)  │      (scroll)        │ (panel)  │
│          │                      │          │
└──────────┴──────────────────────┴──────────┘
```

- Left menu: Collapsible (64px collapsed, 256px expanded)
- Center content: Full height with inner scroll
- Right chat: Collapsible panel (320px width)

### Desktop - Horizontal Layout

```
┌─────────────────────────────────────────────┐
│              Menu (sticky top)              │
├────────────────────────────────┬────────────┤
│                                │            │
│         Content (scroll)       │    Chat    │
│                                │  (panel)   │
└────────────────────────────────┴────────────┘
```

- Top menu: Sticky header
- Center content: Full height with inner scroll
- Right chat: Collapsible panel (320px width)

### Mobile - Both Layouts

```
┌─────────────────────────────────────────────┐
│                                             │
│            Content (scroll)                 │
│                                             │
├─────────────────────────────────────────────┤
│  [Menu]  [Content]  [Chat]                  │
└─────────────────────────────────────────────┘
```

- Bottom tab bar with 3 tabs
- Menu opens full-screen grid with search
- Chat opens full-screen panel
- Content tab shows current view

## Accessibility Features

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and links
- **Escape**: Close dialogs and mobile menus
- **Arrow Keys**: Navigate within menus

### Screen Reader Support

- All interactive elements have `aria-label` attributes
- Menu states are indicated with `aria-expanded`
- Current page is marked with `aria-current="page"`
- Dialog roles and labels are properly set

### Focus Management

- Focus is trapped within mobile menu dialog when open
- Focus is returned to trigger button when dialog closes
- Focus indicators are visible for keyboard navigation

### Color Contrast

- All text meets WCAG AA contrast requirements (4.5:1 for normal text)
- Interactive elements have sufficient contrast in all states
- Color is not the only means of conveying information

## Performance Optimization

### Lazy Loading

The chat panel component is lazy-loaded only when first opened:

```typescript
// In layout components
private async loadChatComponent() {
  const { ChatPanel } = await import('../chat/chat');
  // Component is loaded on demand
}
```

### Bundle Size

- Menu components use PrimeNG's tree-shakeable modules
- Only required PrimeNG components are imported
- Tailwind CSS purges unused styles in production

## Development and Testing

### Running Demo Pages

1. Start the development server:
```bash
npm start
```

2. Navigate to demo routes:
   - Vertical layout: `http://localhost:4200/demo/vertical`
   - Horizontal layout: `http://localhost:4200/demo/horizontal`

### Using Mock Data

For development and testing, use mock menu data:

```typescript
import { inject } from '@angular/core';
import { PrivateLayoutService } from '../core/layout/layout.service';

export class MyComponent {
  private layoutService = inject(PrivateLayoutService);

  ngOnInit() {
    // Use mock data instead of API
    const mockMenu = this.layoutService.getMockMenuData();
    this.layoutService.setMenuData(mockMenu);
  }
}
```

### Testing Responsive Behavior

Use browser DevTools to test different viewports:

- **Desktop**: 1920x1080, 1366x768
- **Tablet**: 768x1024 (iPad)
- **Mobile**: 375x667 (iPhone SE), 414x896 (iPhone 11 Pro Max)

## Customization

### Styling

The layout uses Tailwind CSS utility classes. To customize:

1. **Colors**: Modify PrimeNG theme preset in `app.config.ts`
2. **Spacing**: Update Tailwind spacing utilities in templates
3. **Menu Width**: Change `w-64` (256px) in vertical layout
4. **Chat Width**: Change `w-80` (320px) in both layouts

### Menu Behavior

Customize menu behavior through service signals:

```typescript
// Toggle menu programmatically
layoutService.toggleMenu();

// Open/close chat
layoutService.openChat();
layoutService.closeChat();

// Access state
const isMenuCollapsed = layoutService.menuCollapsed();
const chatState = layoutService.chatState();
```

## Troubleshooting

### Menu Not Loading

- Check API endpoint URL in service
- Verify authentication token is present
- Check browser console for errors
- Use mock data for testing: `layoutService.setMenuData(mockData)`

### Layout Not Switching

- Verify `layoutType` is set correctly in route data
- Check that `PrivateLayoutService.initialize()` is called
- Inspect layout config: `layoutService.layoutConfig()`

### Chat Not Loading

- Check browser console for lazy loading errors
- Verify chat component path is correct
- Ensure ViewContainerRef is available

### Accessibility Issues

- Run axe DevTools to check for violations
- Test keyboard navigation manually
- Verify ARIA attributes are present
- Check color contrast with browser tools

## Migration Guide

### From Existing Layout

If you have an existing layout system:

1. **Backup**: Create a backup of current layout files
2. **Routes**: Update route configuration to use new Layout component
3. **Menu Data**: Adapt existing menu data to MenuItem interface
4. **State**: Migrate state management to PrivateLayoutService
5. **Styling**: Update custom styles to use Tailwind utilities

### Breaking Changes

This is a new implementation with no breaking changes. However:

- Old layout components will need to be migrated
- Menu API contract must match the documented format
- Existing routing structure may need updates

## Support and Contributing

### Reporting Issues

Please report issues with:
- Layout variant (horizontal/vertical)
- Browser and version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

### Future Enhancements

Planned features:
- Customizable themes
- Layout persistence across sessions
- More menu visualization options
- Enhanced chat functionality
- Real-time notifications

## License

This layout system is part of the Open ERP Web application and follows the same license.
