import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ManagementLayoutService } from '../services/management-layout.service';
import { filter, map, startWith } from 'rxjs/operators';

@Component({
  selector: 'management-nav',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslocoModule,
    ButtonModule,
    TooltipModule,
  ],
  templateUrl: './management-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagementNav {
  private layoutService = inject(ManagementLayoutService);
  private router = inject(Router);

  navMode = this.layoutService.navMode;

  // Track active route for aria-current
  isRouteActive$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => this.router.url),
    startWith(this.router.url)
  );

  onToggleNavMode(): void {
    this.layoutService.toggleNavMode();
  }

  isActive(route: string): boolean {
    return this.router.isActive(route, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }
}
