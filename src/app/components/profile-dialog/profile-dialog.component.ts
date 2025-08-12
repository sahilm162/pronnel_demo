import { Component, EventEmitter, Output, Input } from '@angular/core';
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
  name: string = '';
  role: string = 'ADMIN';

  constructor(private userService: UserService, private toast: ToastService) {}

  ngOnInit(): void {
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    const email = localUser?.email;

    if (!email) {
      console.warn('User email not found.');
      return;
    }

    this.userService.getUserByEmail(email).subscribe({
      next: (res) => {
        const userData = res?.responseData?.[0];
        if (userData) {
          userData.status = userData.status?.toUpperCase();
          this.user = userData;
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
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = localUser?.user_id;

    if (!userId) {
      console.error('User ID not found.');
      return;
    }

    const updateData = {
      name: this.user.name,
      role: this.user.role || 'ADMIN',
      parent_users: []
    };

    this.userService.updateUser(userId, updateData).subscribe({
      next: () => {
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
      error: () => {
        this.toast.show('Error updating profile', 'error');
      }
    });
  }

  closeDialog(): void {
    this.clickOutside.emit();
  }
}