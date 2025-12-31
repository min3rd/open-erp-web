import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { AvatarModule } from 'primeng/avatar';
import { LayoutMenuItem } from '../layout.service';
import { ChatPanel } from '../chat/chat-panel';

@Component({
  selector: 'layout-horizontal',
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    MenubarModule,
    BadgeModule,
    SkeletonModule,
    AvatarModule,
    ChatPanel,
  ],
  templateUrl: './horizontal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Horizontal {
  readonly menuItems = input<LayoutMenuItem[]>([]);
  readonly menuLoading = input(false);
  readonly chatOpen = input(false);
  readonly contentTitle = input('Workspace');

  readonly toggleChat = output<void>();
  readonly refreshMenu = output<void>();
}
