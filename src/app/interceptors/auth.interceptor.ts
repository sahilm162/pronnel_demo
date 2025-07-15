import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('x-auth-token');
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        } else {
          return throwError(() => error);
        }
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: token
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const client_id = localStorage.getItem('client_id') || '';
      const refreshToken = localStorage.getItem('refresh-token') || '';

      const refreshPayload = {
        refresh_token: refreshToken,
        client_id: client_id,
        server_unique_id: user.server_unique_id || '',
        organization_id: user.org_id || '',
        user_id: user.user_id || ''
      };
      console.log('🔁 Refreshing token with:', refreshPayload);

      if (!refreshToken) {
        return throwError(() => new Error('No refresh token'));
      }

      return this.authService.refreshToken(refreshPayload).pipe(
        switchMap((res: any) => {
          this.isRefreshing = false;
          const newToken = res.token;
          localStorage.setItem('x-auth-token', newToken);
          if (res.refresh_token) {
            localStorage.setItem('refresh-token', res.refresh_token);
          }
          this.refreshTokenSubject.next(res.token);
          return next.handle(this.addToken(request, newToken));
        }),
        catchError(err => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => err);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => next.handle(this.addToken(request, token!)))
      );
    }
  }
}