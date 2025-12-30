import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URI_AUTH } from '../constant';
import { catchError, of } from 'rxjs';

export interface RegisterDto {
  email: string;
  fullName: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient: HttpClient = inject(HttpClient);

  register(form: RegisterDto, version: string = 'v1') {
    return this.httpClient.post(`${API_URI_AUTH}/${version}/auth/register`, form).pipe(
      catchError((e) => {
        return of(e);
      })
    );
  }
}
