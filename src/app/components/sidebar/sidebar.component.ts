import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Output() openProfileDialog = new EventEmitter<void>();

  isCollapsed: boolean = true;
  user: any;
  profileImageUrl: string | null = null;
  showInviteDialog = false;
  showSettingsDropdown = false;
  showChangePasswordDialog = false;
  showForgotDialog = false;
  isMobile: boolean = false;
  isMobileSidebarOpen: boolean = false;
  showThemeDialog = false;

  constructor(private auth: AuthService, private userService: UserService) {}

  ngOnInit(): void {
    this.checkScreen();
    window.addEventListener('resize', this.checkScreen.bind(this));
    this.loadUserFromStorage();

    window.addEventListener('user-updated', () => {
      this.loadUserFromStorage();
    });
  }

  loadUserFromStorage() {
    this.user = this.auth.getUser();
    if (this.user?.user_id) {
      this.loadUserImage(this.user.user_id);
    }
  }

  checkScreen() {
    this.isMobile = window.innerWidth < 821;
    if (!this.isMobile) this.isMobileSidebarOpen = false;
  }

  toggleSidebar(open?: boolean) {
    if (this.isMobile) {
      this.isMobileSidebarOpen = open ?? !this.isMobileSidebarOpen;
      this.isCollapsed = false;
    } else {
      if (typeof open === 'boolean') {
        this.isCollapsed = !open;
      } else {
        this.isCollapsed = !this.isCollapsed;
      }
    }
  }

  loadUserImage(userId: string): void {
    this.userService.getUserProfileImage(userId).subscribe({
      next: (res) => {
        const image = res?.images?.[0];
        this.profileImageUrl = image?.image_download_url || null;
      },
      error: (err) => {
        console.error('Failed to load profile image', err);
        this.profileImageUrl = null;
      }
    });
  }

  openAddUserDialog() {
    this.showInviteDialog = true;
  }

  closeInviteDialog() {
    this.showInviteDialog = false;
  }

  onProfileClick(): void {
    this.openProfileDialog.emit();
  }

  toggleSettingsDropdown(): void {
    this.showSettingsDropdown = !this.showSettingsDropdown;
  }

  closeSettingsDropdown(): void {
    this.showSettingsDropdown = false;
  }

  onLogout(): void {
    this.closeSettingsDropdown(); 
    this.auth.logoutFromServer();
  }

  onChangePassword() {
    this.showChangePasswordDialog = true;
    this.closeSettingsDropdown();
  }

  closeChangePasswordDialog() {
    this.showChangePasswordDialog = false;
  }

  onForgotPassword(): void {
    this.showForgotDialog = true;
    this.closeSettingsDropdown();
  }

  toggleThemeDialog() {
    this.showThemeDialog = true;
  }
}