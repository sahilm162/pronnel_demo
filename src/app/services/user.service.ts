import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly BASE_URL = environment.BASE_URL;

  constructor(private http: HttpClient) {}

  fetchUsers(params: {
    token: string;
    page: number;
  pageSize: number;
  search: string;
  sortField: string;
  sortOrder: 'ASC' | 'DESC';
  }) {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-auth-token': params.token,
    });

    const body = {
    pagination_details: {
      page_size: params.pageSize,
      page_no: params.page
    },
    search_params: {
      search_text: params.search
    },
    sorting_details: [
      {
        sort_by: params.sortField,
        sort_order: params.sortOrder
      }
    ]
  };

const url = `${this.BASE_URL}/user/query`;
return this.http.post<any>(url, body, { headers });
  }
}