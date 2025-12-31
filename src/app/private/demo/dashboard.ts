import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';

/**
 * Demo dashboard component to test layout functionality
 */
@Component({
  selector: 'app-demo-dashboard',
  imports: [CommonModule, CardModule, ButtonModule, ChartModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">Dashboard</h1>
          <p class="text-surface-500 dark:text-surface-400">
            Welcome to the {{ layoutType() }} layout demo
          </p>
        </div>
        <button pButton label="Add Widget" icon="pi pi-plus"></button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <p-card styleClass="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Sales</p>
              <p class="text-2xl font-bold">$12,345</p>
              <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                <i class="pi pi-arrow-up text-xs"></i> 12.5%
              </p>
            </div>
            <i class="pi pi-chart-line text-3xl text-blue-500"></i>
          </div>
        </p-card>

        <p-card styleClass="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">New Orders</p>
              <p class="text-2xl font-bold">142</p>
              <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                <i class="pi pi-arrow-up text-xs"></i> 8.2%
              </p>
            </div>
            <i class="pi pi-shopping-cart text-3xl text-green-500"></i>
          </div>
        </p-card>

        <p-card styleClass="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Pending Tasks</p>
              <p class="text-2xl font-bold">23</p>
              <p class="text-xs text-orange-600 dark:text-orange-400 mt-1">
                <i class="pi pi-minus text-xs"></i> Same
              </p>
            </div>
            <i class="pi pi-list text-3xl text-orange-500"></i>
          </div>
        </p-card>

        <p-card styleClass="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Active Users</p>
              <p class="text-2xl font-bold">1,234</p>
              <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                <i class="pi pi-arrow-up text-xs"></i> 5.1%
              </p>
            </div>
            <i class="pi pi-users text-3xl text-purple-500"></i>
          </div>
        </p-card>
      </div>

      <!-- Content Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <p-card>
          <ng-template pTemplate="header">
            <div class="p-4">
              <h3 class="text-xl font-semibold m-0">Recent Orders</h3>
            </div>
          </ng-template>
          <div class="space-y-3">
            @for (order of recentOrders; track order.id) {
              <div class="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <div>
                  <p class="font-semibold mb-1">{{ order.customer }}</p>
                  <p class="text-sm text-surface-500 dark:text-surface-400">{{ order.product }}</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{{ order.amount }}</p>
                  <span
                    class="text-xs px-2 py-1 rounded"
                    [class]="getStatusClass(order.status)"
                  >
                    {{ order.status }}
                  </span>
                </div>
              </div>
            }
          </div>
        </p-card>

        <p-card>
          <ng-template pTemplate="header">
            <div class="p-4">
              <h3 class="text-xl font-semibold m-0">Quick Actions</h3>
            </div>
          </ng-template>
          <div class="grid grid-cols-2 gap-3">
            <button
              pButton
              label="New Order"
              icon="pi pi-plus"
              class="p-button-outlined"
            ></button>
            <button
              pButton
              label="New Customer"
              icon="pi pi-user-plus"
              class="p-button-outlined"
            ></button>
            <button
              pButton
              label="Inventory"
              icon="pi pi-box"
              class="p-button-outlined"
            ></button>
            <button
              pButton
              label="Reports"
              icon="pi pi-file"
              class="p-button-outlined"
            ></button>
          </div>
        </p-card>
      </div>

      <!-- Long content to test scrolling -->
      <p-card>
        <ng-template pTemplate="header">
          <div class="p-4">
            <h3 class="text-xl font-semibold m-0">Scrollable Content Test</h3>
          </div>
        </ng-template>
        <div class="space-y-4">
          <p>
            This section contains extra content to demonstrate that only the content area scrolls
            while the menu (and top menu in horizontal layout) remain fixed.
          </p>
          @for (item of scrollTestItems; track $index) {
            <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <h4 class="font-semibold mb-2">Content Block {{ $index + 1 }}</h4>
              <p class="text-sm text-surface-600 dark:text-surface-400">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
          }
        </div>
      </p-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoDashboard {
  layoutType = input<string>('vertical');

  recentOrders = [
    { id: 1, customer: 'John Doe', product: 'Product A', amount: '$125.00', status: 'Completed' },
    { id: 2, customer: 'Jane Smith', product: 'Product B', amount: '$89.50', status: 'Pending' },
    { id: 3, customer: 'Bob Johnson', product: 'Product C', amount: '$245.00', status: 'Completed' },
    { id: 4, customer: 'Alice Brown', product: 'Product D', amount: '$67.25', status: 'Processing' },
    { id: 5, customer: 'Charlie Wilson', product: 'Product E', amount: '$189.99', status: 'Completed' },
  ];

  scrollTestItems = Array.from({ length: 10 }, (_, i) => i);

  getStatusClass(status: string): string {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-surface-100 text-surface-800 dark:bg-surface-800 dark:text-surface-400';
    }
  }
}
