import { Component, EventEmitter, Output, Input, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/shared/toast.service';

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

  readonly BASE_URL = environment.BASE_URL;
  inviteForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient, private toast: ToastService) {
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

    const token = JSON.parse(localStorage.getItem('user') || '{}')?.token || '';
    const userId = this.userData._id;

    const updateData = {
      name: this.inviteForm.get('name')?.value,
      role: this.inviteForm.get('role')?.value,
      title_id: null,
      parent_users: []
    };

    const headers = new HttpHeaders({
      'Authorization': token,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    this.http.patch(`${this.BASE_URL}/user/${userId}`, updateData, { headers })
      .subscribe({
        next: (res) => {
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