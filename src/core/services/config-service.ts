import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { UserConfig } from '../interfaces/config.types';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private _config: BehaviorSubject<UserConfig> = new BehaviorSubject<any>(null);

  get config$(): Observable<UserConfig | null> {
    return this._config.asObservable();
  }
}
