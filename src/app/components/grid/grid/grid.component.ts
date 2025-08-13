import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { BoardColumn, BoardItem } from 'src/app/models/board.models';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridComponent {
  @Input() columns: BoardColumn[] = [];
  @Input() items: BoardItem[] = [];
  @Input() boardId = '';

  trackRow = (_: number, row: BoardItem) => row?.['id'] ?? row;
  trackCol = (_: number, col: BoardColumn) => col.key;

 pathGet(row: any, path: string): any {
  if (!row || !path) return undefined;
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), row);
}
}