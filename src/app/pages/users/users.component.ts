import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: any[] = [];
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  searchText: string = '';
  isFilterOpen = false;
  filterRole: string = '';
startDate: string = '';
endDate: string = '';
  filters: any = {};
  sortField: string = 'name';
sortOrder: 'ASC' | 'DESC' = 'ASC';

  constructor(private userService: UserService, private auth: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    const currentUser = this.auth.getUser();
    console.log('Current user:', currentUser);

const token = currentUser?.token;

    const entityId = currentUser?.org_id;
    if (!entityId) {
      console.error('Entity ID not found. Cannot fetch users.');
      return;
    }

  this.userService.fetchUsers({
  token: token,
  page: this.currentPage,
    pageSize: this.pageSize,
    search: this.searchText,
    sortField: this.sortField,
    sortOrder: this.sortOrder
}).subscribe({
  next: (res) => {
    console.log('User API Response:', res);
    this.users = res?.users || [];
    this.totalUsers = res?.groups?.[0]?.count || 0;
  },
  error: (err) => {
    console.error('User Fetch Error:', err);
  }
});
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

  onDelete(userId: string): void {
    console.log('Delete user:', userId);
  }

  onEdit(userId: string): void {
    console.log('Edit user:', userId);
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
}