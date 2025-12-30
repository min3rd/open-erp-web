import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { LoadingService } from '../core/services/loading';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule, ToastModule, ProgressBarModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  providers: [MessageService],
})
export class App {
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
