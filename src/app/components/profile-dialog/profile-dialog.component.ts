import { Component, EventEmitter, Output, Input, SimpleChanges } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { UserService } from 'src/app/services/user.service';
import { ToastService } from 'src/app/shared/toast.service';

@Component({
  selector: 'app-profile-dialog',
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.css']
})
export class ProfileDialogComponent {
  @Output() clickOutside = new EventEmitter<void>();
  @Output() profileUpdated = new EventEmitter<void>();
  @Output() userChanged = new EventEmitter<any>();
  @Input() users: any[] = [];
  currentUserId: string = '';
  user: any = null;

  private readonly BASE_URL = environment.BASE_URL;

  name: string = '';
  role: string = 'ADMIN';

constructor(private http: HttpClient, private userService: UserService, private toast: ToastService) {}

  ngOnInit(): void {
  const localUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localUser?.token || '';
  const email = localUser?.email;

  if (!token || !email) {
    console.warn('User token or email not found.');
    return;
  }

  const headers = new HttpHeaders({
    'Authorization': token,
    'Content-Type': 'application/json'
  });

  const body = {
    pagination_details: {},
    search_params: {
      search_text: email,
      search_columns: ['email']
    }
  };

  this.http.post(`${this.BASE_URL}/user/query`, body, { headers }).subscribe({
    next: (res: any) => {
      const userData = res?.responseData?.[0];
      if (userData) {
        this.user = userData;
        if (userData) {
      userData.status = userData.status?.toUpperCase();
      this.user = userData;
    } else {
      this.toast.show('User not found in API response.', 'error');
    }
      } else {
        this.toast.show('User not found in API response.', 'error');
      }
    },
    error: (err) => {
      const errorMsg = err?.error?.message || 'Error fetching user';
      this.toast.show(errorMsg, 'error');
    }
  });
}

setStatus(status: 'ACTIVE' | 'INACTIVE') {
  if (this.user) {
    this.user.status = status;
  }
}

  updateUserProfile(): void {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = user?.token || '';
  const userId = user?.user_id;

  if (!userId || !token) {
    console.error('User ID or token not found.');
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
    parent_users: [],
  };

  this.http.patch(`${this.BASE_URL}/user/${userId}`, updateData, { headers }).subscribe({
    next: (res) => {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.name = this.user.name;
      storedUser.role = this.user.role;
      localStorage.setItem('user', JSON.stringify(storedUser));
      window.dispatchEvent(new Event('user-updated'));
      this.userService.setCurrentUser({ ...this.user });
      this.toast.show('Profile Updated successfully', 'success');
      this.profileUpdated.emit();
      this.closeDialog();
    },
    error: (err) => {
      this.toast.show('Error updating profile', 'error');
    }
  });
}

  closeDialog(): void {
    this.clickOutside.emit();
  }
}