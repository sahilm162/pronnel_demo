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
  sortField: string = 'name';
  sortOrder: 'ASC' | 'DESC' = 'ASC';
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
    roles: this.filterRoles,
    from: this.startDate ? new Date(this.startDate).getTime() : null,
    to: this.endDate ? new Date(this.endDate).getTime() : null,
    sortField: this.sortField,
    sortOrder: this.sortOrder,
    pageSize: 20,
    pageNumber: this.currentPage
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

  applySort(field: string): void {
  if (this.sortField === field) {
    this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
  } else {
    this.sortField = field;
    this.sortOrder = 'ASC';
  }

  this.currentPage = 1;
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

  async deleteUser(): Promise<void> {
    if (!this.selectedUserIdToDelete) return;

    const token = localStorage.getItem('x-auth-token') || '';

    try {
      const res = await fetch(`${this.BASE_URL}/user/${this.selectedUserIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'authorization': token,
          'content-type': 'application/json',
        }
      });

      if (res.ok) {
        this.users = this.users.filter(user => user._id !== this.selectedUserIdToDelete);
        this.totalUsers -= 1;
        this.showDeleteConfirm = false;
        this.selectedUserIdToDelete = null;
        this.toast.show('User Deleted successfully', 'success');
      } else {
        this.toast.show('Failed to delete user.', 'error');
      }
    } catch (err) {
      this.toast.show('Something went wrong while deleting.', 'error');
    }
  }

onEdit(user: any): void {
  this.selectedUser = user;
  this.showEditDialog = true;
}

closeEditDialog(): void {
  this.showEditDialog = false;
}

}