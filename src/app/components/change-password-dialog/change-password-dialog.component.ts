import { Component, EventEmitter, Output, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/shared/toast.service';
import { AuthService } from 'src/app/services/auth.service';

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

  constructor(private fb: FormBuilder, private toast: ToastService, private authService: AuthService,) {
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

  this.authService.changePassword(oldPassword, newPassword).subscribe({
    next: () => {
      this.toast.show('Password changed successfully', 'success');
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