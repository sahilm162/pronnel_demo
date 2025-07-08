import { Component, EventEmitter, Output, Input, SimpleChanges } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
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
  selector: 'app-profile-dialog',
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.css']
})

export class ProfileDialogComponent {
  @Input() userData: any;
  @Output() clickOutside = new EventEmitter<void>();
  private readonly BASE_URL = environment.BASE_URL;  

  user: UserData = {
    name: '',
    role: '',
    image: null
  };

  defaultAvatar = 'assets/avatar-placeholder.jpg';

  constructor(private auth: AuthService, private http: HttpClient) {
    const currentUser = this.auth.getUser();
    this.user.name = currentUser?.name || '';
    this.user.role = currentUser?.role || '';
    this.user.image = currentUser?.image || null;
    console.log('ProfileDialogComponent - image URL from auth user:', this.user.image);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userData'] && this.userData) {
      // If data is passed from outside, use it
      this.user.name = this.userData.name || '';
      this.user.role = this.userData.role || '';
      this.user.image = this.userData.image || null;
      console.log('ProfileDialogComponent - image URL from userData:', this.user.image);
    } else {
      // Otherwise, show logged-in user
      const currentUser = this.auth.getUser();
      this.user.name = currentUser?.name || '';
      this.user.role = currentUser?.role || '';
      this.user.image = currentUser?.image || null;
    }
  }

  updateUserProfile(): void {
    const updateData: any = {
      name: this.user.name,
      role: this.user.role,
      image: this.user.image
    };

    this.http.put(`${this.BASE_URL}/user/profile`, updateData).subscribe({
      next: (res) => {
        console.log('User profile updated successfully', res);
      },
      error: (err) => {
        console.error('Error updating user profile', err);
      }
    });
  }

  closeDialog(): void {
    this.clickOutside.emit();
  }
}
