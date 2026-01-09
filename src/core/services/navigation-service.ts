import { HttpClient } from '@angular/common/http';
import { inject, Injectable, isDevMode } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { API_URI_CONFIG } from '../constant';
import { ApiResponse, isApiResponse, unwrap } from '../api';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  private httpClient = inject(HttpClient);

  private _modules: BehaviorSubject<MenuItem[]> = new BehaviorSubject<any>(null);
  private _items: BehaviorSubject<MenuItem[]> = new BehaviorSubject<any>(null);

  get modules$(): Observable<MenuItem[]> {
    return this._modules.asObservable();
  }

  get items$(): Observable<MenuItem[]> {
    return this._items.asObservable();
  }

  loadModules(version: string = 'v1'): Observable<MenuItem[]> {
    if (isDevMode()) {
      return of([
        {
          label: 'Dashboard',
          icon: 'pi pi-home',
          routerLink: ['/dashboard'],
        },
        {
          label: 'HR',
          icon: 'pi pi-users',
          routerLink: ['/hr'],
        },
        {
          label: 'Accounting',
          icon: 'pi pi-wallet',
          routerLink: ['/accounting'],
        },
        {
          label: 'Sales',
          icon: 'pi pi-chart-line',
          routerLink: ['/sales'],
        },
      ]).pipe(
        map((modules) => {
          this._modules.next(modules);
          return modules;
        })
      );
    }
    return this.httpClient
      .get<ApiResponse<MenuItem[]> | MenuItem[]>(`${API_URI_CONFIG}/${version}/configs/modules`)
      .pipe(
        map((response) => {
          let modules: MenuItem[];
          if (isApiResponse(response)) {
            modules = unwrap(response as ApiResponse<MenuItem[]>);
          } else {
            // Legacy format
            console.warn('NavigationService: Received legacy response format for loadModules');
            modules = response as MenuItem[];
          }
          this._modules.next(modules);
          return modules;
        })
      );
  }
}
