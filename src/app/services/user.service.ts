import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from './http.service';
import { LoggerService } from './logger.service';

/**
 * Service responsible for managing user-related API calls
 * and storing current user state in memory.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private currentUserSource = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSource.asObservable();

  constructor(
    private http: HttpService,
    private logger: LoggerService
  ) {}

  /**
   * Sets the current user in the BehaviorSubject.
   * @param user - The user object to set as current.
   */
  setCurrentUser(user: any): void {
    this.logger.debug('Setting current user', user);
    this.currentUserSource.next(user);
  }

  /**
   * Fetches a list of users from the backend.
   * @param searchText - Optional search keyword to filter users by name or email.
   * @returns Observable containing the API response.
   */
  getUsers(searchText: string = ''): Observable<any> {
    this.logger.info('Fetching users from API', { searchText });

    const requestBody: any = { pagination_details: {} };
    if (searchText.trim()) {
      requestBody.search_params = {
        search_text: searchText.trim(),
        search_columns: ['name', 'email']
      };
    }

    return this.http.post('/user/query', requestBody);
  }

  getUsersWithFilters(filters: any) {
  const requestBody: any = {
    pagination_details: {
      page_size: filters.pageSize || 20,
      page_number: filters.pageNumber || 1
    }
  };

  if (filters.searchText) {
    requestBody.search_params = {
      search_text: filters.searchText.trim(),
      search_columns: ['name', 'email']
    };
  }

  if (filters.roles && filters.roles.length) {
    requestBody.filter_roles = filters.roles;
  }

  if (filters.from) requestBody.created_from = filters.from;
  if (filters.to) requestBody.created_to = filters.to;

  if (filters.sortField && filters.sortOrder) {
    requestBody.sorting_details = {
      sort_by: filters.sortField,
      sort_order: filters.sortOrder
    };
  }

  return this.http.post('/user/query', requestBody);
}

  /**
   * Retrieves user details based on their email address.
   * @param email - The email of the user to fetch.
   * @returns Observable containing the API response.
   */
  getUserByEmail(email: string): Observable<any> {
    this.logger.info('Fetching user by email', { email });

    const requestBody = {
      pagination_details: {},
      search_params: {
        search_text: email,
        search_columns: ['email']
      }
    };

    return this.http.post('/user/query', requestBody);
  }

  /**
   * Updates the details of a specific user.
   * @param userId - ID of the user to update.
   * @param updateData - Partial user data object containing fields to update.
   * @returns Observable containing the API response.
   */
  updateUser(userId: string, updateData: any): Observable<any> {
    this.logger.info('Updating user', { userId, updateData });
    return this.http.patch(`/user/${userId}`, updateData);
  }

  /**
   * Retrieves the profile image for a given user ID.
   * @param userId - ID of the user whose profile image is to be fetched.
   * @returns Observable containing the profile image details.
   */
  getUserProfileImage(userId: string): Observable<any> {
    this.logger.info('Fetching profile image for user', { userId });
    const body = { user_id: [userId] };
    return this.http.post('/user/profileimage/query', body);
  }

  /**
   * Sends an invite to create a new user in the given organisation.
   * @param orgId - The organisation ID to which the user will be invited.
   * @param userData - The new user's data including name, email, and role.
   * @returns Observable containing the API response.
   */
  inviteUser(orgId: string, userData: any): Observable<any> {
    this.logger.info('Inviting new user', { orgId, userData });
    return this.http.post(`/organisation/${orgId}/user`, userData);
  }
}