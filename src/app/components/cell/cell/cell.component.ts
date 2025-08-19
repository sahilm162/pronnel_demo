import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CellType } from 'src/app/models/board.models';
import { BoardService } from 'src/app/services/board.service';

import { ComponentPortal } from '@angular/cdk/portal';
import {
  Overlay,
  OverlayRef,
  ConnectedPosition,
  CdkOverlayOrigin,
  ScrollStrategyOptions,
  ScrollDispatcher,
} from '@angular/cdk/overlay';

@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CellComponent implements AfterViewInit, OnDestroy {
  @Input() type: CellType = 'text';
  @Input() value: any;
  @Input() row: any;
  @Input() keyPath = '';
  @Input() boardId = '';

  @Input() bucketOptions: Array<{ id: string; name: string }> | null = null;

  @ViewChild('origin', { read: CdkOverlayOrigin, static: false }) origin?: CdkOverlayOrigin;
  @ViewChild('content', { static: false }) contentRef?: ElementRef<HTMLElement>;

  isOverflow = false;
  popoverOpen = false;

  editing = false;
  draft: any = null;
  saving = false;

  private destroy$ = new Subject<void>();
  private overlayRef?: OverlayRef;

  private lastScrollAt = 0;
  private justOpenedAt = 0;

  constructor(
    private boardSvc: BoardService,
    private overlay: Overlay,
    private hostEl: ElementRef<HTMLElement>,
    private cdr: ChangeDetectorRef,
    private sso: ScrollStrategyOptions,
    private scrollDispatcher: ScrollDispatcher,
  ) {}

  ngAfterViewInit(): void {
    this.checkOverflow();

    this.scrollDispatcher.scrolled(0)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastScrollAt = Date.now();
        if (this.overlayRef) this.destroyOverlay();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.overlayRef?.dispose();
  }

  @HostListener('click', ['$event'])
  onHostClick(ev: MouseEvent) {
    if (this.saving || this.editing || !this.isEditable) return;

    const target = ev.target as HTMLElement | null;

    const anchor = target?.closest('a');
    if (anchor) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    if (target?.closest('.picker-panel, .editor')) return;

    const sinceScroll = Date.now() - this.lastScrollAt;
    const run = (fn: () => void) => (sinceScroll < 150 ? setTimeout(fn, 150) : fn());

    if (this.keyPath === 'priority' || this.keyPath === 'priority_label') {
      return run(() => this.openPriorityPicker());
    }
    if (this.keyPath === 'bucket_id' || this.keyPath === 'bucket_name') {
      return run(() => this.openBucketPicker());
    }

    this.editing = true;
    this.popoverOpen = false;
    this.draft = this.value ?? '';
    this.cdr.markForCheck();
    setTimeout(() => this.focusEditor(true));
  }

  @HostListener('keydown', ['$event'])
  handleCellKeydown(ev: KeyboardEvent) {
    if (this.editing || !this.isEditable) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;

    const nonChar = ['Enter','Escape','Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'];
    if (nonChar.includes(ev.key)) return;

    if (ev.key.length === 1) {
      ev.preventDefault();
      this.editing = true;
      this.popoverOpen = false;
      this.draft = ev.key;
      this.cdr.markForCheck();
      setTimeout(() => this.focusEditor(false));
    }
  }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(ev: MouseEvent) {
    if (this.justOpenedAt && Date.now() - this.justOpenedAt < 120) {
      this.justOpenedAt = 0;
      return;
    }

    const host = this.hostEl.nativeElement;

    if (this.overlayRef && !this.overlayRef.hostElement.contains(ev.target as Node)) {
      this.destroyOverlay();
    }
    if (!host.contains(ev.target as Node)) {
      if (this.editing) this.commit();
      this.popoverOpen = false;
      this.cdr.markForCheck();
    }
  }

  @HostListener('window:resize') onResize() { this.checkOverflow(); }

  get isEditable(): boolean {
    if (this.keyPath === 'priority' || this.keyPath === 'priority_label') return true;
    if (this.keyPath === 'bucket_id' || this.keyPath === 'bucket_name') return true;
    if (this.keyPath === 'title') return true;
    if (this.keyPath === 'custom_fields.text_txt') return true;
    if (this.keyPath === 'custom_fields.number_num') return true;
    if (this.keyPath === 'custom_fields.url') return true;
    if (this.keyPath === 'custom_fields.email_eml') return true;
    return false;
  }

  isEmpty(v: any) { return v === null || v === undefined || v === ''; }

  badgeClassForPriority(val: string): string {
    const v = (val || '').toString().toUpperCase();
    switch (v){
      case 'H': return 'pri pri-high';
      case 'M': return 'pri pri-medium';
      case 'L': return 'pri pri-low';
      case 'U': return 'pri pri-urgent';
      default: return 'pri';
    }
  }

  async openPriorityPicker() {
    try {
      const { PriorityPickerComponent } = await import('../../pickers/priority-picker/priority-picker.component');
      const anchor = this.getStableAnchor(); if (!anchor) return;
      if (!this.createOverlay(anchor)) return;
      const portal = new ComponentPortal(PriorityPickerComponent);
      const ref = this.overlayRef!.attach(portal);
      ref.instance.value = (this.value || '').toString().toUpperCase();
      ref.instance.picked.subscribe((label: 'H'|'U'|'M'|'L') => {
        this.saveField('priority_label', label);
        this.destroyOverlay();
      });
    } catch (e) { console.error('Priority picker load failed', e); }
  }

  async openBucketPicker() {
    try {
      const { BucketPickerComponent } = await import('../../pickers/bucket-picker/bucket-picker.component');
      const anchor = this.getStableAnchor(); if (!anchor) return;
      if (!this.createOverlay(anchor)) return;
      const portal = new ComponentPortal(BucketPickerComponent);
      const ref = this.overlayRef!.attach(portal);

      const currentId = (this.row?.bucket_id || '').toString();
      ref.instance.value = currentId;

      this.boardSvc.getBucketsForBoard(this.boardId).subscribe({
        next: (opts) => { ref.instance.buckets = opts; this.cdr.markForCheck(); },
        error: (e) => console.error('Failed to load bucket options', e),
      });

      ref.instance.picked.subscribe((bucketId: string) => {
        this.saveField('bucket_id', bucketId);
        this.destroyOverlay();
      });
    } catch (e) { console.error('Bucket picker load failed', e); }
  }

  private getStableAnchor(): HTMLElement | null {
    let el: HTMLElement | null = this.origin?.elementRef?.nativeElement ?? null;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) return el;
    }
    let td: HTMLElement | null = this.hostEl.nativeElement.closest('td');
    if (td) {
      const r = td.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) return td;
    }
    el = this.hostEl.nativeElement;
    while (el) {
      const r = el.getBoundingClientRect?.();
      if (r && r.width > 0 && r.height > 0) return el;
      el = el.parentElement;
    }
    console.error('[cell] No stable anchor found');
    return null;
  }

  private createOverlay(anchor: HTMLElement): boolean {
    this.destroyOverlay();

    const rect = anchor.getBoundingClientRect?.();
    if (!rect || rect.width === 0 || rect.height === 0) {
      console.error('[cell] Invalid anchor rect; aborting overlay.', rect);
      return false;
    }

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(anchor)
      .withPositions(this.positions())
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(8);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.sso.close(),
      panelClass: ['picker-panel'],
      hasBackdrop: false,
    });

    this.justOpenedAt = Date.now();

    this.overlayRef.detachments()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.destroyOverlay());

    this.overlayRef.updateSize({ width: Math.max(180, rect.width) });
    setTimeout(() => this.overlayRef?.updatePosition());

    return true;
  }

  private positions(): ConnectedPosition[] {
    return [
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top',    offsetY: 6 },
      { originX: 'start', originY: 'top',    overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
      { originX: 'end',   originY: 'bottom', overlayX: 'end',   overlayY: 'top',    offsetY: 6 },
      { originX: 'end',   originY: 'top',    overlayX: 'end',   overlayY: 'bottom', offsetY: -6 },
    ];
  }

  private destroyOverlay() {
    if (this.overlayRef) {
      try { this.overlayRef.dispose(); } catch {}
      this.overlayRef = undefined;
      this.cdr.markForCheck();
    }
  }

  startEditProgrammatically(selectAll = true) {
    if (!this.isEditable || this.saving || this.editing) return;
    this.editing = true;
    this.popoverOpen = false;
    this.draft = this.value ?? '';
    this.cdr.markForCheck();
    setTimeout(() => this.focusEditor(selectAll));
  }

  private focusEditor(selectAll = false) {
    const root: HTMLElement = this.contentRef?.nativeElement ?? this.hostEl.nativeElement;
    const el = root.querySelector('.editor') as HTMLElement | null;
    if (!el) return;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus();
      if (selectAll) el.select();
    } else {
      el.focus();
    }
  }

  cancel(){
    this.editing = false;
    this.draft = null;
    this.cdr.markForCheck();
  }

  commit() {
    if (!this.editing || this.row?._id == null || !this.boardId) { this.cancel(); return; }

    let normalizedDraft = this.draft;
    if (this.keyPath === 'custom_fields.number_num') {
      const t = (this.draft ?? '').toString().trim().replace(/,/g, '');
      normalizedDraft = t === '' ? null : Number(t);
    }

    if (String(normalizedDraft) === String(this.value ?? '')) { this.cancel(); return; }
    this.saveField(this.keyPath, normalizedDraft, true);
  }

  private saveField(keyPath: string, newValue: any, closeInline = false) {
    this.saving = true;

    const prevDisplay = this.value;

    if (keyPath === 'bucket_id' || keyPath === 'bucket_name') {
      const id = keyPath === 'bucket_id'
        ? String(newValue)
        : (this.boardSvc.normalizeToBucketId(newValue) ?? String(newValue));

      const displayName =
        this.boardSvc.getCachedBucketName(id) ??
        (this.bucketOptions?.find(o => o.id === id)?.name ?? prevDisplay);

      this.value = displayName;
      if (this.row) {
        this.row.bucket_id = id;
        this.row.bucket_name = displayName;
      }

      keyPath = 'bucket_id';
      newValue = id;
    } else {
      this.value = newValue;
    }
    this.cdr.markForCheck();

    this.boardSvc.updateLead(this.boardId, this.row._id, keyPath, newValue)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: () => {
          if (closeInline) { this.editing = false; this.cdr.markForCheck(); }
        },
        error: () => {
          this.value = prevDisplay;
          if (this.row && (keyPath === 'bucket_id')) {
            this.row.bucket_name = prevDisplay;
          }
          if (closeInline) this.editing = false;
          this.cdr.markForCheck();
        }
      });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') { event.preventDefault(); this.commit(); }
    else if (event.key === 'Escape') { event.preventDefault(); this.cancel(); }
  }

  togglePopover(ev: MouseEvent){ ev.stopPropagation(); this.popoverOpen = !this.popoverOpen; this.cdr.markForCheck(); }

  private checkOverflow(){
    const el = this.contentRef?.nativeElement;
    this.isOverflow = !!el && (el.scrollWidth > el.clientWidth);
    this.cdr.markForCheck();
  }
}