import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'demo-demo',
  imports: [],
  templateUrl: './demo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Demo { }
