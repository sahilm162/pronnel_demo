import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { animationFrameScheduler } from 'rxjs';

import { Board } from 'src/app/models/board.models';
import { BoardService } from 'src/app/services/board.service';
import { LiveUpdatesService } from 'src/app/services/live-updates.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-board-grid',
  templateUrl: './board-grid.component.html',
  styleUrls: ['./board-grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardGridComponent implements OnInit, OnDestroy {
  readonly boardId = environment.BOARD_ID;

  board: Board = { columns: [], items: [] };
  loading = true;
  errorMsg = '';

  private pageSize = 100;
  private nextStart = 0;
  private loadingPage = false;
  allLoaded = false;

  private editingMap = new Set<string>();

  private destroy$ = new Subject<void>();

  constructor(
    private boardService: BoardService,
    private live: LiveUpdatesService,
    private cdr: ChangeDetectorRef
  ) {}

ngOnInit(): void {
  console.log('[BoardGrid] init, boardId=', this.boardId);

  this.loadFirstPage();

  // Realtime connection
  this.live.connectForBoard(this.boardId)
    .then(() => console.log('[Realtime] connected ✅'))
    .catch((e: unknown) => console.error('[Realtime] connect error', e));

  this.live.boardUpdates$.subscribe((patchOrArray: any) => {
    console.log('[Realtime] update:', patchOrArray);
    this.applyLiveUpdate(patchOrArray);
    this.cdr.markForCheck();
  });
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.live.disconnect();
  }

  private loadFirstPage(): void {
    this.loading = true;

    this.boardService
      .getBoardFirstPage(this.boardId, this.pageSize)
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (b) => {
          this.board = {
            columns: b.columns ?? [],
            items: b.items ?? [],
          };

          const received = this.board.items.length;
          this.nextStart = received;
          this.allLoaded = received < this.pageSize; 
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('API error:', err);
          this.errorMsg = 'Failed to load board data';
          this.board = { columns: [], items: [] };
          this.cdr.markForCheck();
        },
      });
  }

  onGridLoadMore(): void {
    if (this.loadingPage || this.allLoaded) return;
    this.loadNextPage();
  }

  private loadNextPage(): void {
    this.loadingPage = true;

    this.boardService
      .getBoardPage(this.boardId, this.nextStart, this.pageSize)
      .pipe(finalize(() => {
        this.loadingPage = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (rows) => {
          const existing = this.board.items ?? [];
          const seen = new Set(existing.map(r => (r as any)._id ?? (r as any).id));
          const fresh = (rows ?? []).filter(r => !seen.has((r as any)._id ?? (r as any).id));

          if (!fresh.length) {
            this.allLoaded = true;
            return;
          }

          this.board = { ...this.board, items: existing.concat(fresh) };

          this.nextStart += fresh.length;
          if (fresh.length < this.pageSize) this.allLoaded = true;

          this.cdr.markForCheck();
        },
        error: (err) => console.error('getBoardPage failed', err),
      });
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

  public beginEdit(rowId: string, dotPath: string) {
    this.editingMap.add(`${rowId}::${dotPath}`);
  }
  public endEdit(rowId: string, dotPath: string) {
    this.editingMap.delete(`${rowId}::${dotPath}`);
  }

  trackRow = (id: number, row: any) => row?._id
  trackCol = (_: number, col: any) => col?.key ?? _;

  pathGet(row: any, dotPath: string): any {
    if (!row || !dotPath) return undefined;
    return dotPath.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), row);
  }

   private applyLiveUpdate(update: any) {
  const id =
    update?.object_type_details?.object_type_id ??
    update?.leadId ?? update?.id ?? update?._id;

  if (!id) {
    console.warn('[BoardGrid] live: missing id; evt ignored', update);
    return;
  }

  const items = this.board.items ?? [];
  const idx = items.findIndex(r => (r as any)?._id === id);
  console.log("idx:", idx)


  if (idx === -1) {
    console.warn('[BoardGrid] live: row not in current page; id=', id);
    return;
  }

  const row = { ...(items[idx] as any) };
  console.log("rows:", row)

  const updates = update?.additional_attributes?.updates;
  if (!Array.isArray(updates) || updates.length === 0) {
    console.warn('[BoardGrid] live: no updates array; nothing to apply');
    return;
  }

  console.log('[BoardGrid] live: applying', updates.length, 'updates to idx=', idx, 'id=', id);

for (const entity of updates) {
  if (Array.isArray(entity?.custom_fields)) {
    row.custom_fields = { ...(row.custom_fields ?? {}) };
    for (const cf of entity.custom_fields) {
      const k = cf?.field_key;
      if (!k) continue;
      row.custom_fields[k] = cf?.new_value;
    }
    continue;
  }

  const fieldKey = entity?.field_key;
  const newValue = entity?.new_value;

  if (!fieldKey) continue;

  if (fieldKey === 'priority') {
    const num = Number(newValue);
    row.priority = num;
    const toLabel: Record<number, 'U'|'H'|'M'|'L'> = { 3: 'U', 2: 'H', 1: 'M', 0: 'L' };
    row.priority_label = toLabel[num] ?? row.priority_label;
    continue;
  }

  if (fieldKey === 'bucket' || fieldKey === 'bucket_id') {
    row.bucket_id = String(newValue ?? '');
    continue;
  }

  if (fieldKey === 'custom_fields' && Array.isArray(entity?.custom_fields)) {
    row.custom_fields = { ...(row.custom_fields ?? {}) };
    for (const cf of entity.custom_fields) {
      const k = cf?.field_key;
      if (!k) continue;
      row.custom_fields[k] = cf?.new_value;
    }
    continue;
  }

  (row as any)[fieldKey] = newValue;
}

  console.log("idx demo:", items[idx])
  console.log('before:', items[idx]['custom_fields']?.text_txt);
console.log('after:', row.custom_fields?.text_txt);

  this.board = {
  ...this.board,
  items: [...items.slice(0, idx), row, ...items.slice(idx + 1)],
};
this.cdr.markForCheck();

  console.log('[BoardGrid] live: row updated at idx=', idx);
}
}

