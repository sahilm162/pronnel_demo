import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
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

  @ViewChild('scrollArea', { static: false }) scrollArea?: ElementRef<HTMLElement>;

  users: any[] = [];
  totalUsers = 0;

  pageSize = 20;
  currentPage = 1;
  allLoaded = false;

  isFirstPageLoading = false;
  isFetchingNext = false;
  isBusy = false;

  searchText: string = '';
  isFilterOpen = false;
  filterRole: string = '';
  startDate: string = '';
  endDate: string = '';
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

  constructor(
    private userService: UserService,
    private auth: AuthService,
    private toast: ToastService,
    private logger: LoggerService
  ) { }

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
    this.loadUsers(true);
  }

  checkScreenSize() {
    this.isMobileView = window.innerWidth < 821;
  }
  toggleMobileSearch() { this.showMobileSearch = !this.showMobileSearch; }

  private buildFilters(pageNumber: number) {
    return {
      searchText: this.searchText.trim(),
      roles: this.filterRole,
      from: this.startDate ? new Date(this.startDate).getTime() : null,
      to: this.endDate ? new Date(this.endDate).getTime() : null,
      sortField: this.sortField ?? undefined,
      sortOrder: this.sortOrder ?? undefined,
      pageSize: this.pageSize,
      pageNumber
    };
  }

  loadUsers(reset: boolean): void {
    if (this.isBusy) return;
    if (!reset && (this.allLoaded || this.isFetchingNext)) return;

    const currentUser = this.auth.getUser();
    const entityId = currentUser?.org_id;
    if (!entityId) {
      console.error('Entity ID not found. Cannot fetch users.');
      return;
    }

    if (reset) {
      this.currentPage = 1;
      this.allLoaded = false;
      this.users = [];
      this.isFirstPageLoading = true;
    } else {
      this.isFetchingNext = true;
    }
    this.isBusy = true;

    const filters = this.buildFilters(this.currentPage);
    this.logger.info('Fetching users (infinite scroll)', filters);

    this.userService.getUsersWithFilters(filters).subscribe({
      next: (data: any) => {
        const pageRows: any[] = data?.responseData || [];
        const total = data?.pagination_details?.total_records ?? 0;

        if (reset) {
          this.users = pageRows;
        } else {
          const seen = new Set(this.users.map(u => u?._id));
          const fresh = pageRows.filter(u => !seen.has(u?._id));
          this.users = this.users.concat(fresh);
        }

        this.totalUsers = total;

        if (pageRows.length < this.pageSize || this.users.length >= this.totalUsers) {
          this.allLoaded = true;
        } else {
          this.currentPage += 1;
        }
      },
      error: (err) => {
        console.error('User Fetch Error:', err);
        this.toast.show('Failed to load users', 'error');
      },
      complete: () => {
        this.isFirstPageLoading = false;
        this.isFetchingNext = false;
        this.isBusy = false;
      }
    });
  }

  onTableScroll(ev: Event) {
    if (this.allLoaded || this.isBusy) return;
    const el = ev.target as HTMLElement;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
    if (nearBottom) {
      this.loadUsers(false);
    }
  }

  onSearch(): void {
    this.loadUsers(true);
  }

  applyFilters() {
    this.isFilterOpen = false;
    this.loadUsers(true);
  }

  applySort(field: string) {
    if (this.sortField !== field) {
      this.sortField = field;
      this.sortOrder = 'ASC';
    } else {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : (this.sortOrder === 'DESC' ? null : 'ASC');
      if (this.sortOrder === null) this.sortField = null;
    }
    this.loadUsers(true);
  }

  toggleFilterPanel() { this.isFilterOpen = !this.isFilterOpen; }
  closeFilterPanel() { this.isFilterOpen = false; }
  toggleExpanded(user: any) { this.expandedUser = this.expandedUser === user ? null : user; }

  openInviteDialog() { this.showInviteDialog = true; }
  closeInviteDialog() { this.showInviteDialog = false; }
  handleUserChange() { this.loadUsers(true); this.showInviteDialog = false; }
  handleUserAdd(newUser: any) { this.users.unshift(newUser); this.totalUsers++; this.closeInviteDialog(); }

  confirmDelete(userId: string): void { this.selectedUserIdToDelete = userId; this.showDeleteConfirm = true; }
  cancelDelete(): void { this.selectedUserIdToDelete = null; this.showDeleteConfirm = false; }

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

  onEdit(user: any): void { this.selectedUser = user; this.showEditDialog = true; }
  closeEditDialog(): void { this.showEditDialog = false; }
}