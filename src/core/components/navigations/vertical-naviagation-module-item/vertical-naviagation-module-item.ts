import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, Output } from '@angular/core';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'layout-vertical-naviagation-module-item',
  imports: [CommonModule, RippleModule],
  templateUrl: './vertical-naviagation-module-item.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerticalNaviagationModuleItem {
  @Input() label!: string | undefined;
  @Input() icon!: string | undefined;
  @Input() isActive: boolean = false;
  @Input() url!: string | undefined;
}
