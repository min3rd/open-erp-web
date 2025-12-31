import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_URI_AUTH } from '../constant';
import { catchError, of } from 'rxjs';

export interface RegisterDto {
  email: string;
  fullName: string;
  password: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
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

  verifyEmail(payload: VerifyEmailDto, version: string = 'v1') {
    return this.httpClient.post(`${API_URI_AUTH}/${version}/auth/verify-email`, payload).pipe(
      catchError((e) => {
        return of(e);
      })
    );
  }

  resendVerificationCode(email: string, version: string = 'v1') {
    return this.httpClient.post(`${API_URI_AUTH}/${version}/auth/resend-verification`, { email }).pipe(
      catchError((e) => {
        return of(e);
      })
    );
  }
}
