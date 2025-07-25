import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  showPassword: boolean = false;
  errorMessage = '';
  showForgotDialog: boolean = false;

  constructor(private fb: FormBuilder, private router: Router, private auth: AuthService, private toast: ToastService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
  if (this.auth.isLoggedIn()) {
    this.router.navigate(['/home']);
  }
}

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.toast.show('Logged In successfully', 'success');
        this.auth.saveLoginData(res);
        setTimeout(() => {
        this.router.navigate(['/home']);
      }, 50);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Login failed. Please try again.';
        this.toast.show(errorMsg, 'error');
      }
    });
  }

  onForgotPasswordClick() {
    this.showForgotDialog = true;
  }

  closeForgotDialog() {
    console.log('closeForgotDialog called');
    this.showForgotDialog = false;
  }
}