import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.css'],
})
export class UserDialogComponent {
  @Output() close = new EventEmitter<void>();
  @Output() userAdded = new EventEmitter<void>();

  private readonly BASE_URL = environment.BASE_URL;
  private readonly ORG_ID = environment.ORGANIZATION_ID;

  @ViewChild('nameInput') nameInputRef!: ElementRef;
  inviteForm: FormGroup;
  isEdit = false; 

  constructor(private fb: FormBuilder, private http: HttpClient, private toast: ToastService) {
    this.inviteForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.nameInputRef?.nativeElement?.focus();
    });
  }

  closeDialog() {
    this.close.emit();
  }

  onRoleChange(role: 'ADMIN' | 'SALES') {
    const currentRole = this.inviteForm.get('role')?.value;
    this.inviteForm.get('role')?.setValue(currentRole === role ? '' : role);
  }

  onSubmit() {
  this.inviteForm.markAllAsTouched();
  if (this.inviteForm.invalid) return;

  this.sendInviteRequest(() => {
    this.userAdded.emit();
    this.toast.show('User invited successfully', 'success');
    this.close.emit();
  });
}

onInviteAndNext() {
  this.inviteForm.markAllAsTouched();
  if (this.inviteForm.invalid) return;

  this.sendInviteRequest(() => {
    this.toast.show('User invited successfully', 'success');
    this.inviteForm.reset();
  });
}

private sendInviteRequest(callback: () => void) {
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const token = userData?.token || '';

  const formValue = {
    name: this.inviteForm.get('name')?.value,
    email: this.inviteForm.get('email')?.value,
    role: this.inviteForm.get('role')?.value,
    title_id: null,
    parent_users: [],
    bucket_id: [],
    dashboards_id: []
  };

  const headers = new HttpHeaders({
    'Authorization': token,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  this.http.post(`${this.BASE_URL}/organisation/${this.ORG_ID}/user`, formValue, { headers })
    .subscribe({
      next: () => {
        callback();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Failed to invite user';
        this.toast.show(errorMsg, 'error');
      }
    });
}
}