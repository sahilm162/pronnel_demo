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
  const body = {
    email: email,
    password: password,
    client_id: clientId
  };

  const headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  console.log('Login Payload:', body);
console.log('Headers:', headers);

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

  getUser() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  }
}