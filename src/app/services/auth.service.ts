import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { environment } from 'src/environments/environment';

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

  localStorage.setItem('x-auth-token', authToken || '');
  localStorage.setItem('refresh-token', refreshToken || '');
  localStorage.setItem('user', JSON.stringify(userData));
}

  isLoggedIn(): boolean {
    return !!localStorage.getItem('x-auth-token');
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