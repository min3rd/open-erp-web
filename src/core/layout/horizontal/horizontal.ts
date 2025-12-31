import { ChangeDetectionStrategy, Component, inject, ViewChild, ViewContainerRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PrivateLayoutService } from '../layout.service';
import { TopMenu } from '../menu/top-menu';
import { MobileMenu } from '../menu/mobile-menu';

/**
 * Horizontal layout component for private area
 * Desktop: sticky top menu + center content + right chat
 * Mobile: bottom tab bar with menu/content/chat (same as vertical)
 */
@Component({
  selector: 'layout-horizontal',
  imports: [CommonModule, RouterModule, ButtonModule, TopMenu, MobileMenu],
  templateUrl: './horizontal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Horizontal {
  private layoutService = inject(PrivateLayoutService);

  @ViewChild('chatContainer', { read: ViewContainerRef })
  chatContainer!: ViewContainerRef;

  // Computed signals from service
  menuData = this.layoutService.menuData;
  chatState = this.layoutService.chatState;
  mobileMenuOpen = this.layoutService.mobileMenuOpen;

  ngOnInit() {
    // Initialize with mock data for development
    // In production, this would load from API
    this.layoutService.setMenuData(this.layoutService.getMockMenuData());
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
