import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
    private currentUserSource = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSource.asObservable();

  setCurrentUser(user: any) {
    this.currentUserSource.next(user);
  }
}