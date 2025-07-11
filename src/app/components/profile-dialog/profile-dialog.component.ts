import { Component, EventEmitter, Output, Input, SimpleChanges } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

interface UserImage {
  url: string;
}

interface Mobile {
  country_code: string;
  mobile_number: string;
}

interface UserData {
  _id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  image: UserImage | null;
  mobile?: Mobile;
}


@Component({
  selector: 'app-profile-dialog',
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.css']
})

export class ProfileDialogComponent {
  @Input() userData: any;
  @Output() clickOutside = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();
  private readonly BASE_URL = environment.BASE_URL;  

  user: UserData = {
    name: '',
    email: '',
    mobile: {
    country_code: '+91',
    mobile_number: ''
    },
    role: '',
    status: '',
    image: null
  };

  defaultAvatar = 'assets/avatar-placeholder.jpg';

  constructor(private auth: AuthService, private http: HttpClient) {
    const currentUser = this.auth.getUser();
    this.user.name = currentUser?.name || '';
    this.user.mobile = currentUser?.mobile || {
    country_code: '+91',
    mobile_number: ''
  };
    this.user.email = currentUser?.email || '';
    this.user.role = currentUser?.role || '';
    this.user.status = currentUser?.status || 'ACTIVE';
    this.user.image = currentUser?.image || null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userData'] && this.userData) {
      this.user.name = this.userData.name || '';
      this.user.mobile = this?.userData?.mobile || {
        country_code: '+91',
        mobile_number: ''
      };
      this.user.email = this.userData.email || '';
      this.user.role = this.userData.role || '';
      this.user.status = this.userData.status || '';
      this.user.image = this.userData.image || null;
    } else {
      const currentUser = this.auth.getUser();
      this.user.name = currentUser?.name || '';
      this.user.mobile = currentUser?.mobile || {
        country_code: '+91',
        mobile_number: ''
      };
      this.user.email = currentUser?.email || '';
      this.user.role = currentUser?.role || '';
      this.user.status = currentUser?.status || '';
      this.user.image = currentUser?.image || null;
    }
  }

  setStatus(status: 'ACTIVE' | 'INACTIVE') {
    this.user.status = status;
  }


updateUserProfile(): void {
  const token = JSON.parse(localStorage.getItem('user') || '{}')?.token || '';
  const userId = JSON.parse(localStorage.getItem('user') || '{}')?.user_id;

  if (!userId) {
    console.error('User ID not found.');
    return;
  }

  const headers = new HttpHeaders({
    'Authorization': token,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  const updateData = {
    name: this.user.name,
    role: this.user.role || 'ADMIN',
    parent_users: []
  };

  this.http.patch(`${this.BASE_URL}/user/${userId}`, updateData, { headers }).subscribe({
    next: (res) => {
      console.log('User profile updated via PATCH:', res);
      this.closeDialog();
    },
    error: (err) => {
      console.error('Error updating profile via PATCH:', err);
    }
  });
}

  closeDialog(): void {
    this.clickOutside.emit();
  }
}
