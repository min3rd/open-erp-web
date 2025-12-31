import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuModule } from 'primeng/menu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ButtonModule } from 'primeng/button';
import type { MenuItem } from '../layout.types';

/**
 * Side menu component for desktop vertical layout
 */
@Component({
  selector: 'app-side-menu',
  imports: [CommonModule, RouterModule, PanelMenuModule, ButtonModule],
  template: `
    <div class="flex flex-col h-full bg-surface-0 dark:bg-surface-900">
      <!-- Menu Header -->
      <div class="flex items-center justify-between p-4 border-b border-surface-border">
        @if (!collapsed()) {
          <div class="flex items-center gap-2">
            <i class="pi pi-th-large text-xl text-primary-500"></i>
            <span class="font-bold text-lg">ERP Menu</span>
          </div>
        }
        <button
          pButton
          type="button"
          [icon]="collapsed() ? 'pi pi-angle-right' : 'pi pi-angle-left'"
          class="p-button-text p-button-rounded"
          (click)="onToggle.emit()"
          [attr.aria-label]="collapsed() ? 'Expand menu' : 'Collapse menu'"
          [attr.aria-expanded]="!collapsed()"
        ></button>
      </div>

      <!-- Menu Content -->
      <div class="flex-1 overflow-y-auto">
        <p-panelMenu
          [model]="items()"
          [multiple]="true"
          styleClass="border-none"
        ></p-panelMenu>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideMenu {
  items = input.required<MenuItem[]>();
  collapsed = input<boolean>(false);
  onToggle = output<void>();
}
