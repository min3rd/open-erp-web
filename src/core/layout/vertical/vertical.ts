import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VerticalNavigation } from '../../components/navigations/vertical-navigation/vertical-navigation';
import { QuickChat } from '../../components/quick-chat/quick-chat';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '../../services/layout-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'layout-vertical',
  imports: [CommonModule, RouterOutlet, VerticalNavigation, QuickChat, ButtonModule],
  templateUrl: './vertical.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vertical {
  private layoutService = inject(LayoutService);

  sidebarVisible = this.layoutService.sidebarVisible;
  quickChatVisible = this.layoutService.quickChatVisible;

  // Check if mobile view based on window width
  isMobile = signal(false);

  constructor() {
    // Initialize mobile detection
    this.checkMobileView();
    
    // Set up resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.checkMobileView());
    }

    // Auto-hide sidebar on mobile, show on desktop
    effect(() => {
      if (this.isMobile()) {
        this.layoutService.setSidebarVisible(false);
        this.layoutService.setQuickChatVisible(false);
      } else {
        this.layoutService.setSidebarVisible(true);
      }
    });
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  toggleQuickChat(): void {
    this.layoutService.toggleQuickChat();
  }

  private checkMobileView(): void {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 1024);
    }
  }
}
