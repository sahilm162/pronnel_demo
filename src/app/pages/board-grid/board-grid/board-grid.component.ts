import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Board } from 'src/app/models/board.models';
import { BoardService } from 'src/app/services/board.service';
import { finalize } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-board-grid',
  templateUrl: './board-grid.component.html',
  styleUrls: ['./board-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardGridComponent {
  readonly board_id = environment.BOARD_ID
  board: Board = { columns: [], items: [] };
  loading = true;
  errorMsg = '';

  constructor(private boardService: BoardService, private cdr: ChangeDetectorRef) {
    this.fetch();
  }

  ngOnInit(): void {
    this.boardService.getBoard(this.board_id)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
        console.log('Finalize called, turning off loader');
      }))
      .subscribe({
        next: (b) => {
          console.log('API success:', b);
          this.board = b;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('API error:', err);
          this.errorMsg = 'Failed to load board data';
          this.cdr.markForCheck();
        }
      });
  }

  private fetch(): void {
    this.loading = true;
    this.errorMsg = '';
    this.boardService.getBoard(this.board_id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (b) => this.board = b,
        error: (err) => {
          console.error('Board fetch error', err);
          this.errorMsg = 'Failed to load board data';
          this.board = { columns: [], items: [] };
        }
      });
  }
}