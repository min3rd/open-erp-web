import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'layout-vertical-naviagation-module-item',
  imports: [CommonModule, RippleModule, TooltipModule],
  templateUrl: './vertical-naviagation-module-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.enter)': 'onEnterKey($event)',
    '(keydown.space)': 'onSpaceKey($event)',
  },
})
export class VerticalNaviagationModuleItem {
  label = input<string | undefined>();
  icon = input<string | undefined>();
  isActive = input<boolean>(false);
  url = input<string | undefined>();

  clicked = output<void>();

  onEnterKey(event: KeyboardEvent): void {
    event.preventDefault();
    this.clicked.emit();
  }

  onSpaceKey(event: KeyboardEvent): void {
    event.preventDefault();
    this.clicked.emit();
  }
}
