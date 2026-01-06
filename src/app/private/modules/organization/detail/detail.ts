import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'organization-detail',
  imports: [CommonModule, TranslocoModule, CardModule],
  templateUrl: './detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Detail {
  private router = inject(Router);

  get isNewMode(): boolean {
    return this.router.url.includes('/new');
  }

  get isDetailMode(): boolean {
    return this.router.url.includes('/detail');
  }
}

