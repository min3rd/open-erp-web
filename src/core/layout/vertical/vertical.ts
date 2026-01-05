import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VerticalNavigation } from '../../components/navigations/vertical-navigation/vertical-navigation';

@Component({
  selector: 'layout-vertical',
  imports: [RouterOutlet, VerticalNavigation],
  templateUrl: './vertical.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vertical {}
