import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';

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

  private pageSize = 500;
  allLoaded = true;

  constructor(
    private boardService: BoardService,
    private live: LiveUpdatesService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      console.log('[BoardGrid] init, boardId=', this.boardId);

      await this.loadAllRowsOnce();

      await this.live.connectForBoard(this.boardId);
      this.live.boardUpdates$.subscribe((evt: any) => {
        this.applyLiveUpdate(evt);    
        this.cdr.markForCheck();
      });
    } catch (e) {
      console.error('Init failed', e);
      this.errorMsg = 'Failed to load board data';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy(): void {
    this.live.disconnect();
  }

  private async loadAllRowsOnce(): Promise<void> {
    this.loading = true;
    this.errorMsg = '';
    this.board = { columns: [], items: [] };
    this.cdr.markForCheck();

    const first = await firstValueFrom(
      this.boardService.getBoardFirstPage(this.boardId, this.pageSize)
    );

    let items = first.items ?? [];
    this.board = { columns: first.columns ?? [], items };
    this.cdr.markForCheck();

    let start = items.length;
    const hardCap = 1_000_000; 
    while (start < hardCap) {
      const rows = await firstValueFrom(
        this.boardService.getBoardPage(this.boardId, start, this.pageSize)
      );
      if (!rows?.length) break;

      const seen = new Set(items.map(r => (r as any)?._id ?? (r as any)?.id));
      const fresh = rows.filter(r => !seen.has((r as any)?._id ?? (r as any)?.id));
      if (fresh.length) {
        items = items.concat(fresh);
        this.board = { ...this.board, items };
        this.cdr.markForCheck();
      }

      start += rows.length;
      if (rows.length < this.pageSize) break;
    }

    this.allLoaded = true;
  }

  private applyLiveUpdate(update: any) {
    const id =
      update?.object_type_details?.object_type_id ??
      update?.leadId ?? update?.id ?? update?._id;

    if (!id) return;

    const items = this.board.items ?? [];
    const idx = items.findIndex(r => (r as any)?._id === id || (r as any)?.id === id);
    if (idx === -1) return;

    const row = { ...(items[idx] as any) };
    const updates = update?.additional_attributes?.updates;
    if (!Array.isArray(updates) || !updates.length) return;

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
        const toLabel: Record<number,'U'|'H'|'M'|'L'> = {3:'U',2:'H',1:'M',0:'L'};
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

    this.board = {
      ...this.board,
      items: [...items.slice(0, idx), row, ...items.slice(idx + 1)],
    };
  }
}