## Private layout system

This folder contains the private layout used across the authenticated area. Two variants are available:

- `vertical`: left navigation (collapsible), center content, optional right chat (collapsible).
- `horizontal`: sticky top navigation, center content, optional right chat.

### Inputs

- `layoutType: 'horizontal' | 'vertical'` – switch between variants.
- `menuData?: LayoutMenuItem[]` – optional menu data. When omitted, the layout calls the menu API.
- `permissions?: string[]` – client-side filter for items with `permission` keys.
- `contentTitle?: string` – title shown in the header area.

### Menu API contract

`GET ${API_URI_MENU}/v1/menu`

```json
[
  {
    "label": "Inbox",
    "icon": "pi pi-inbox",
    "routerLink": ["/inbox"],
    "badge": "5",
    "permission": "mail:read",
    "items": [
      { "label": "Important", "routerLink": ["/important"], "permission": "mail:important" }
    ]
  }
]
```

- Nested items are supported via the `items` array.
- Items with a `permission` key are hidden if the permission is not present in the provided list.
- `disabled: true` is respected by the rendered PrimeNG menu components.

### Mobile behaviour

- On screens below `md`, the layout shows only the content area with a bottom `TabMenu` (Menu / Content / Chat).
- Tapping **Menu** opens a full-screen, focus-trapped dialog with a searchable grid built from the menu data.
- Tapping **Chat** lazy-loads the chat panel in a dialog to avoid adding it to the main bundle.

### Demo route

Visit `/private/private-demo` to validate both layout variants, menu loading, and mobile tab behaviour.

### Notes

- Only Tailwind utilities and PrimeNG components are used; no extra UI libraries are required.
- Chat is lazy-loaded via Angular `@defer` to keep bundles small.
