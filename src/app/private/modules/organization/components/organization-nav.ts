import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { OrganizationLayoutService } from '../services/organization-layout.service';

@Component({
  selector: 'organization-nav',
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslocoModule, ButtonModule, TooltipModule],
  templateUrl: './organization-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationNav {
  private layoutService = inject(OrganizationLayoutService);

  navMode = this.layoutService.navMode;

  onToggleNavMode(): void {
    this.layoutService.toggleNavMode();
  }
}
