import { Component, EventEmitter, Output, Input, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from 'src/app/shared/toast.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.css']
})
export class EditUserDialogComponent implements OnChanges {
  @Input() userData: any;
  @Input() isEdit = false;
  @Output() close = new EventEmitter<void>();
  @Output() userAdded = new EventEmitter<any>();

  inviteForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private toast: ToastService,
    private userService: UserService
  ) {
    this.inviteForm = this.fb.group({
      name: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      role: ['', Validators.required]
    });
  }

  ngOnChanges(): void {
    if (this.userData) {
      this.inviteForm.patchValue({
        name: this.userData.name || '',
        email: this.userData.email || '',
        role: this.userData.role?.toUpperCase() === 'SALES' ? 'SALES' : 'ADMIN'
      });
    }
  }

  onRoleChange(role: 'ADMIN' | 'SALES') {
    const currentRole = this.inviteForm.get('role')?.value;
    this.inviteForm.get('role')?.setValue(currentRole === role ? '' : role);
  }

  closeDialog() {
    this.close.emit();
  }

  updateUserProfile(): void {
    if (this.inviteForm.invalid || !this.userData?._id) return;

    const updateData = {
      name: this.inviteForm.get('name')?.value,
      role: this.inviteForm.get('role')?.value,
      title_id: null,
      parent_users: []
    };

    this.userService.updateUser(this.userData._id, updateData).subscribe({
      next: () => {
        this.toast.show('User updated successfully', 'success');
        const updatedUser = { ...this.userData, ...updateData };
        this.userAdded.emit(updatedUser);
        this.close.emit();
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Error updating user';
        this.toast.show(errorMsg, 'error');
      }
    });
  }
}