import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener
} from '@angular/core';
import { CellType } from 'src/app/models/board.models';
import { BoardService } from 'src/app/services/board.service';
import { finalize } from 'rxjs/operators';
import { Overlay, OverlayRef, ConnectedPosition, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({
  selector: 'app-cell',
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CellComponent implements AfterViewInit {
  @Input() type: CellType = 'text';
  @Input() value: any;

  @Input() row: any;            
  @Input() keyPath = '';       
  @Input() boardId = '';        

  @Input() bucketOptions: string[] | null = null;

  @ViewChild('origin', { read: CdkOverlayOrigin, static: false }) origin?: CdkOverlayOrigin;

  @ViewChild('content', { static: false }) contentRef?: ElementRef<HTMLElement>;

  isOverflow = false;
  popoverOpen = false;

  editing = false;
  draft: any = null;
  saving = false;

  private overlayRef?: OverlayRef;

  constructor(
    private boardSvc: BoardService,
    private overlay: Overlay,
    private hostEl: ElementRef<HTMLElement>
  ) {}

  ngAfterViewInit(): void { this.checkOverflow(); }
  @HostListener('window:resize') onResize(){ this.checkOverflow(); }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(ev: MouseEvent){
    if (this.overlayRef && !this.overlayRef.hostElement.contains(ev.target as Node)) {
      this.destroyOverlay();
    }
    const host = this.hostEl.nativeElement;
    if (!host.contains(ev.target as Node)) {
      if (this.editing) this.commit();
      this.popoverOpen = false;
    }
  }

  isEmpty(v:any){ return v===null || v===undefined || v===''; }
  badgeClassForPriority(val: string): string {
    const v=(val||'').toString().toUpperCase();
    switch (v){ case 'H': return 'pri pri-high'; case 'M': return 'pri pri-medium';
      case 'L': return 'pri pri-low'; case 'U': return 'pri pri-urgent'; default: return 'pri'; }
  }

  async openPriorityPicker() {
    try {
      const { PriorityPickerComponent } = await import('../../pickers/priority-picker/priority-picker.component');

      const anchor = this.getStableAnchor();
      if (!anchor) return;

      const ok = this.createOverlay(anchor);
      if (!ok) return; 

      const portal = new ComponentPortal(PriorityPickerComponent);
      const ref = this.overlayRef!.attach(portal);

      ref.instance.value = (this.value || '').toString().toUpperCase();
      ref.instance.picked.subscribe((label: 'H'|'U'|'M'|'L') => {
        this.saveField('priority_label', label);
        this.destroyOverlay();
      });
    } catch (e) {
      console.error('Priority picker load failed', e);
    }
  }

  async openBucketPicker() {
    try {
      const { BucketPickerComponent } = await import('../../pickers/bucket-picker/bucket-picker.component');

      const anchor = this.getStableAnchor();
      if (!anchor) return;

      const ok = this.createOverlay(anchor);
      if (!ok) return; 

      const portal = new ComponentPortal(BucketPickerComponent);
      const ref = this.overlayRef!.attach(portal);

      ref.instance.value = (this.value || '').toString();
      if (this.bucketOptions?.length) ref.instance.buckets = this.bucketOptions.slice();
      ref.instance.picked.subscribe((val: string) => {
        this.saveField('bucket_id', val);
        this.destroyOverlay();
      });
    } catch (e) {
      console.error('Bucket picker load failed', e);
    }
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
    console.log('[origin exists?]', !!this.origin, this.origin?.elementRef?.nativeElement);
    this.destroyOverlay();

    const rect = anchor.getBoundingClientRect?.();
    console.log('[anchor rect]', rect);
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

  this.overlayRef = this.overlay.create({ positionStrategy, panelClass: ['picker-panel'] });
this.overlayRef.updateSize({ width: Math.max(180, rect.width) });
setTimeout(() => this.overlayRef?.updatePosition());
    this.overlayRef.backdropClick().subscribe(() => this.destroyOverlay());

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
    if (this.overlayRef) { this.overlayRef.dispose(); this.overlayRef = undefined; }
  }

  get isEditable(): boolean {
    if (this.keyPath === 'priority' || this.keyPath === 'priority_label') return true; 
    if (this.keyPath === 'bucket_id') return true;                                     
    if (this.keyPath === 'title') return true;
    if (this.keyPath === 'custom_fields.text_txt') return true;
    if (this.keyPath === 'custom_fields.number_num') return true;
    return false;
  }

  startEdit() {
    if (!this.isEditable || this.saving) return;

    if (this.keyPath === 'priority' || this.keyPath === 'priority_label') { this.openPriorityPicker(); return; }
    if (this.keyPath === 'bucket_id') { this.openBucketPicker(); return; }

    this.editing = true; this.popoverOpen = false; this.draft = this.value ?? '';
    setTimeout(() => {
      const el = this.contentRef?.nativeElement?.querySelector('.editor') as HTMLElement | null;
      if (!el) return;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) { el.focus(); el.select(); }
      else if (el instanceof HTMLSelectElement) { el.focus(); }
      else { el.focus(); }
    });
  }

  cancel(){ this.editing = false; this.draft = null; }

  commit() {
    if (!this.editing || this.row?._id == null || !this.boardId) { this.cancel(); return; }
    const normalizedDraft = (this.keyPath === 'custom_fields.number_num')
      ? (this.draft === '' ? null : Number(this.draft))
      : this.draft;
    if (String(normalizedDraft) === String(this.value ?? '')) { this.cancel(); return; }
    this.saveField(this.keyPath, normalizedDraft, true);
  }

  private saveField(keyPath: string, newValue: any, closeInline = false) {
    this.saving = true;
    const prev = this.value;
    this.value = newValue;
    this.boardSvc.updateLead(this.boardId, this.row._id, keyPath, newValue)
      .pipe(finalize(() => { this.saving = false; }))
      .subscribe({
        next: () => { if (closeInline) this.editing = false; },
        error: () => { this.value = prev; if (closeInline) this.editing = false; }
      });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') { event.preventDefault(); this.commit(); }
    else if (event.key === 'Escape') { event.preventDefault(); this.cancel(); }
  }

  togglePopover(ev: MouseEvent){ ev.stopPropagation(); this.popoverOpen = !this.popoverOpen; }

  private checkOverflow(){
    const el = this.contentRef?.nativeElement;
    this.isOverflow = !!el && (el.scrollWidth > el.clientWidth);
  }
}