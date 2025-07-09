import { Component, EventEmitter, Output, Input, SimpleChanges } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

interface UserImage {
  url: string;
}

interface Mobile {
  country_code: string;
  mobile_number: string;
}

interface UserData {
  _id?: string;
  name: string;
  email: string;
  role: string;
  status: string;
  image: UserImage | null;
  mobile?: Mobile;
}


@Component({
  selector: 'app-profile-dialog',
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.css']
})

export class ProfileDialogComponent {
  @Input() userData: any;
  @Output() clickOutside = new EventEmitter<void>();
  private readonly BASE_URL = environment.BASE_URL;  

  user: UserData = {
    name: '',
    email: '',
    mobile: {
    country_code: '+91',
    mobile_number: ''
    },
    role: '',
    status: '',
    image: null
  };

  defaultAvatar = 'assets/avatar-placeholder.jpg';

  constructor(private auth: AuthService, private http: HttpClient) {
    const currentUser = this.auth.getUser();
    this.user.name = currentUser?.name || '';
    this.user.mobile = currentUser?.mobile || {
    country_code: '+91',
    mobile_number: ''
  };
    this.user.email = currentUser?.email || '';
    this.user.role = currentUser?.role || '';
    this.user.status = currentUser?.status || 'ACTIVE';
    this.user.image = currentUser?.image || null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userData'] && this.userData) {
      this.user.name = this.userData.name || '';
      this.user.mobile = this?.userData?.mobile || {
        country_code: '+91',
        mobile_number: ''
      };
      this.user.email = this.userData.email || '';
      this.user.role = this.userData.role || '';
      this.user.status = this.userData.status || '';
      this.user.image = this.userData.image || null;
    } else {
      const currentUser = this.auth.getUser();
      this.user.name = currentUser?.name || '';
      this.user.mobile = currentUser?.mobile || {
        country_code: '+91',
        mobile_number: ''
      };
      this.user.email = currentUser?.email || '';
      this.user.role = currentUser?.role || '';
      this.user.status = currentUser?.status || '';
      this.user.image = currentUser?.image || null;
    }
  }

  setStatus(status: 'ACTIVE' | 'INACTIVE') {
    this.user.status = status;
  }


updateUserProfile(): void {
  const imagePath = this.user.image?.url;
  const token = JSON.parse(localStorage.getItem('user') || '{}')?.token || '';
  
  const headers = new HttpHeaders({
    'Authorization': token,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  });

  const updateData = {
  name: this.user.name,
  image_path: imagePath?.trim() ? imagePath : 'https://yourdomain.com/default-avatar.png',
  mobile: {
    country_code: this.user.mobile?.country_code || '+91',
    mobile_number: this.user.mobile?.mobile_number || ''
  },
  language: 'English',
  new_email_signature: '',
  reply_forward_email_signature: '',
  notification: {
    notification_type: 'push_notification',
    notification_preference: {
      activities: {
        comment_on_assigned_item: { enabled: true },
        comment_on_collaborated_item: { enabled: true },
        mention: { enabled: true },
        activity_on_assigned_item: { enabled: true },
        activity_on_collaborated_item: { enabled: true },
        activity_association_on_assigned_item: { enabled: true },
        activity_association_on_collaborated_item: { enabled: true },
        email_on_assigned_item: { enabled: true },
        email_on_collaborated_item: { enabled: true }
      },
      items: {
        item_created: { enabled: true },
        item_updates_on_assigned_item: { enabled: true },
        item_updates_on_collaborated_item: { enabled: true },
        item_deleted: { enabled: true }
      },
      workfolders: {
        collaboration_on_workfolder: { enabled: true },
        role_changed_on_workfolder: { enabled: true },
        board_creation_on_workfolder: { enabled: true }
      },
      notes: {
        collaboration_on_note: { enabled: true },
        tagged_in_note: { enabled: true }
      }
    }
  },
  theme: 'light',
  work_schedule_assign: {
    user_id: this.user._id || '',
    work_schedule_id: '',
    additionalProp1: {}
  },
  date_format: {
    format: 'DD-MM-YYYY',
    time_format: 'HH:mm'
  }
};

  this.http.put(`${this.BASE_URL}/user/profile`, updateData, { headers }).subscribe({
    next: (res) => {
      console.log('User profile updated successfully', res);
    },
    error: (err) => {
      console.error('Error updating user profile', err);
    }
  });
}

  closeDialog(): void {
    this.clickOutside.emit();
  }
}
