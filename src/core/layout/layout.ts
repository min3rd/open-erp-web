import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Empty } from './empty/empty';
import { Horizontal } from './horizontal/horizontal';
import { Vertical } from './vertical/vertical';
import { UserConfig } from '../config.types';
import { ConfigService } from '../services/config';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-layout',
  imports: [Empty, Horizontal, Vertical],
  templateUrl: './layout.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout implements OnInit, OnDestroy {
  private configService = inject(ConfigService);
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll: Subject<any> = new Subject<any>();

  config!: UserConfig;

  ngOnInit(): void {
    this.configService.config$.pipe(takeUntil(this._unsubscribeAll)).subscribe((config) => {
      this.config = config!;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
