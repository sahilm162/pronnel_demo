import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './homepage.component.html'
})
export class HomepageComponent implements OnInit {
  firstName: string = '';

  constructor(private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.getUser();
    this.firstName = user?.name || '';
  }
}