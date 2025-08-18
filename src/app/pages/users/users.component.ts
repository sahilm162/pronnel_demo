import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';
import { ToastService } from 'src/app/shared/toast.service';
import { LoggerService } from 'src/app/services/logger.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  @Output() openProfileDialog = new EventEmitter<void>();
  private readonly BASE_URL = environment.BASE_URL;

  users: any[] = [];
  currentPage = 1;
  totalUsers = 0;
  searchText: string = '';
  isFilterOpen = false;
  filterRole: string = '';
  startDate: string = '';
  endDate: string = '';
  filters: any = {};
  sortField: string | null = null;
  sortOrder: 'ASC' | 'DESC' | null = null;
  showInviteDialog = false;
  showDeleteConfirm = false;
  selectedUserIdToDelete: string | null = null;
  showUserDialog = false;
  isEdit = false;
  editUserData: any = null;
  selectedUser: any = null;
  showEditDialog: boolean = false;
  expandedUser: any = null;
  isMobileView: boolean = false;
  showMobileSearch: boolean = false;
  filterRoles: string[] = [];
  

  constructor(private userService: UserService, private auth: AuthService, private toast: ToastService, private logger: LoggerService) {}

  ngOnInit(): void {
    this.checkScreenSize();
  window.addEventListener('resize', this.checkScreenSize.bind(this));
  this.loadUsers();

  this.userService.currentUser$.subscribe((updatedUser) => {
    if (updatedUser?._id) {
      const index = this.users.findIndex(u => u._id === updatedUser._id);
      if (index !== -1) {
        this.users[index] = { ...this.users[index], ...updatedUser };
      }
    }
  });
}

checkScreenSize() {
  this.isMobileView = window.innerWidth < 821;
}

toggleMobileSearch() {
  this.showMobileSearch = !this.showMobileSearch;
}

  loadUsers(): void {
  const currentUser = this.auth.getUser();
  const entityId = currentUser?.org_id;

  if (!entityId) {
    console.error('Entity ID not found. Cannot fetch users.');
    return;
  }

  const filters: any = {
    searchText: this.searchText.trim(),
    roles: this.filterRole,
    from: this.startDate ? new Date(this.startDate).getTime() : null,
    to: this.endDate ? new Date(this.endDate).getTime() : null,
    sortField: this.sortField ?? undefined,
    sortOrder: this.sortOrder ?? undefined,
    pageSize: 20,
    pageNumber: this.currentPage,
  };

  this.logger.info('Applying filters & sorting to user query', filters);

  this.userService.getUsersWithFilters(filters).subscribe({
    next: (data: any) => {
      this.users = data?.responseData || [];
      this.totalUsers = data?.pagination_details?.total_records || 0;
    },
    error: (err) => {
      console.error('User Fetch Error:', err);
      this.toast.show('Failed to load users', 'error');
    }
  });
}

  refreshUserList() {
    this.loadUsers();
  }

  toggleFilterPanel() {
    this.isFilterOpen = !this.isFilterOpen;
  }

  closeFilterPanel() {
    this.isFilterOpen = false;
  }

  applyFilters() {
    this.loadUsers();
    this.isFilterOpen = false;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  applySort(field: string) {
  if (this.sortField !== field) {
    this.sortField = field;
    this.sortOrder = 'ASC';
  } else {
    this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : (this.sortOrder === 'DESC' ? null : 'ASC');
    if (this.sortOrder === null) this.sortField = null;
  }
  this.loadUsers();
}

openInviteDialog() {
    this.showInviteDialog = true;
  }

  closeInviteDialog() {
    this.showInviteDialog = false;
  }

  toggleExpanded(user: any) {
  this.expandedUser = this.expandedUser === user ? null : user;
}

  handleUserChange() {
    this.loadUsers();
    this.showInviteDialog = false;
  }

  confirmDelete(userId: string): void {
    this.selectedUserIdToDelete = userId;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.selectedUserIdToDelete = null;
    this.showDeleteConfirm = false;
  }

  handleUserAdd(newUser: any) {
  this.users.unshift(newUser);
  this.totalUsers++;
  this.closeInviteDialog();
}

deleteUser(): void {
  if (!this.selectedUserIdToDelete) return;

  const userId = this.selectedUserIdToDelete;
  this.userService.deleteUser(userId).subscribe({
    next: () => {
      this.users = this.users.filter(u => u._id !== userId);
      this.totalUsers = Math.max(0, this.totalUsers - 1);

      this.showDeleteConfirm = false;
      this.selectedUserIdToDelete = null;

      this.toast.show('User deleted successfully', 'success');
    },
    error: (err) => {
      this.logger.error('Delete user failed', err);
      this.toast.show('Failed to delete user.', 'error');
    }
  });
}

onEdit(user: any): void {
  this.selectedUser = user;
  this.showEditDialog = true;
}

closeEditDialog(): void {
  this.showEditDialog = false;
}

}