# Province Management Module - Layout Documentation

## Overview
This document describes the implementation of the Province Management module for Open ERP Web, featuring a hierarchical tree-based interface for managing Vietnamese administrative divisions (Provinces/Cities → Districts → Wards) with integrated map visualization.

**⚠️ Major Update**: The module now uses TreeTable for hierarchical data display instead of a flat table. See [TREETABLE_IMPLEMENTATION.md](./TREETABLE_IMPLEMENTATION.md) for detailed technical documentation.

## Access URL
```
/private/modules/management/province
```

Default route redirects to:
```
/private/modules/management/province/all/1/10
```

## Desktop Layout (≥768px)

### Structure
```
┌─────────────────────────────────────────────────────────┐
│  TOOLBAR                                                │
│  [Search Input] [Add] [Actions ▼]                      │
├─────────────────┬───────────────────────────────────────┤
│                 │                                       │
│   TREE TABLE    │         MAP                           │
│   (50%)         │      (OpenStreetMap)                  │
│                 │                                       │
│  ▼ Hà Nội       │   Selected entity geometry            │
│    ├─ Ba Đình   │   displayed with blue polygon         │
│    └─ Hoàn Kiếm │                                       │
│  ▶ Hồ Chí Minh  │   Auto-zoom to bounds                 │
│  ▶ Đà Nẵng      │                                       │
│                 │                                       │
│  [Pagination]   │                                       │
└─────────────────┴───────────────────────────────────────┘
```

### Components

#### Toolbar
- **Search Input**: Filter entities by name, code, or region
- **Add Button** (Plus icon): Opens drawer to create new province
- **Actions Menu** (Ellipsis): 
  - Export to CSV
  - Export to GeoJSON
  - Import Provinces
  - Expand All (future)
  - Collapse All (future)

#### Administrative Tree (Left Pane)
- **TreeTable Component**: Hierarchical display of administrative divisions
- **Columns**:
  - Name (with expand/collapse toggle)
  - Code (e.g., HN, HCM, BD)
  - Type (Province/District/Ward)
  - Actions (context menu button)

- **Hierarchy Levels**:
  1. **Provinces** (Root level) - e.g., Hà Nội, Hồ Chí Minh
  2. **Districts** (Level 1) - e.g., Ba Đình, Quận 1 (optional in 2-tier system)
  3. **Wards** (Level 2) - e.g., Phường Điện Biên, Phường Bến Nghé

- **Interactions**:
  - Click row: Select entity and show on map
  - Click expand icon: Load children (lazy loading)
  - Right-click row: Show context menu
  - Click action button: Show menu for that row

- **Lazy Loading**:
  - Children loaded on-demand when parent node is expanded
  - Loading spinner shown during data fetch
  - Reduces initial page load time

- **Context Menu Actions** (vary by entity type):
  - **Province**: View, Edit, Create District, Delete
  - **District**: View, Edit, Create Ward, Delete
  - **Ward**: View, Edit, Delete

- **Pagination**: PrimeNG paginator at bottom (for root-level provinces)
  - Options: 10, 20, 50, 100 items per page
  - Shows: "Showing X to Y of Z items"

#### Map (Right Pane)
- **Base Layer**: OpenStreetMap tiles
- **Features**:
  - Shows selected entity geometry as blue polygon
  - Supports Province, District, and Ward geometries
  - Auto-zooms to fit polygon bounds
  - Default center: Vietnam (15.9749°N, 108.2515°E)
  - Zoom controls included

## Mobile Layout (<768px)

### Structure
```
┌─────────────────────────────┐
│  TOOLBAR (compact)          │
│  [🔍] [🔄] [+] [⋮]         │
├─────────────────────────────┤
│                             │
│  ENTITY CARDS (Flat List)   │
│                             │
│  ┌─────────────────────┐   │
│  │ Hà Nội          HN  │   │
│  │ [Province]         ⋮│   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ Ba Đình         BD  │   │
│  │ [District]         ⋮│   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ Điện Biên       DB  │   │
│  │ [Ward]             ⋮│   │
│  └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│  PAGINATION                 │
│  [◀] Page 1/10 [10▼] [▶]  │
└─────────────────────────────┘
```

### Mobile Features
- **Collapsible Search**: Tap search icon to expand full-width search input
- **Card Layout**: Each entity shown as a card with:
  - Entity name (bold)
  - Code (top-right)
  - Type badge (Province/District/Ward with colored background)
  - Region (for provinces only)
  - Action menu button (⋮)
- **Flat List View**: Shows all entities in a single list (not hierarchical tree)
  - Includes provinces, districts, and wards
  - Type badge clearly indicates entity level
- **Touch Targets**: All buttons minimum 44x44px
- **Pagination**: Compact mobile version with prev/next buttons

## Form/Drawer (Add/Edit Province)

### Desktop Drawer
```
                    ┌──────────────────────┐
                    │  Add/Edit Province   │
                    ├──────────────────────┤
                    │                      │
                    │  Code: [_______]     │
                    │  Name: [_______]     │
                    │  Region: [______]    │
                    │                      │
                    │  Geometry (GeoJSON)  │
                    │  ┌────────────────┐  │
                    │  │ {              │  │
                    │  │   "type": ...  │  │
                    │  │ }              │  │
                    │  └────────────────┘  │
                    │  [Apply] [Clear]     │
                    │                      │
                    │  Map Preview         │
                    │  ┌────────────────┐  │
                    │  │    [Map]       │  │
                    │  └────────────────┘  │
                    │                      │
                    │  [Cancel] [Save]     │
                    └──────────────────────┘
```

### Form Fields
1. **Code** (Required, min 2 chars)
   - Example: HN, HCM, DN
   - ID: `province-form-code`

2. **Name** (Required, min 2 chars)
   - Example: Hà Nội, Hồ Chí Minh
   - ID: `province-form-name`

3. **Region** (Required)
   - Example: North, Central, South
   - ID: `province-form-region`

4. **Geometry Editor**
   - Text area for GeoJSON input
   - Validates JSON format
   - Checks for required fields (type, coordinates)
   - Shows error messages for invalid input
   - IDs: `geo-editor-textarea`, `geo-editor-apply-button`, `geo-editor-clear-button`

5. **Map Preview**
   - Live preview of the geometry
   - Auto-updates when GeoJSON is applied
   - Shows polygon in blue

### Mobile Drawer
- Full-screen modal on mobile
- Same fields and functionality
- Scrollable content area
- Fixed header and footer

## Key IDs for Testing/Accessibility

### Desktop Toolbar
- `province-list-toolbar`
- `province-list-search`
- `province-list-add-button`
- `province-list-actions-button`
- `province-list-actions-menu`

### Mobile Toolbar
- `province-list-toolbar-mobile`
- `province-list-search-button-mobile`
- `province-list-add-button-mobile`
- `province-list-actions-button-mobile`
- `province-list-refresh-button-mobile`

### List/Table
- `province-list-table` (desktop)
- `province-list-row-{id}` (individual rows)
- `province-list-mobile` (mobile)
- `province-list-item-{id}` (mobile cards)

### Map
- `province-list-map`
- `core-map-container`

### Form
- `province-form-drawer`
- `province-form-code`
- `province-form-name`
- `province-form-region`
- `province-form-submit-button`
- `province-form-cancel-button`

### Pagination
- `province-list-pagination` (desktop)
- `province-list-pagination-mobile`
- `province-list-pagination-prev-mobile`
- `province-list-pagination-next-mobile`

## Backend Integration

### Data Model Updates

**⚠️ Breaking Change**: The Province interface now includes a `scope` field to support hierarchical data:

```typescript
interface Province {
  id: string;
  code: string;
  name: string;
  region: string;
  scope: 'province';  // NEW: Required field
  geometry?: GeoJSON.Geometry;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface District {
  id: string;
  code: string;
  name: string;
  parentCode: string;  // Reference to Province code
  scope: 'district';
  type?: string;  // e.g., "Urban District", "Rural District"
  geometry?: GeoJSON.Geometry;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface Ward {
  id: string;
  code: string;
  name: string;
  parentCode: string;  // Reference to District or Province code
  scope: 'ward';
  type?: string;  // e.g., "Ward", "Commune", "Town"
  geometry?: GeoJSON.Geometry;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}
```

**Note**: The frontend automatically adds the `scope` field for backward compatibility if the backend doesn't provide it.

### API Endpoints (Common Service - Port 3006)

```typescript
GET    /v1/provinces              // List with pagination/search
GET    /v1/provinces/:id          // Get single province
POST   /v1/provinces              // Create province
PATCH  /v1/provinces/:id          // Update province
DELETE /v1/provinces/:id          // Delete province
POST   /v1/provinces/export/csv   // Export CSV
POST   /v1/provinces/export/geojson // Export GeoJSON
POST   /v1/provinces/import       // Import from file
```

### Data Model
```typescript
interface Province {
  id: string;
  code: string;              // e.g., "HN", "HCM"
  name: string;              // e.g., "Hà Nội"
  region: string;            // e.g., "North"
  geometry?: GeoJSON.Geometry; // GeoJSON polygon
  meta?: Record<string, any>;  // Additional metadata
  createdAt?: string;
  updatedAt?: string;
}
```

## Internationalization

### Supported Languages
- English (en)
- Vietnamese (vi)

### Translation Keys
All keys are under `provinceList.*` and `provinceForm.*` namespaces:

```
provinceList.title
provinceList.search.placeholder
provinceList.addButton.tooltip
provinceList.table.code/name/region
provinceList.messages.loading/noResults/etc
provinceForm.title.create/edit
provinceForm.fields.code.label
provinceForm.buttons.create/update/cancel
```

## Features Implemented

### CRUD Operations
- ✅ Create new province
- ✅ Read/List provinces with pagination
- ✅ Update existing province
- ✅ Delete province (with confirmation)

### Search & Filter
- ✅ Search by name, code, region
- ✅ Debounced search via URL navigation
- ✅ Clear search functionality

### Map Integration
- ✅ Leaflet 1.9.4 integration
- ✅ OpenStreetMap tiles
- ✅ GeoJSON polygon rendering
- ✅ Auto-zoom to bounds
- ✅ Select province to show on map

### Import/Export
- ✅ Export to CSV
- ✅ Export to GeoJSON
- ✅ Import placeholder (UI ready)

### Responsive Design
- ✅ Desktop split-pane layout
- ✅ Mobile single-column layout
- ✅ Drawer becomes full-screen modal on mobile
- ✅ Touch-optimized buttons (44px minimum)

### Accessibility
- ✅ All interactive elements have unique IDs
- ✅ ARIA labels on all inputs and buttons
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Focus management in drawer

## Technical Stack

- **Framework**: Angular 21
- **UI Library**: PrimeNG 21
- **Styling**: Tailwind CSS 4
- **Maps**: Leaflet 1.9.4
- **i18n**: Transloco
- **State**: Angular Signals
- **Forms**: Reactive Forms

## Future Enhancements

1. **Import Functionality**: Complete file upload and parsing logic
2. **Advanced Map Tools**: Draw/edit polygons directly on map
3. **Bulk Operations**: Multi-select and bulk delete/export
4. **Filters**: Additional filters by region, creation date, etc.
5. **Map Layers**: Toggle different map styles/layers
6. **Offline Support**: Cache province data for offline viewing
