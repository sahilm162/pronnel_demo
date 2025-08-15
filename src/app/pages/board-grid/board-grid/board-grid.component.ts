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
  readonly boardId = environment.BOARD_ID;

  board: Board = { columns: [], items: [] };
  loading = true;
  errorMsg = '';

  private editingMap = new Set<string>();

  private destroy$ = new Subject<void>();

  constructor(
    private boardService: BoardService,
    private live: LiveUpdatesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.boardService.getBoard(this.boardId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (b) => { this.board = b; this.cdr.markForCheck(); },
        error: (err) => {
          console.error('API error:', err);
          this.errorMsg = 'Failed to load board data';
          this.board = { columns: [], items: [] };
          this.cdr.markForCheck();
        }
      });

    this.live.connect(this.boardId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ error: (e) => console.error('[Realtime] connect error', e) });

    this.live.patches$
      .pipe(takeUntil(this.destroy$))
      .subscribe((p) => {
        this.applyPatch(p);
        this.cdr.markForCheck(); 
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.live.disconnect();
  }

  private applyDotChanges<T extends object>(row: T, changes: Record<string, any>): T {
    let next: any = { ...row };
    for (const path of Object.keys(changes)) {
      const value = changes[path];
      next = this.pathSet(next, path, value);
    }
    return next;
  }

  private pathSet<T extends object>(obj: T, dotPath: string, value: any): T {
    if (!dotPath || dotPath === '.') return value as T;

    const parts = dotPath.split('.');
    const cloneDeep = (cur: any, idx: number): any => {
      if (idx === parts.length) return value;

      const key = parts[idx]!;
      const curVal = cur?.[key];
      const base = Array.isArray(cur) ? cur.slice() : { ...(cur ?? {}) };

      base[key] = cloneDeep(curVal, idx + 1);
      return base;
    };

    return cloneDeep(obj, 0);
  }


  private applyPatch(p: BoardPatch) {
    if (p.op === 'insert') {
      this.board = {
        ...this.board,
        items: [p.item, ...(this.board.items ?? [])]
      };
      return;
    }

    if (p.op === 'remove') {
      this.board = {
        ...this.board,
        items: (this.board.items ?? []).filter(
          r => (r as any)._id !== p.id && (r as any).id !== p.id
        )
      };
      return;
    }

    if (p.op === 'update') {
      const items = this.board.items ?? [];
      const idx = items.findIndex(r => (r as any)._id === p.id || (r as any).id === p.id);
      if (idx === -1) return;

      const safeChanges: Record<string, any> = {};
      for (const [k, v] of Object.entries(p.changes ?? {})) {
        const guardKey = `${p.id}::${k}`;
        if (!this.editingMap.has(guardKey)) safeChanges[k] = v;
      }
      if (!Object.keys(safeChanges).length) return;

      const merged = this.applyDotChanges(items[idx] as any, safeChanges);

      this.board = {
        ...this.board,
        items: [
          ...items.slice(0, idx),
          merged,
          ...items.slice(idx + 1)
        ]
      };
      return;
    }
  }

  public beginEdit(rowId: string, dotPath: string) {
    this.editingMap.add(`${rowId}::${dotPath}`);
  }

  public endEdit(rowId: string, dotPath: string) {
    this.editingMap.delete(`${rowId}::${dotPath}`);
  }


  trackRow = (_: number, row: any) => row?._id ?? row?.id ?? _;
  trackCol = (_: number, col: any) => col?.key ?? _;

  pathGet(row: any, dotPath: string): any {
    if (!row || !dotPath) return undefined;
    return dotPath.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), row);
  }
}