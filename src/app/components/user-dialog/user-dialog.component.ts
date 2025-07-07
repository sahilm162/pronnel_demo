import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.css'],
})
export class UserDialogComponent {
  @Output() close = new EventEmitter<void>();

  inviteForm: FormGroup;
  isEdit = false; 

  constructor(private fb: FormBuilder) {
    this.inviteForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      isAdmin: [false],
    });
  }

  closeDialog() {
    this.close.emit();
  }

  onSubmit() {
    if (this.inviteForm.invalid) return;

    const formValue = {
      name: this.inviteForm.get('name')?.value,
      email: this.inviteForm.get('email')?.value,
      role: this.inviteForm.get('isAdmin')?.value ? 'Admin' : 'User',
    };

    console.log('Submitted user data:', formValue);

    this.close.emit();
  }
}