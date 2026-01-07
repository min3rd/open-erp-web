# Vertical Layout Improvements - API Documentation

## Overview
This document details the backend API endpoints used for the vertical layout improvements in the Open ERP web application.

## Backend Repository
The backend APIs are defined in the `open-erp-backend` repository at:
```
open-erp-backend/apps/tenant/src/controllers/organization.controller.ts
```

## Organization Management Endpoints

### Base URL
```
http://localhost:3005
```

### 1. Create Organization
**Endpoint:** `POST /v1/organizations`

**Description:** Register a new organization/business in the system.

**Request Body:**
```typescript
{
  taxId: string;              // 10-13 digit tax ID
  name: string;               // Business name (Vietnamese)
  internationalName: string;  // Business name (English)
  headquartersAddress: string;
  legalRepresentative: string;
  contactPhone: string;
  contactEmail: string;
  foundedDate: string;        // ISO 8601 date format
  businessActivities?: string[];
  type: 'holding' | 'company' | 'joint-venture' | 'partner' | 'branch';
  status?: 'active' | 'inactive' | 'pending';
  country: string;
  description?: string;
  website?: string;
}
```

**Response:** `OrganizationResponse` (201 Created)

**Frontend Implementation:** `OrganizationService.createOrganization()`

---

### 2. Get Organization
**Endpoint:** `GET /v1/organizations/:id`

**Description:** Retrieve details of a specific organization.

**Path Parameters:**
- `id`: Organization ID

**Response:** `OrganizationResponse` (200 OK)

**Frontend Implementation:** `OrganizationService.getOrganization(id)`

---

### 3. Update Organization
**Endpoint:** `PATCH /v1/organizations/:id`

**Description:** Update organization details.

**Path Parameters:**
- `id`: Organization ID

**Request Body:** Partial `UpdateOrganizationDto`

**Response:** `OrganizationResponse` (200 OK)

**Frontend Implementation:** `OrganizationService.updateOrganization(id, dto)`

---

### 4. Get User's Organizations
**Endpoint:** `GET /v1/organizations/user/me` (assumed, to be confirmed)

**Description:** Get list of organizations that the current user belongs to.

**Response:**
```typescript
{
  data: OrganizationResponse[];
}
```

**Frontend Implementation:** To be implemented in `OrganizationService`

**Note:** This endpoint is currently mocked in the frontend with demo data. The actual endpoint needs to be confirmed with the backend team.

---

### 5. Get Organization Members
**Endpoint:** `GET /v1/organizations/:id/members`

**Description:** Get list of members in an organization.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)

**Response:**
```typescript
{
  data: OrganizationMember[];
  total: number;
  page: number;
  limit: number;
}
```

**Frontend Implementation:** `OrganizationService.getOrganizationMembers(id, page, limit)`

---

### 6. Invite Member
**Endpoint:** `POST /v1/organizations/:id/members/invite`

**Description:** Invite a new member to the organization.

**Request Body:**
```typescript
{
  email: string;
  role: string;
}
```

**Response:** `OrganizationMember` (201 Created)

**Frontend Implementation:** `OrganizationService.inviteMember(id, dto)`

---

### 7. Remove Member
**Endpoint:** `DELETE /v1/organizations/:id/members/:memberId`

**Description:** Remove a member from the organization.

**Response:** No content (204)

**Frontend Implementation:** `OrganizationService.removeMember(organizationId, memberId)`

---

### 8. Get Organization Relations
**Endpoint:** `GET /v1/organizations/:id/relations`

**Description:** Get related organizations (subsidiaries, partners, etc.)

**Response:** `OrganizationRelation[]` (200 OK)

**Frontend Implementation:** `OrganizationService.getOrganizationRelations(id)`

---

### 9. Get Organization Events
**Endpoint:** `GET /v1/organizations/:id/events`

**Description:** Get activity log/events for an organization.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Response:**
```typescript
{
  data: OrganizationEvent[];
  total: number;
  page: number;
  limit: number;
}
```

**Frontend Implementation:** `OrganizationService.getOrganizationEvents(id, page, limit)`

---

## External API Integration

### VietQR Business Lookup
**Endpoint:** `GET https://api.vietqr.io/v2/business/:taxId`

**Description:** Lookup business information by tax ID (Vietnamese businesses only).

**Response:**
```typescript
{
  code: string;
  desc: string;
  data: {
    id: string;
    name: string;
    internationalName: string;
    shortName: string;
    address: string;
    status: string;
  };
}
```

**Frontend Implementation:** `OrganizationService.lookupBusinessByTaxId(taxId)`

---

## LocalStorage Keys

The following localStorage keys are used by the vertical layout features:

1. **`app.nav.mode`** - Navigation mode ('narrow' | 'sidebar')
2. **`app.nav.width`** - Navigation width in pixels (56-320)
3. **`app.language`** - Selected language code ('en' | 'es')
4. **`app.tenant.currentOrgId`** - Current selected organization ID
5. **`organization.nav.mode`** - Organization module nav mode (existing, kept for compatibility)

---

## Frontend Services

### TenantContextService
Global service for managing organization context across the application.

**Key Methods:**
- `setUserOrganizations(organizations)` - Set available organizations
- `setCurrentOrganization(organization)` - Set active organization
- `switchOrganization(organizationId)` - Switch to different organization
- `clearCurrentOrganization()` - Clear selection

**Observables:**
- `organizationChanged$` - Emits when organization changes

---

### LayoutService
Enhanced with resizable navigation support.

**Key Methods:**
- `toggleNavMode()` - Toggle between narrow/sidebar
- `setNavMode(mode)` - Set navigation mode
- `setNavWidth(width)` - Set navigation width (56-320px)

**Properties:**
- `navMode` - Current navigation mode signal
- `navWidth` - Current navigation width signal
- `minNavWidth` / `maxNavWidth` - Constraints

---

## Notes

1. All organization endpoints require authentication via JWT token
2. The user must have appropriate permissions to perform operations
3. The organization registration flow validates tax ID format (10-13 digits)
4. VietQR API integration is optional and only works for Vietnamese businesses
5. The frontend currently uses mock data for user organizations list - this needs to be replaced with actual API call once the backend endpoint is available

---

## TODO

- [ ] Confirm GET user organizations endpoint with backend team
- [ ] Implement real API call to fetch user's organizations
- [ ] Add error handling for organization switching
- [ ] Implement retry logic for failed API calls
- [ ] Add loading states during organization operations
