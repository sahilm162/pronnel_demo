import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { environment } from 'src/environments/environment';
import { Observable, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { HttpService } from './http.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.BASE_URL;

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService,
    private httpService: HttpService
  ) { }

  login(email: string, password: string) {
    const clientId = uuidv4();
    this.tokenService.setClientId(clientId);

    const body = { email, password, client_id: clientId };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post(`${this.baseUrl}/user/login`, body, {
      headers,
      observe: 'response'
    });
  }

  saveLoginData(response: any) {
    const userData = response.body;

    this.tokenService.setAccessToken(userData.token || '');
    this.tokenService.setRefreshToken(userData.refresh_token || '');
    this.tokenService.setUser(userData);
  }

  isLoggedIn(): boolean {
    return !!this.tokenService.getAccessToken();
  }

  refreshAuthToken(payload?: {
    refresh_token?: string;
    client_id?: string;
    server_unique_id?: string;
    organization_id?: string;
    user_id?: string;
  }): Observable<any> {
    let finalPayload = payload;

    if (!finalPayload) {
      const user = this.tokenService.getUser();
      const refreshToken = this.tokenService.getRefreshToken();
      const clientId = this.tokenService.getClientId();

      if (!refreshToken) {
        return throwError(() => new Error('No refresh token'));
      }

      finalPayload = {
        refresh_token: refreshToken,
        client_id: clientId || '',
        server_unique_id: user.server_unique_id || '',
        organization_id: user.org_id || '',
        user_id: user.user_id || ''
      };
    }

    return this.httpService.post('/user/refreshtoken', finalPayload);
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getUser(): any {
    return this.tokenService.getUser();
  }

  logoutFromServer(): void {
    const token = this.tokenService.getAccessToken() || '';
    const clientId = this.tokenService.getClientId();

    if (!clientId) {
      console.warn('Client ID not found for logout');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: token,
      'Content-Type': 'application/json'
    });

    const body = { client_id: clientId };

    this.http.post(`${this.baseUrl}/user/logout`, body, { headers }).subscribe({
      next: () => {
        console.log('Successfully logged out from server');
        this.logout();
      },
      error: (err) => {
        console.error('Logout failed, proceeding with client logout:', err);
        this.logout();
      }
    });
  }

  changePassword(oldPassword: string, newPassword: string) {
    const body = {
      oldpassword: oldPassword,
      newpassword: newPassword
    };
    return this.httpService.post('/user/changepassword', body);
  }

  forgotPassword(email: string, forgot2FA: boolean = false) {
    const body = {
      email,
      forgot_2fa: forgot2FA
    };
    return this.httpService.post('/user/forgotpassword', body);
  }
}