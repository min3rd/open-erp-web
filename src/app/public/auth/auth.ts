import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  type OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProgressBarModule } from 'primeng/progressbar';
import { LoadingService } from '../../../core/services/loading';
@Component({
  selector: 'app-auth',
  imports: [RouterOutlet, ProgressBarModule],
  templateUrl: './auth.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Auth implements OnInit {
  private loadingService = inject(LoadingService);
  private cdr = inject(ChangeDetectorRef);

  loading: boolean = false;

  ngOnInit(): void {
    this.loadingService.onLoading$().subscribe((loading) => {
      this.loading = loading;
      this.cdr.markForCheck();
    });
  }
}
