import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  getAccessToken(): string | null {
    return localStorage.getItem('x-auth-token');
  }

  setAccessToken(token: string): void {
    localStorage.setItem('x-auth-token', token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh-token');
  }

  setRefreshToken(token: string): void {
    localStorage.setItem('refresh-token', token);
  }

  getUser(): any {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getClientId(): string | null {
    return localStorage.getItem('client_id');
  }

  setClientId(id: string): void {
    localStorage.setItem('client_id', id);
  }
}