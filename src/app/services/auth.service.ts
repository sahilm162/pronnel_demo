import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = environment.BASE_URL;

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
  const clientId = uuidv4()
  localStorage.setItem('client_id', clientId);
  const body = {
    email: email,
    password: password,
    client_id: clientId
  };

  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  return this.http.post(`${this.baseUrl}/user/login`, body, {
    headers,
    observe: 'response'
  });
}

  saveLoginData(response: any) {
  const userData = response.body;

  const authToken = userData.token;
  const refreshToken = userData.refresh_token;
  const serverUniqueId = userData.server_unique_id;
  const orgId = userData.orgid;
  const userId = userData.user_id;

  localStorage.setItem('x-auth-token', authToken || '');
  localStorage.setItem('refresh-token', refreshToken || '');
  localStorage.setItem('server_unique_id', serverUniqueId || '');
  localStorage.setItem('organization_id', orgId || '');
  localStorage.setItem('user_id', userId || '');
  localStorage.setItem('user', JSON.stringify(userData));
}

  isLoggedIn(): boolean {
    return !!localStorage.getItem('x-auth-token');
  }

  refreshToken(payload: {
  refresh_token: string;
  client_id: string;
  server_unique_id: string;
  organization_id: string;
  user_id: string;
}): Observable<any> {
  return this.http.post(`${this.baseUrl}/user/refreshtoken`, payload);
}

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  getUser(): any {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }

  logoutFromServer(): void {
  const token = localStorage.getItem('x-auth-token') || '';
  const client_id = localStorage.getItem('client_id') || '';

  if (!client_id) {
    console.warn('Client ID not found for logout');
    return;
  }

  const headers = new HttpHeaders({
    'Authorization': token,
    'Content-Type': 'application/json'
  });

  const body = { client_id };

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
}