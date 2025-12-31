import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'layout-vertical',
  imports: [RouterOutlet],
  templateUrl: './vertical.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vertical {}
