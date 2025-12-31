import { ChangeDetectionStrategy, Component, inject, computed, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PrivateLayoutService } from '../layout.service';
import { SideMenu } from '../menu/side-menu';
import { MobileMenu } from '../menu/mobile-menu';

/**
 * Vertical layout component for private area
 * Desktop: left menu (collapsible) + center content + right chat (collapsible)
 * Mobile: bottom tab bar with menu/content/chat
 */
@Component({
  selector: 'layout-vertical',
  imports: [CommonModule, RouterModule, ButtonModule, SideMenu, MobileMenu],
  templateUrl: './vertical.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vertical {
  private layoutService = inject(PrivateLayoutService);

  @ViewChild('chatContainer', { read: ViewContainerRef })
  chatContainer!: ViewContainerRef;

  // Computed signals from service
  menuData = this.layoutService.menuData;
  menuCollapsed = this.layoutService.menuCollapsed;
  chatState = this.layoutService.chatState;
  mobileMenuOpen = this.layoutService.mobileMenuOpen;

  // Computed menu width based on collapsed state
  menuWidth = computed(() => (this.menuCollapsed() ? 'w-16' : 'w-64'));

  ngOnInit() {
    // Initialize with mock data for development
    // In production, this would load from API
    this.layoutService.setMenuData(this.layoutService.getMockMenuData());
  }

  toggleMenu() {
    this.layoutService.toggleMenu();
  }

  toggleChat() {
    this.layoutService.toggleChat();
    
    // Lazy load chat component
    if (this.chatState().isOpen && !this.chatState().isLoaded) {
      this.loadChatComponent();
    }
  }

  toggleMobileMenu() {
    this.layoutService.toggleMobileMenu();
  }

  closeMobileMenu() {
    this.layoutService.closeMobileMenu();
  }

  closeChat() {
    this.layoutService.closeChat();
  }

  private async loadChatComponent() {
    if (!this.chatContainer) return;
    
    try {
      const { ChatPanel } = await import('../chat/chat');
      this.chatContainer.clear();
      const componentRef = this.chatContainer.createComponent(ChatPanel);
      componentRef.instance.onClose.subscribe(() => this.closeChat());
    } catch (error) {
      console.error('Failed to load chat component:', error);
    }
  }
}
