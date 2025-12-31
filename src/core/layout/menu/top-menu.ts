import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenubarModule } from 'primeng/menubar';
import type { MenuItem } from '../layout.types';

/**
 * Top menu component for desktop horizontal layout
 */
@Component({
  selector: 'app-top-menu',
  imports: [CommonModule, RouterModule, MenubarModule],
  template: `
    <div class="bg-surface-0 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-700 sticky top-0 z-40">
      <div class="flex items-center px-4">
        <div class="flex items-center gap-2 py-3 mr-4">
          <i class="pi pi-th-large text-xl text-primary-500"></i>
          <span class="font-bold text-lg">ERP</span>
        </div>
        <p-menubar [model]="items()" styleClass="border-none bg-transparent flex-1">
          <ng-template pTemplate="end">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
                [attr.aria-label]="'Notifications'"
              >
                <i class="pi pi-bell"></i>
              </button>
              <button
                type="button"
                class="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
                [attr.aria-label]="'User menu'"
              >
                <i class="pi pi-user"></i>
              </button>
            </div>
          </ng-template>
        </p-menubar>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopMenu {
  items = input.required<MenuItem[]>();
}
