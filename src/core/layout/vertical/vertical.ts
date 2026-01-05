import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VerticalNavigation } from '../../components/navigations/vertical-navigation/vertical-navigation';
import { QuickChat } from '../../components/quick-chat/quick-chat';

@Component({
  selector: 'layout-vertical',
  imports: [RouterOutlet, VerticalNavigation, QuickChat],
  templateUrl: './vertical.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Vertical {}
