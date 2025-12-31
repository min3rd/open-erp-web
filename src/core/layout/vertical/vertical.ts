import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PanelMenuModule } from 'primeng/panelmenu';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { LayoutMenuItem } from '../layout.service';
import { ChatPanel } from '../chat/chat-panel';

@Component({
  selector: 'layout-vertical',
  imports: [
    CommonModule,
    NgOptimizedImage,
    RouterModule,
    ButtonModule,
    PanelMenuModule,
    BadgeModule,
    SkeletonModule,
    DividerModule,
    AvatarModule,
    ChatPanel,
  ],
  templateUrl: './vertical.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vertical {
  readonly menuItems = input<LayoutMenuItem[]>([]);
  readonly menuLoading = input(false);
  readonly chatOpen = input(false);
  readonly menuCollapsed = input(false);
  readonly contentTitle = input('Workspace');

  readonly toggleMenu = output<void>();
  readonly toggleChat = output<void>();
  readonly refreshMenu = output<void>();
  readonly openMobileMenu = output<void>();
}
