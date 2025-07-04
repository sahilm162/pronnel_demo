import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { API_BASE_URL } from "../constants/api.constant";
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root'})
export class AuthService {
    // private loginUrl = `${API_BASE_URL}/api/user/sessions`;

    constructor(private http: HttpClient, private router: Router) {}

    login(username: string, password: string) {
        const clientId = uuidv4();
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            // Authorization: 'Basic ' + btoa(`${username}: ${password}`)
            Authorization: 'Basic ' + btoa(`amanjhavdjs12tha+1@gmail.com:Pronnel@2025`)
        });

        // return this.http.post(this.loginUrl, { client_id: clientId }, { headers, observe: 'response'});
        return this.http.post(`/api/user/sessions`, { client_id: clientId }, {
    headers,
    observe: 'response',
  });
    }

    saveLoginDetails(response: any){
        const user = response.body;
        const headers = response.headers;
        localStorage.setItem('x-auth-token', headers.get('x-auth-token') || '');
        localStorage.setItem('refresh-token', headers.get('refresh-token') || '');
        localStorage.setItem('user', JSON.stringify(user));
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('x-auth-token');
    }

    logout(): void {
        localStorage.clear();
        this.router.navigate(['/login']);
    }

    getUser(): any {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}