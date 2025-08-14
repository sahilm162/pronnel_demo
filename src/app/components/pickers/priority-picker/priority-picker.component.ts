import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PriorityLabel = 'U' | 'H' | 'M' | 'L';

@Component({
  selector: 'app-priority-picker',
  standalone: true,
  imports: [CommonModule],    
  templateUrl: './priority-picker.component.html',
  styleUrls: ['./priority-picker.component.css'],
})
export class PriorityPickerComponent {
  @Input() value: PriorityLabel | '' = '';
  @Output() picked = new EventEmitter<PriorityLabel>();

  readonly items: { code: PriorityLabel; label: string; cls: string }[] = [
    { code: 'U', label: 'Urgent', cls: 'pri pri-urgent' },
    { code: 'H', label: 'High',   cls: 'pri pri-high'   },
    { code: 'M', label: 'Medium', cls: 'pri pri-medium' },
    { code: 'L', label: 'Low',    cls: 'pri pri-low'    },
  ];

  choose(code: PriorityLabel) { this.picked.emit(code); }
}