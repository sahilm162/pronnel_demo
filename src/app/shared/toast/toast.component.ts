import { Component, Input } from '@angular/core';
import { ToastType } from '../toast.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css']
})
export class ToastComponent {
  @Input() message: string = '';
  @Input() type: ToastType = 'success';
}