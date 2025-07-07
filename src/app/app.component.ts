import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Pronnel';
  showProfile = false; 

  isLoggedIn(): boolean {
    return !!localStorage.getItem('x-auth-token');
  }
}
