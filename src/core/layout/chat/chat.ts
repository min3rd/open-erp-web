import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ScrollPanelModule } from 'primeng/scrollpanel';

/**
 * Chat panel component - lazy loaded for performance
 * This is a placeholder implementation that can be enhanced with real chat functionality
 */
@Component({
  selector: 'app-chat-panel',
  imports: [CommonModule, ButtonModule, InputTextModule, ScrollPanelModule],
  template: `
    <div class="flex flex-col h-full bg-surface-0 dark:bg-surface-900">
      <!-- Chat Header -->
      <div
        class="flex items-center justify-between p-4 border-b border-surface-border"
      >
        <div class="flex items-center gap-3">
          <i class="pi pi-comments text-xl"></i>
          <h3 class="text-lg font-semibold m-0">Chat</h3>
        </div>
        <button
          pButton
          type="button"
          icon="pi pi-times"
          class="p-button-text p-button-rounded"
          (click)="onClose.emit()"
          [attr.aria-label]="'Close chat panel'"
        ></button>
      </div>

      <!-- Chat Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="space-y-4">
          <!-- Sample messages - replace with real chat implementation -->
          <div class="flex flex-col gap-2">
            <div class="bg-surface-100 dark:bg-surface-800 rounded-lg p-3 max-w-[80%]">
              <p class="text-sm m-0">Welcome to the chat panel!</p>
              <span class="text-xs text-surface-500 dark:text-surface-400">10:30 AM</span>
            </div>
          </div>

          <div class="flex flex-col gap-2 items-end">
            <div class="bg-primary-500 text-white rounded-lg p-3 max-w-[80%]">
              <p class="text-sm m-0">This is a placeholder for the chat functionality.</p>
              <span class="text-xs text-primary-100">10:31 AM</span>
            </div>
          </div>

          <div class="text-center py-8">
            <i class="pi pi-comments text-4xl text-surface-300 dark:text-surface-600 mb-3"></i>
            <p class="text-surface-500 dark:text-surface-400 text-sm">
              Chat functionality will be implemented here
            </p>
          </div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="p-4 border-t border-surface-border">
        <div class="flex gap-2">
          <input
            pInputText
            type="text"
            placeholder="Type a message..."
            class="flex-1"
            [attr.aria-label]="'Type a message'"
          />
          <button
            pButton
            type="button"
            icon="pi pi-send"
            [attr.aria-label]="'Send message'"
          ></button>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPanel {
  onClose = output<void>();
}
