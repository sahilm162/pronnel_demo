import { Component, EventEmitter, Output, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-change-password-dialog',
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.css']
})
export class ChangePasswordDialogComponent {
  @Output() closeDialog = new EventEmitter<void>();
    @ViewChild('oldPasswordInput') oldPasswordInput!: ElementRef<HTMLInputElement>;


  passwordForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  BASE_URL = environment.BASE_URL;

  constructor(private fb: FormBuilder, private http: HttpClient, private toast: ToastService) {
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.oldPasswordInput?.nativeElement?.focus();
    }, 0);
  }

  onSubmit(): void {
    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.errorMessage = "New password and confirm password do not match.";
      return;
    }

    const token = localStorage.getItem('x-auth-token') || '';

    const headers = new HttpHeaders({
      'Authorization': token,
      'Content-Type': 'application/json'
    });

    const body = {
      oldpassword: oldPassword,
      newpassword: newPassword
    };

    this.http.post(`${this.BASE_URL}/user/changepassword`, body, { headers }).subscribe({
      next: () => {
        this.toast.show('Password Changed successfully', 'success');
        this.passwordForm.reset();
        setTimeout(() => this.closeDialog.emit(), 1500);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Failed to change password.';
        this.toast.show(errorMsg, 'error');
      }
    });
  }

  close(): void {
    this.closeDialog.emit();
  }
}