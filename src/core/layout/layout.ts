import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PrivateLayoutService } from './layout.service';
import { Vertical } from './vertical/vertical';
import { Horizontal } from './horizontal/horizontal';
import type { LayoutType } from './layout.types';

/**
 * Main layout component that switches between horizontal and vertical layouts
 */
@Component({
  selector: 'app-layout',
  imports: [CommonModule, Vertical, Horizontal],
  templateUrl: './layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  private layoutService = inject(PrivateLayoutService);
  private route = inject(ActivatedRoute);

  // Allow layout type to be passed as input
  layoutType = input<LayoutType>('vertical');

  // Get layout config from service
  layoutConfig = this.layoutService.layoutConfig;

  ngOnInit() {
    // Get layout type from route data or input
    const routeLayoutType = this.route.snapshot.data['layoutType'] as LayoutType;
    const finalLayoutType = routeLayoutType || this.layoutType();

    // Initialize layout service with the provided layout type
    this.layoutService.initialize({
      layoutType: finalLayoutType,
    });
  }

  ngOnChanges() {
    // Update layout type when input changes
    this.layoutService.setLayoutType(this.layoutType());
  }
}
