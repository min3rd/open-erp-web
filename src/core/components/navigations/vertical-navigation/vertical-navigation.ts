import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../../services/navigation-service';
import { Subject, takeUntil } from 'rxjs';
import { VerticalNaviagationModuleItem } from '../vertical-naviagation-module-item/vertical-naviagation-module-item';
import { TranslocoModule } from '@jsverse/transloco';
import { DividerModule } from 'primeng/divider';
import { User } from '../../user/user';

@Component({
  selector: 'layout-vertical-navigation',
  imports: [CommonModule, TranslocoModule, DividerModule, VerticalNaviagationModuleItem, User],
  templateUrl: './vertical-navigation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerticalNavigation implements OnInit, OnDestroy {
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
}
