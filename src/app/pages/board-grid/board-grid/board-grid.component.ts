import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';

import { Board } from 'src/app/models/board.models';
import { BoardService } from 'src/app/services/board.service';
import { LiveUpdatesService, BoardPatch } from 'src/app/services/live-updates.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-board-grid',
  templateUrl: './board-grid.component.html',
  styleUrls: ['./board-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardGridComponent implements OnInit, OnDestroy {
  readonly board_id = environment.BOARD_ID;

  board: Board = { columns: [], items: [] };
  loading = true;
  errorMsg = '';

  private destroy$ = new Subject<void>();

  constructor(
    private boardService: BoardService,
    private live: LiveUpdatesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1) Initial fetch
    this.loading = true;
    this.boardService.getBoard(this.board_id)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (b) => {
          this.board = b;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('API error:', err);
          this.errorMsg = 'Failed to load board data';
          this.board = { columns: [], items: [] };
          this.cdr.markForCheck();
        }
      });

    // 2) Live updates (WebSocket/MQTT)
    this.live.connect(this.board_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ error: (e) => console.error('[Realtime] connect error', e) });

    this.live.patches$
      .pipe(takeUntil(this.destroy$))
      .subscribe((p) => {
        this.applyPatch(p);
        this.cdr.markForCheck(); // OnPush refresh
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.live.disconnect();
  }


  private applyPatch(p: BoardPatch) {
    if (!this.board?.items) return;

    if (p.op === 'update') {
      const idx = this.board.items.findIndex(r => (r as any)._id === p.id || (r as any).id === p.id);
      if (idx === -1) return;

      const merged = this.deepMerge(this.board.items[idx], p.changes);
      this.board = {
        ...this.board,
        items: [
          ...this.board.items.slice(0, idx),
          merged,
          ...this.board.items.slice(idx + 1)
        ]
      };
      return;
    }

    if (p.op === 'insert') {
      this.board = {
        ...this.board,
        items: [p.item, ...this.board.items]
      };
      return;
    }

    if (p.op === 'remove') {
      this.board = {
        ...this.board,
        items: this.board.items.filter(r => (r as any)._id !== p.id && (r as any).id !== p.id)
      };
      return;
    }
  }

  private deepMerge(a: any, b: any) {
    if (!b || a === b) return a;
    const out: any = Array.isArray(a) ? [...a] : { ...a };
    for (const k of Object.keys(b)) {
      const bv = b[k];
      const av = a?.[k];
      out[k] =
        bv && typeof bv === 'object' && !Array.isArray(bv)
          ? this.deepMerge(av ?? {}, bv)
          : bv;
    }
    return out;
  }
}