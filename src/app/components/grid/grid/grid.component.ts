import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  SimpleChanges,
} from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Subject } from 'rxjs';
import { auditTime, takeUntil } from 'rxjs/operators';
import { CellType } from 'src/app/models/board.models';

export interface GridCol {
  header: string;
  key: string;
  type: CellType;
}

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() columns: GridCol[] = [];
  @Input() items: any[] = [];
  @Input() boardId = '';

  @Input() canLoadMore = true;

  readonly rowHeight = 40;

  readonly minBufferPx = 10 * this.rowHeight;
  readonly maxBufferPx = 30 * this.rowHeight;

  @Output() loadMore = new EventEmitter<void>();

  @ViewChild(CdkVirtualScrollViewport, { static: false })
  viewport?: CdkVirtualScrollViewport;

  private destroy$ = new Subject<void>();

  private loadMoreLocked = false;

  private loadMoreTriggerRows = 20;

  private prevItemsLen = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      const len = this.items?.length ?? 0;
      if (len > this.prevItemsLen) {
        this.loadMoreLocked = false;
      }
      this.prevItemsLen = len;
    }
    this.cdr.markForCheck();
  }

  ngAfterViewInit(): void {
    this.viewport?.renderedRangeStream
      .pipe(auditTime(80), takeUntil(this.destroy$))
      .subscribe(() => this.maybeLoadMore());

    this.viewport?.scrolledIndexChange
      .pipe(auditTime(80), takeUntil(this.destroy$))
      .subscribe(() => this.maybeLoadMore());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

private maybeLoadMore() {
  if (!this.viewport || !this.canLoadMore || this.loadMoreLocked) return;

  const range = this.viewport.getRenderedRange(); 
  const total = this.viewport.getDataLength();    
  const rowsFromBottom = total - range.end;

  if (rowsFromBottom <= this.loadMoreTriggerRows) {
    this.loadMoreLocked = true;     
    this.loadMore.emit();           
  }
}

  trackCol = (_: number, c: GridCol) => c.key;
  trackRow = (i: number, r: any) => r?._id ?? r?.id ?? i;

  pathGet(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    let cur = obj;
    for (const p of path.split('.')) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  }
}