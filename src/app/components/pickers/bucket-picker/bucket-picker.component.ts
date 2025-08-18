import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface BucketOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-bucket-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bucket-picker.component.html',
  styleUrls: ['./bucket-picker.component.css'],
})
export class BucketPickerComponent {
  @Input() value = '';

  @Input() buckets: BucketOption[] = [];

  @Input() finalBucket = 'Final';
  @Input() finalOptionName = 'Closed';

  @Output() picked = new EventEmitter<string>();

  query = '';

  get filtered(): BucketOption[] {
    const q = this.query.trim().toLowerCase();
    return !q ? this.buckets : this.buckets.filter(b => b.name.toLowerCase().includes(q));
  }

  choose(opt: BucketOption) {
    this.picked.emit(opt.id);        
  }
}