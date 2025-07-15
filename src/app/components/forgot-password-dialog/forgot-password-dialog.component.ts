import {
  Component,
  Output,
  EventEmitter,
  OnInit
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/shared/toast.service';

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
  readonly BASE_URL = environment.BASE_URL;

  constructor(private fb: FormBuilder, private http: HttpClient, private toast: ToastService) {}

  ngOnInit(): void {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) return;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
  email: this.forgotForm.value.email,
  forgot_2fa: false
};

    this.http.post(`${this.BASE_URL}/user/forgotpassword`, body, { headers })
      .subscribe({
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
    console.log("closeeeee")
    this.closeDialog.emit();
  }
}