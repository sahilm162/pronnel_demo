import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from 'src/app/services/auth.service';
import { environment } from 'src/environments/environment';

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
  

  constructor(private userService: UserService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    const currentUser = this.auth.getUser();
    const token = localStorage.getItem('x-auth-token') || '';

    const entityId = currentUser?.org_id;
    if (!entityId) {
      console.error('Entity ID not found. Cannot fetch users.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${this.BASE_URL}/user/query`, {
          method: "POST",
          headers: {
            "accept": "application/json, text/plain, */*",
            "authorization": token,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            pagination_details: {}
          })
        });

        const data = await res.json();
        this.users = data?.responseData || [];
        this.totalUsers = data?.pagination_details?.total_records || 0;
      } catch (err) {
        console.error('User Fetch Error:', err);
      }
    })();
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
    console.log('Role:', this.filterRole);
    console.log('Start Date:', this.startDate);
    console.log('End Date:', this.endDate);

    this.closeFilterPanel();
  }

  onSearch(): void {
    console.log('Search triggered:', this.searchText);
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

    console.log('Sorting by:', this.sortField, this.sortOrder);
    this.loadUsers();
  }

  closeInviteDialog() {
    this.showInviteDialog = false;
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
        console.log('User deleted');
        this.showDeleteConfirm = false;
        this.selectedUserIdToDelete = null;
        this.loadUsers();
      } else {
        console.error('Failed to delete user:', await res.text());
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  openAddUserDialog() {
  this.isEdit = false;
  this.editUserData = null;
  this.showUserDialog = true;
}

closeUserDialog() {
  this.showUserDialog = false;
}

onEdit(user: any): void {
  this.selectedUser = user;
  this.showEditDialog = true;
}

closeEditDialog(): void {
  this.showEditDialog = false;
}

}