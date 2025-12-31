import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URI_MENU } from '../constant';
import { catchError, map, of } from 'rxjs';
import { MenuItem } from 'primeng/api';

export type LayoutType = 'horizontal' | 'vertical';

export interface LayoutMenuItem extends MenuItem {
  permission?: string;
  items?: LayoutMenuItem[];
}

@Injectable({
  providedIn: 'root',
})
export class PrivateLayoutService {
  private httpClient = inject(HttpClient);

  fetchMenu(permissions: string[] = [], version: string = 'v1') {
    return this.httpClient.get<LayoutMenuItem[]>(`${API_URI_MENU}/${version}/menu`).pipe(
      map((items) => this.filterByPermissions(items ?? [], permissions)),
      catchError(() => of(this.filterByPermissions(this.mockMenu(), permissions)))
    );
  }

  filterByPermissions(items: LayoutMenuItem[], permissions: string[] = []): LayoutMenuItem[] {
    if (!items?.length) {
      return [];
    }

    return items
      .filter((item) => !item.permission || permissions.includes(item.permission))
      .map((item) => ({
        ...item,
        items: item.items ? this.filterByPermissions(item.items, permissions) : undefined,
      }));
  }

  flatten(items: LayoutMenuItem[]): LayoutMenuItem[] {
    const result: LayoutMenuItem[] = [];

    const walk = (nodes: LayoutMenuItem[]) => {
      nodes.forEach((node) => {
        result.push({ ...node, items: undefined });
        if (node.items?.length) {
          walk(node.items);
        }
      });
    };

    walk(items);
    return result;
  }

  private mockMenu(): LayoutMenuItem[] {
    return [
      {
        label: 'Inbox',
        icon: 'pi pi-inbox',
        badge: '5',
        routerLink: ['/inbox'],
      },
      {
        label: 'Starred',
        icon: 'pi pi-star',
        routerLink: ['/starred'],
      },
      {
        label: 'Drafts',
        icon: 'pi pi-pencil',
        routerLink: ['/drafts'],
      },
      {
        label: 'Important',
        icon: 'pi pi-exclamation-circle',
        routerLink: ['/important'],
        permission: 'mail:important',
      },
      {
        label: 'Sent',
        icon: 'pi pi-send',
        routerLink: ['/sent'],
      },
      {
        label: 'Archive',
        icon: 'pi pi-inbox',
        routerLink: ['/archive'],
      },
      {
        label: 'Spam',
        icon: 'pi pi-ban',
        routerLink: ['/spam'],
      },
      {
        label: 'Trash',
        icon: 'pi pi-trash',
        routerLink: ['/trash'],
      },
      {
        label: 'Other',
        icon: 'pi pi-folder',
        items: [
          { label: 'Security', icon: 'pi pi-shield', routerLink: ['/security'] },
          { label: 'Update', icon: 'pi pi-refresh', routerLink: ['/update'] },
          { label: 'Marketing', icon: 'pi pi-bullhorn', routerLink: ['/marketing'] },
          { label: 'HR', icon: 'pi pi-users', routerLink: ['/hr'] },
        ],
      },
    ];
  }
}
