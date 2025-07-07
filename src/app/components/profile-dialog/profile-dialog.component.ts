import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-profile-dialog',
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.css']
})
export class ProfileDialogComponent {
@Output() clickOutside = new EventEmitter<void>();

  user = {
    name: 'Vivek Bisht',
    role: 'Web Developer',
    image: null
  };

  defaultAvatar = 'assets/avatar-placeholder.jpg';

  closeDialog(): void {
    this.clickOutside.emit();
  }
}
