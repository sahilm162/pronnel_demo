import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/shared/toast.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.css'],
})
export class UserDialogComponent implements AfterViewInit {
  @Output() close = new EventEmitter<void>();
  @Output() userAdded = new EventEmitter<void>();

  @ViewChild('nameInput') nameInputRef!: ElementRef;
  inviteForm: FormGroup;
  isEdit = false; 

  private readonly ORG_ID = environment.ORGANIZATION_ID;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private toast: ToastService
  ) {
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

    this.sendInvite(() => {
      this.userAdded.emit();
      this.toast.show('User invited successfully', 'success');
      this.close.emit();
    });
  }

  onInviteAndNext() {
    this.inviteForm.markAllAsTouched();
    if (this.inviteForm.invalid) return;

    this.sendInvite(() => {
      this.toast.show('User invited successfully', 'success');
      this.inviteForm.reset();
    });
  }

  private sendInvite(callback: () => void) {
    const formValue = {
      name: this.inviteForm.get('name')?.value,
      email: this.inviteForm.get('email')?.value,
      role: this.inviteForm.get('role')?.value,
      title_id: null,
      parent_users: [],
      bucket_id: [],
      dashboards_id: []
    };

    this.userService.inviteUser(this.ORG_ID, formValue).subscribe({
      next: () => callback(),
      error: (err) => {
        const errorMsg = err?.error?.message || 'Failed to invite user';
        this.toast.show(errorMsg, 'error');
      }
    });
  }
}