import { Component } from '@angular/core';
import { ToastService, ToastType } from './shared/toast.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Pronnel';
  showProfile = false;
  toast = { message: '', type: 'success' as ToastType };

  constructor(private toastService: ToastService) {
    this.toastService.toast$.subscribe((data) => {
      this.toast = data;

      setTimeout(() => {
        this.toast.message = '';
      }, 3000);
    });
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('x-auth-token');
  }

  ngOnInit(): void {
  const savedTheme = localStorage.getItem('selectedTheme') || 'light-default';
  document.body.classList.add(savedTheme);
}
}
