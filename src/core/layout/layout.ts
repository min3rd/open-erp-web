import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { Horizontal } from './horizontal/horizontal';
import { Vertical } from './vertical/vertical';
import { ChatPanel } from './chat/chat-panel';
import { LayoutMenuItem, LayoutType, PrivateLayoutService } from './layout.service';

type MobileTabId = 'menu' | 'content' | 'chat';

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TabsModule,
    Horizontal,
    Vertical,
    ChatPanel,
  ],
  templateUrl: './layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  private layoutService = inject(PrivateLayoutService);

  readonly layoutType = input<LayoutType>('vertical');
  readonly menuData = input<LayoutMenuItem[] | null>(null);
  readonly permissions = input<string[]>([]);
  readonly contentTitle = input('Workspace');

  protected readonly menuItems = signal<LayoutMenuItem[]>([]);
  protected readonly menuLoading = signal(false);
  protected readonly menuCollapsed = signal(false);
  protected readonly chatOpen = signal(false);
  protected readonly mobileMenuOpen = signal(false);
  protected readonly mobileChatOpen = signal(false);
  protected readonly activeMobileTab = signal<MobileTabId>('content');
  protected readonly searchTerm = signal('');

  protected readonly filteredMenuFlat = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const flattened = this.layoutService.flatten(this.menuItems());
    if (!term) {
      return flattened;
    }
    return flattened.filter((item) => (item.label ?? '').toLowerCase().includes(term));
  });

  constructor() {
    effect(() => {
      const providedMenu = this.menuData();
      if (providedMenu?.length) {
        this.menuItems.set(
          this.layoutService.filterByPermissions(providedMenu, this.permissions())
        );
      }
    });
  }

  ngOnInit(): void {
    if (!this.menuData()?.length) {
      this.loadMenu();
    }
  }

  protected loadMenu(): void {
    this.menuLoading.set(true);
    this.layoutService.fetchMenu(this.permissions()).subscribe((items) => {
      this.menuItems.set(items);
      this.menuLoading.set(false);
    });
  }

  protected toggleMenuCollapse(): void {
    this.menuCollapsed.update((value) => !value);
  }

  protected toggleChat(): void {
    this.chatOpen.update((value) => !value);
    this.mobileChatOpen.set(this.chatOpen());
    if (this.chatOpen()) {
      this.activeMobileTab.set('chat');
    } else {
      this.activeMobileTab.set('content');
    }
  }

  protected openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
    this.activeMobileTab.set('menu');
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    this.activeMobileTab.set('content');
  }

  protected handleTabChange(value: unknown): void {
    const id = (typeof value === 'string' ? value : 'content') as MobileTabId;
    this.activeMobileTab.set(id);
    if (id === 'menu') {
      this.mobileMenuOpen.set(true);
      this.mobileChatOpen.set(false);
    } else if (id === 'chat') {
      this.mobileChatOpen.set(true);
      this.chatOpen.set(true);
      this.mobileMenuOpen.set(false);
    } else {
      this.mobileMenuOpen.set(false);
      this.mobileChatOpen.set(false);
    }
  }

  protected refreshMenu(): void {
    this.loadMenu();
  }
}
