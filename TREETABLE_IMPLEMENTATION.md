# TreeTable Implementation for Province/District/Ward Management

## Overview
This document describes the implementation of hierarchical administrative division management using PrimeNG TreeTable component. The module now supports three levels:
- **Province** (Tỉnh/Thành) - Root level
- **District** (Quận/Huyện) - Level 1 (optional in Vietnam's 2-tier system)
- **Ward** (Phường/Xã) - Level 2

## Key Features

### 1. Hierarchical Data Structure
- TreeTable displays provinces at the root level
- Lazy loading of districts when expanding a province
- Lazy loading of wards when expanding a district
- Visual indication of entity type (Province/District/Ward)

### 2. CRUD Operations
- **Create**: Add new provinces, districts, or wards
- **Read**: View details of any entity level
- **Update**: Edit any entity level
- **Delete**: Remove entities (with cascade warning for entities with children)

### 3. Context Menu Actions
Context-sensitive actions based on entity type:

**Province:**
- View
- Edit
- Create District
- Delete

**District:**
- View
- Edit
- Create Ward
- Delete

**Ward:**
- View
- Edit
- Delete

### 4. Mobile Support
- On mobile devices, the tree is displayed as a flat list
- Each item shows its scope (Province/District/Ward) with a badge
- Touch-optimized action buttons (min 44px)

## Data Model

### Type Definitions

```typescript
// Entity scope type
type EntityScope = 'province' | 'district' | 'ward';

// Base interface for all administrative entities
interface BaseAdministrativeEntity {
  id: string;
  code: string;
  name: string;
  geometry?: Geometry;
  meta?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  scope: EntityScope;
  parentCode?: string;
}

// Province (root level)
interface Province extends BaseAdministrativeEntity {
  scope: 'province';
  region: string;
  parentCode?: never;
}

// District (level 1)
interface District extends BaseAdministrativeEntity {
  scope: 'district';
  parentCode: string; // Province code
  type?: string;
}

// Ward (level 2)
interface Ward extends BaseAdministrativeEntity {
  scope: 'ward';
  parentCode: string; // District or Province code
  type?: string;
}

// Union type
type AdministrativeEntity = Province | District | Ward;
```

### TreeNode Structure

```typescript
interface AdministrativeTreeNode extends TreeNode<AdministrativeEntity> {
  data: AdministrativeEntity;
  children?: AdministrativeTreeNode[];
  leaf?: boolean;
  expanded?: boolean;
  loading?: boolean;
}
```

## API Integration

### Backend Endpoints

The implementation expects the following API endpoints (from `common-service`):

#### Provinces
```
GET    /v1/provinces              // List provinces (root level)
GET    /v1/provinces/:id          // Get single province
POST   /v1/provinces              // Create province
PATCH  /v1/provinces/:id          // Update province
DELETE /v1/provinces/:id          // Delete province
```

#### Districts
```
GET    /v1/districts              // List districts
GET    /v1/districts/:id          // Get single district
POST   /v1/districts              // Create district
PATCH  /v1/districts/:id          // Update district
DELETE /v1/districts/:id          // Delete district
```

#### Wards
```
GET    /v1/wards                  // List wards
GET    /v1/wards/:id              // Get single ward
POST   /v1/wards                  // Create ward
PATCH  /v1/wards/:id              // Update ward
DELETE /v1/wards/:id               // Delete ward
```

#### Unified Endpoint (Optional)
```
GET /v1/administrative-entities
  ?scope=province|district|ward
  &parentCode=XXX
  &format=tree|flat
  &lazy=true
```

### Query Parameters

**For listing:**
- `page`: Page number (default: 1)
- `size`: Items per page (default: 10)
- `q`: Search query
- `parentCode`: Filter by parent (for lazy loading)
- `scope`: Filter by entity type
- `format`: Response format (tree or flat)
- `lazy`: Enable lazy loading mode

### Response Format

**Paginated Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "code": "HN",
      "name": "Hà Nội",
      "scope": "province",
      "region": "North",
      "geometry": { ... },
      "meta": {},
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 63,
  "totalPages": 7
}
```

## Service Layer

### ProvinceService Methods

```typescript
class ProvinceService {
  // Province operations
  getProvinces(params: GetProvincesParams): Observable<ProvinceListResponse>
  getProvince(id: string): Observable<Province>
  createProvince(dto: CreateProvinceDto): Observable<Province>
  updateProvince(id: string, dto: UpdateProvinceDto): Observable<Province>
  deleteProvince(id: string): Observable<void>
  
  // District operations
  getDistricts(params: GetDistrictsParams): Observable<AdministrativeEntityListResponse>
  getDistrict(id: string): Observable<District>
  createDistrict(dto: CreateDistrictDto): Observable<District>
  updateDistrict(id: string, dto: UpdateDistrictDto): Observable<District>
  deleteDistrict(id: string): Observable<void>
  
  // Ward operations
  getWards(params: GetWardsParams): Observable<AdministrativeEntityListResponse>
  getWard(id: string): Observable<Ward>
  createWard(dto: CreateWardDto): Observable<Ward>
  updateWard(id: string, dto: UpdateWardDto): Observable<Ward>
  deleteWard(id: string): Observable<void>
  
  // Tree operations
  getAdministrativeEntities(params): Observable<AdministrativeEntityListResponse>
  getChildren(parentCode: string): Observable<AdministrativeTreeNode[]>
}
```

## Utility Functions

### tree-mapper.ts

```typescript
// Map entities to TreeNodes
mapToTreeNode(entity, hasChildren?): AdministrativeTreeNode
mapToTreeNodes(entities): AdministrativeTreeNode[]

// Build tree from flat data
buildTree(entities): AdministrativeTreeNode[]

// Tree manipulation
updateNodeChildren(tree, parentKey, children): AdministrativeTreeNode[]
findNodeByKey(tree, key): AdministrativeTreeNode | undefined

// Utility helpers
canHaveChildren(entity): boolean
getChildScope(parentScope): 'district' | 'ward' | undefined
getScopeLabel(scope): string
flattenTree(tree): AdministrativeEntity[]
```

## UI Components

### List Component (ProvinceList)

**Desktop View:**
- Two-pane layout with resizable splitter
- Left: TreeTable with lazy loading
- Right: Map showing selected entity geometry
- Toolbar with search, add, and actions menu

**Mobile View:**
- Single-column flat list
- Compact card layout
- Scope badges for entity type identification
- Touch-optimized action buttons

### TreeTable Configuration

```typescript
<p-treeTable
  [value]="treeNodes()"
  [loading]="isLoading()"
  dataKey="key"
  [lazy]="true"
  (onNodeExpand)="onNodeExpand($event)"
  (onNodeSelect)="onNodeSelect($event)"
  selectionMode="single"
  [scrollable]="true"
  scrollHeight="flex"
>
```

### Columns

1. **Name**: Entity name with expand/collapse toggle
2. **Code**: Entity code (e.g., HN, HCM)
3. **Type**: Entity scope (Province/District/Ward)
4. **Actions**: Context menu button

### Lazy Loading

When a node is expanded:
1. Check if children are already loaded
2. If not, set `loading` state on the node
3. Call `provinceService.getChildren(parentCode)`
4. Map response to TreeNodes
5. Update node's children array
6. Clear loading state

```typescript
protected onNodeExpand(event: TreeTableNodeExpandEvent): void {
  const node = event.node as AdministrativeTreeNode;
  const entity = node.data;

  if (node.children && node.children.length > 0) {
    return; // Already loaded
  }

  node.loading = true;

  this.provinceService.getChildren(entity.code).subscribe({
    next: (children) => {
      node.children = children;
      node.loading = false;
      node.leaf = children.length === 0;
      this.treeNodes.set([...this.treeNodes()]); // Trigger change detection
    },
    error: (error) => {
      node.loading = false;
      // Show error message
    }
  });
}
```

## Translations

### English (en.json)
```json
{
  "provinceList": {
    "title": "Administrative Division Management",
    "scope": {
      "province": "Province",
      "district": "District",
      "ward": "Ward"
    },
    "contextMenu": {
      "createDistrict": "Create District",
      "createWard": "Create Ward",
      "zoomToArea": "Zoom to Area"
    }
  },
  "districtForm": { ... },
  "wardForm": { ... }
}
```

### Vietnamese (vi.json)
```json
{
  "provinceList": {
    "title": "Quản lý Đơn vị Hành chính",
    "scope": {
      "province": "Tỉnh/Thành",
      "district": "Quận/Huyện",
      "ward": "Phường/Xã"
    }
  }
}
```

### Spanish (es.json)
```json
{
  "provinceList": {
    "title": "Gestión de Divisiones Administrativas",
    "scope": {
      "province": "Provincia",
      "district": "Distrito",
      "ward": "Barrio"
    }
  }
}
```

## Routing

### Routes Structure
```
/private/modules/management/province
  /:filter/:page/:limit
    /new                    // Create new province
    /:code
      /view                 // View details
      /edit                 // Edit entity
      /district/new         // Create district (future)
      /ward/new            // Create ward (future)
```

### Navigation Examples

**View province:**
```typescript
this.router.navigate([province.code], { relativeTo: this.route });
```

**Edit entity:**
```typescript
this.router.navigate([entity.code, 'edit'], { relativeTo: this.route });
```

**Create child:**
```typescript
this.router.navigate(['new'], {
  relativeTo: this.route,
  queryParams: {
    parentCode: parent.code,
    scope: childScope
  }
});
```

## Accessibility

### IDs
- `province-list-treetable`: TreeTable component
- `province-list-row-{id}`: Individual rows
- `province-list-row-menu-{id}`: Row action menus

### ARIA Attributes
- TreeTable has proper ARIA tree semantics
- Expandable/collapsible nodes with `aria-expanded`
- Context menus with `aria-haspopup` and `aria-controls`
- All interactive elements have `aria-label`

### Keyboard Navigation
- Arrow keys to navigate tree
- Enter to expand/collapse nodes
- Tab to move between interactive elements
- Context menu accessible via keyboard

## Performance Considerations

### Lazy Loading
- Only root provinces loaded initially
- Children loaded on-demand when parent is expanded
- Reduces initial payload size
- Improves perceived performance

### Pagination
- TreeTable uses virtual scrolling for large datasets
- Pagination controls for root-level entities
- Configurable page sizes (10, 20, 50, 100)

### Change Detection
- OnPush strategy for optimal performance
- Manual trigger via signal updates
- Minimizes unnecessary re-renders

## Testing

### Unit Tests
- Service methods for all CRUD operations
- Tree mapping utility functions
- Component interaction handlers

### E2E Tests (Recommended)
```typescript
// Test tree expansion
cy.get('#province-list-treetable').should('exist');
cy.contains('Hà Nội').click();
cy.get('[data-testid="expand-toggle"]').first().click();
cy.contains('Ba Đình').should('be.visible');

// Test create child
cy.contains('Hà Nội').rightclick();
cy.contains('Create District').click();
cy.get('#district-form-name').type('New District');
cy.get('#district-form-submit').click();
```

## Migration from Flat Table

### Breaking Changes
1. Province type now requires `scope: 'province'` property
2. Component now uses TreeTable instead of Table
3. Data structure changed from flat array to tree nodes

### Backward Compatibility
- Service methods maintain same signatures
- API endpoints unchanged
- Translation keys extended, not replaced
- Form components remain compatible

## Future Enhancements

### Planned Features
1. **Drag & Drop**: Reorder entities or move between parents
2. **Bulk Operations**: Multi-select for batch delete/export
3. **Advanced Filters**: Filter by region, type, parent
4. **Import/Export**: CSV and GeoJSON for all levels
5. **Map Drawing**: Create/edit geometries directly on map
6. **Offline Support**: Cache data for offline viewing
7. **Full-Text Search**: Search across all levels

### Known Limitations
1. Mobile view shows flat list (not tree)
2. No inline editing yet
3. No batch operations for children
4. Map integration still needs district/ward polygon support

## Troubleshooting

### Common Issues

**Children not loading:**
- Check backend API returns correct `scope` field
- Verify `parentCode` query parameter is supported
- Check console for error messages

**TreeTable not expanding:**
- Ensure `leaf` property is set correctly
- Verify lazy loading is enabled
- Check `onNodeExpand` handler is called

**Context menu not showing child creation options:**
- Verify `canHaveChildren()` returns true for provinces/districts
- Check entity `scope` property is set correctly
- Ensure translations for menu items exist

## References

- [PrimeNG TreeTable Documentation](https://primeng.org/treetable)
- [Backend API Controllers](https://github.com/min3rd/open-erp-backend/tree/develop/apps/common-service/src/controllers)
- [Vietnamese Administrative Divisions](https://en.wikipedia.org/wiki/Administrative_divisions_of_Vietnam)
