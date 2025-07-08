import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

interface UserImage {
  url: string;
}

interface UserData {
  name: string;
  role: string;
  image: UserImage | null;
}

@Component({
  selector: 'app-edit-user-dialog',
  templateUrl: './edit-user-dialog.component.html',
  styleUrls: ['./edit-user-dialog.component.css']
})
export class EditUserDialogComponent {
  @Input() userData: any;
  @Input() isEdit = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() userAdded = new EventEmitter<void>();

  private readonly BASE_URL = environment.BASE_URL;  

   user: UserData = {
    name: '',
    role: '',
    image: null
  };

  inviteForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.inviteForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      isAdmin: [false],
      isUser: [true]
    });
  }

  ngOnChanges(): void {
    if (this.userData && this.isEdit) {
      this.inviteForm.patchValue({
        name: this.userData.name,
        email: this.userData.email,
        isAdmin: this.userData.role === 'Admin',
        isUser: this.userData.role === 'User'
      });
    }
  }

  closeDialog() {
    this.close.emit();
  }

  updateUserProfile(): void {
    if (this.inviteForm.invalid || !this.userData?._id) return;

    const updateData = {
    name: this.inviteForm.get('name')?.value,
    email: this.inviteForm.get('email')?.value,
    role: this.inviteForm.get('isAdmin')?.value ? 'Admin' : 'User',
  };


    const userId = this.userData._id;

  this.http.put(`${this.BASE_URL}/user/${userId}`, updateData).subscribe({
    next: (res) => {
      console.log('User updated successfully:', res);
      this.userAdded.emit();
      this.close.emit();
    },
    error: (err) => {
      console.error('Error updating user:', err);
    }
  });
}
}