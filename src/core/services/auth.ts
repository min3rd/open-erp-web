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

export interface LoginDto {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private httpClient: HttpClient = inject(HttpClient);
  private readonly ENCRYPTION_KEY_NAME = 'erp_enc_key';
  private readonly ACCESS_TOKEN_KEY = 'erp_access_token';
  private readonly REFRESH_TOKEN_KEY = 'erp_refresh_token';

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

  login(payload: LoginDto, version: string = 'v1') {
    return this.httpClient.post<LoginResponse>(`${API_URI_AUTH}/${version}/auth/login`, payload).pipe(
      catchError((e) => {
        return of(e);
      })
    );
  }

  /**
   * Encrypts and stores tokens in localStorage using Web Crypto API.
   * 
   * Security Note: Client-side encryption provides protection against casual inspection
   * but is not secure against determined attackers who have access to the client environment.
   * The encryption key is stored in localStorage, which means anyone with access to the
   * browser's storage can decrypt the tokens.
   * 
   * For production environments, consider:
   * - Using secure HTTP-only cookies for token storage (recommended)
   * - Implementing server-side session management
   * - Using short-lived access tokens with refresh token rotation
   * 
   * @param tokens - The access and refresh tokens to encrypt and store
   */
  async encryptAndStoreTokens(tokens: TokenPayload): Promise<void> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      
      const encryptedAccessToken = await this.encryptData(tokens.accessToken, key);
      const encryptedRefreshToken = await this.encryptData(tokens.refreshToken, key);
      
      localStorage.setItem(this.ACCESS_TOKEN_KEY, encryptedAccessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedRefreshToken);
    } catch (error) {
      console.error('Failed to encrypt and store tokens:', error);
      throw error;
    }
  }

  /**
   * Retrieves and decrypts tokens from localStorage.
   * Returns null if tokens are not found or decryption fails.
   */
  async getStoredTokens(): Promise<TokenPayload | null> {
    try {
      const encryptedAccessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      const encryptedRefreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
      
      if (!encryptedAccessToken || !encryptedRefreshToken) {
        return null;
      }
      
      const key = await this.getOrCreateEncryptionKey();
      
      const accessToken = await this.decryptData(encryptedAccessToken, key);
      const refreshToken = await this.decryptData(encryptedRefreshToken, key);
      
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Failed to retrieve and decrypt tokens:', error);
      return null;
    }
  }

  /**
   * Clears all stored tokens from localStorage
   */
  clearStoredTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  private async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    const storedKey = localStorage.getItem(this.ENCRYPTION_KEY_NAME);
    
    if (storedKey) {
      const keyData = JSON.parse(storedKey);
      return await crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    }
    
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    localStorage.setItem(this.ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));
    
    return key;
  }

  private async encryptData(data: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );
    
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }

  private async decryptData(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    return new TextDecoder().decode(decryptedData);
  }
}
