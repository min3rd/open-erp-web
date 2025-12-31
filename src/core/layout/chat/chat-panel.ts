import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AvatarModule } from 'primeng/avatar';

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  unread: number;
  time: string;
  avatar: string;
}

@Component({
  selector: 'private-chat-panel',
  imports: [CommonModule, AvatarModule, BadgeModule, ButtonModule, InputTextModule],
  template: `
    <section class="h-full flex flex-col bg-surface-0">
      <header class="flex items-center justify-between gap-3 px-4 py-3 border-b border-surface-200">
        <div>
          <p class="text-sm font-semibold text-surface-900">Team chat</p>
          <p class="text-xs text-surface-500">Lazy loaded on demand</p>
        </div>
        <p-button label="New" icon="pi pi-plus" size="small" severity="secondary" />
      </header>

      <div class="px-4 py-3">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search text-surface-500"></i>
          <input
            pInputText
            type="search"
            [value]="searchTerm()"
            (input)="searchTerm.set(($any($event.target)?.value ?? ''))"
            aria-label="Search chat"
            class="w-full"
          />
        </span>
      </div>

      <div class="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
        @for (conversation of filteredConversations(); track conversation.id) {
          <article
            class="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-surface-50 focus-within:ring-2 focus-within:ring-primary-400"
            tabindex="0"
          >
            <p-avatar
              shape="circle"
              [label]="conversation.name.substring(0, 1)"
              [image]="conversation.avatar"
              size="large"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-surface-900 truncate">
                  {{ conversation.name }}
                </p>
                <span class="text-xs text-surface-500">{{ conversation.time }}</span>
              </div>
              <p class="text-sm text-surface-600 truncate">
                {{ conversation.lastMessage }}
              </p>
            </div>
            @if (conversation.unread > 0) {
              <span pBadge [value]="conversation.unread" severity="danger" class="ml-auto"></span>
            }
          </article>
        } @empty {
          <p class="text-sm text-center text-surface-500 px-3">
            No conversations match your search.
          </p>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPanel {
  private readonly conversations = signal<Conversation[]>([
    {
      id: '1',
      name: 'Product Team',
      lastMessage: 'Can we ship the new layout this week?',
      unread: 3,
      time: '2m ago',
      avatar: 'https://i.pravatar.cc/60?img=1',
    },
    {
      id: '2',
      name: 'Designers',
      lastMessage: 'Shared the updated spacing tokens.',
      unread: 0,
      time: '10m ago',
      avatar: 'https://i.pravatar.cc/60?img=2',
    },
    {
      id: '3',
      name: 'HR',
      lastMessage: 'Reminder: complete security training.',
      unread: 1,
      time: '1h ago',
      avatar: 'https://i.pravatar.cc/60?img=3',
    },
  ]);

  protected readonly searchTerm = signal('');
  protected readonly filteredConversations = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return this.conversations();
    }
    return this.conversations().filter(
      (item) =>
        item.name.toLowerCase().includes(term) || item.lastMessage.toLowerCase().includes(term)
    );
  });
}
