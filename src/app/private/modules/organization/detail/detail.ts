import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'organization-detail',
  imports: [],
  templateUrl: './detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Detail { }
