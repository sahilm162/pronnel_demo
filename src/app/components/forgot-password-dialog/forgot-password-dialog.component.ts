import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/shared/toast.service';
import { AuthService } from 'src/app/services/auth.service'; // ✅ Import service

@Component({
  selector: 'app-forgot-password-dialog',
  templateUrl: './forgot-password-dialog.component.html',
  styleUrls: ['./forgot-password-dialog.component.css']
})
export class ForgotPasswordDialogComponent implements OnInit {
  @Output() closeDialog = new EventEmitter<void>();

  forgotForm!: FormGroup;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: (res: any) => {
        this.toast.show(res.message || 'Check your email for reset instructions.', 'success');
        this.errorMessage = '';
        setTimeout(() => this.closeDialog.emit(), 1500);
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Something went wrong.';
        this.toast.show(errorMsg, 'error');
        this.successMessage = '';
        setTimeout(() => this.closeDialog.emit(), 1500);
      }
    });
  }

  close() {
    this.closeDialog.emit();
  }
}