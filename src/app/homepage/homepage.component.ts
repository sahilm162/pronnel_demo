import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-homepage',
  template: `
    <div class="container mt-5">
      <h2>Welcome {{ firstName }}</h2>
    </div>
  `
})
export class HomepageComponent {
  firstName: string = '';

  constructor(private auth: AuthService) {
    const user = this.auth.getUser();
    this.firstName = user?.first_name || 'User';
  }
}