import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bucket-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],  
  templateUrl: './bucket-picker.component.html',
  styleUrls: ['./bucket-picker.component.css'],
})
export class BucketPickerComponent {
  @Input() value = '';
  @Input() buckets: string[] = ['Open', 'Closed', 'InProgress'];
  @Input() finalBucket = 'Final';
  @Input() finalOption = 'Closed';

  @Output() picked = new EventEmitter<string>();

  query: string = '';

  get filtered(): string[] {
    const q = this.query.trim().toLowerCase();
    return !q ? this.buckets : this.buckets.filter(b => b.toLowerCase().includes(q));
  }

  choose(v: string) { this.picked.emit(v); }
}