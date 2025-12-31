import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import type { MenuItem } from '../layout.types';

/**
 * Mobile menu component with full-screen grid display and search
 */
@Component({
  selector: 'app-mobile-menu',
  imports: [CommonModule, RouterModule, FormsModule, DialogModule, ButtonModule, InputTextModule],
  template: `
    <p-dialog
      [(visible)]="isOpen"
      [modal]="true"
      [closable]="false"
      [dismissableMask]="true"
      styleClass="w-full h-full m-0"
      [contentStyleClass]="'p-0 h-full'"
      (onHide)="handleClose()"
    >
      <div class="flex flex-col h-full bg-surface-0 dark:bg-surface-900">
        <!-- Header with search -->
        <div class="p-4 border-b border-surface-200 dark:border-surface-700">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-bold m-0">Menu</h2>
            <button
              pButton
              type="button"
              icon="pi pi-times"
              class="p-button-text p-button-rounded"
              (click)="handleClose()"
              [attr.aria-label]="'Close menu'"
            ></button>
          </div>
          <div class="relative">
            <i class="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-surface-400"></i>
            <input
              pInputText
              type="text"
              placeholder="Search menu..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              class="w-full pl-10"
              [attr.aria-label]="'Search menu items'"
            />
          </div>
        </div>

        <!-- Menu Grid -->
        <div class="flex-1 overflow-y-auto p-4">
          <div class="grid grid-cols-3 gap-4">
            @for (item of filteredItems(); track item.id) {
              @if (!item.items || item.items.length === 0) {
                <a
                  [routerLink]="item.routerLink"
                  [href]="item.url"
                  (click)="handleItemClick(item)"
                  class="flex flex-col items-center justify-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors gap-2 no-underline"
                  [class.opacity-50]="item.disabled"
                  [attr.aria-label]="item.label"
                  [attr.aria-disabled]="item.disabled"
                >
                  @if (item.icon) {
                    <i [class]="item.icon + ' text-2xl text-primary-500'"></i>
                  }
                  <span class="text-sm text-center text-surface-900 dark:text-surface-0">{{ item.label }}</span>
                  @if (item.badge) {
                    <span
                      class="text-xs px-2 py-1 rounded-full"
                      [class]="getBadgeClass(item.badgeSeverity)"
                    >
                      {{ item.badge }}
                    </span>
                  }
                </a>
              } @else {
                <button
                  type="button"
                  (click)="toggleSubmenu(item.id)"
                  class="flex flex-col items-center justify-center p-4 rounded-lg bg-surface-50 dark:bg-surface-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors gap-2"
                  [attr.aria-label]="item.label"
                  [attr.aria-expanded]="expandedItems().has(item.id)"
                >
                  @if (item.icon) {
                    <i [class]="item.icon + ' text-2xl text-primary-500'"></i>
                  }
                  <span class="text-sm text-center">{{ item.label }}</span>
                  <i class="pi pi-angle-down text-xs"></i>
                </button>
              }
              
              <!-- Submenu items -->
              @if (item.items && expandedItems().has(item.id)) {
                @for (subItem of item.items; track subItem.id) {
                  <a
                    [routerLink]="subItem.routerLink"
                    [href]="subItem.url"
                    (click)="handleItemClick(subItem)"
                    class="flex flex-col items-center justify-center p-4 rounded-lg bg-surface-100 dark:bg-surface-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors gap-2 no-underline col-span-1"
                    [class.opacity-50]="subItem.disabled"
                    [attr.aria-label]="subItem.label"
                  >
                    @if (subItem.icon) {
                      <i [class]="subItem.icon + ' text-xl text-primary-500'"></i>
                    }
                    <span class="text-xs text-center text-surface-900 dark:text-surface-0">{{ subItem.label }}</span>
                  </a>
                }
              }
            }
          </div>

          @if (filteredItems().length === 0) {
            <div class="text-center py-12">
              <i class="pi pi-search text-4xl text-surface-300 dark:text-surface-600 mb-3"></i>
              <p class="text-surface-500 dark:text-surface-400">No menu items found</p>
            </div>
          }
        </div>
      </div>
    </p-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileMenu {
  items = input.required<MenuItem[]>();
  visible = input.required<boolean>();
  onClose = output<void>();

  searchQuery = signal<string>('');
  expandedItems = signal<Set<string>>(new Set());
  filteredItems = signal<MenuItem[]>([]);

  // Two-way binding for dialog visibility
  isOpen = false;

  ngOnInit() {
    this.filteredItems.set(this.items());
  }

  ngOnChanges() {
    this.isOpen = this.visible();
    if (this.isOpen) {
      this.filteredItems.set(this.items());
      this.searchQuery.set('');
    }
  }

  handleClose() {
    this.isOpen = false;
    this.onClose.emit();
  }

  onSearchChange(query: string) {
    if (!query.trim()) {
      this.filteredItems.set(this.items());
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = this.items().filter((item) => {
      // Search in item label
      if (item.label.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      // Search in subitems
      if (item.items) {
        return item.items.some((subItem) =>
          subItem.label.toLowerCase().includes(lowerQuery)
        );
      }
      return false;
    });

    this.filteredItems.set(filtered);
  }

  toggleSubmenu(itemId: string) {
    this.expandedItems.update((expanded) => {
      const newExpanded = new Set(expanded);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return newExpanded;
    });
  }

  handleItemClick(item: MenuItem) {
    if (item.disabled) {
      return;
    }
    if (item.command) {
      item.command();
    }
    // Close menu after navigation
    setTimeout(() => this.handleClose(), 100);
  }

  getBadgeClass(severity?: string): string {
    const baseClass = 'inline-flex items-center justify-center';
    switch (severity) {
      case 'success':
        return `${baseClass} bg-green-500 text-white`;
      case 'info':
        return `${baseClass} bg-blue-500 text-white`;
      case 'warn':
        return `${baseClass} bg-orange-500 text-white`;
      case 'danger':
        return `${baseClass} bg-red-500 text-white`;
      default:
        return `${baseClass} bg-surface-500 text-white`;
    }
  }
}
