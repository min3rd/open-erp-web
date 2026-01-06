import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../services/navigation-service';
import { Subject, takeUntil } from 'rxjs';
import { VerticalNaviagationModuleItem } from '../vertical-naviagation-module-item/vertical-naviagation-module-item';
import { TranslocoModule } from '@jsverse/transloco';
import { User } from '../../user/user';
import { ButtonModule } from 'primeng/button';
import { LayoutService } from '../../../services/layout-service';

@Component({
  selector: 'layout-vertical-navigation',
  imports: [CommonModule, TranslocoModule, VerticalNaviagationModuleItem, User, ButtonModule],
  templateUrl: './vertical-navigation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerticalNavigation implements OnInit, OnDestroy {
  isMobile = input<boolean>(false);

  private layoutService = inject(LayoutService);
  private navigationService = inject(NavigationService);
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  items: MenuItem[] | undefined;

  ngOnInit() {
    this.navigationService.modules$.pipe(takeUntil(this._unsubscribeAll)).subscribe((modules) => {
      this.items = modules;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  logOut(): void {
    console.log("Haven't implement yet");
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }
}
