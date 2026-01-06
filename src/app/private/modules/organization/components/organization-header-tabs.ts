import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'organization-header-tabs',
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslocoModule],
  templateUrl: './organization-header-tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationHeaderTabs {
  router = inject(Router);

  get activeTabIndex(): number {
    const url = this.router.url;
    if (url.includes('/new')) {
      return 0;
    } else if (url.includes('/detail')) {
      return 1;
    }
    return 0;
  }
}
