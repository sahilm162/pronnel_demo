import {
  Component, Input, ChangeDetectionStrategy, ElementRef, ViewChild,
  AfterViewInit, HostListener
} from '@angular/core';
import { CellType } from 'src/app/models/board.models';
import { BoardService } from 'src/app/services/board.service';
import { finalize } from 'rxjs/operators';

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

  @ViewChild('content', { static: true }) contentRef!: ElementRef<HTMLElement>;
  isOverflow = false;
  popoverOpen = false;

  editing = false;
  draft: any = null;
  saving = false;

  constructor(private boardSvc: BoardService) {}

  ngAfterViewInit(): void { this.checkOverflow(); }

  @HostListener('window:resize')
  onResize() { this.checkOverflow(); }

  @HostListener('document:click', ['$event'])
  closeOnOutsideClick(ev: MouseEvent) {
    if (!this.editing && !this.popoverOpen) return;
    const host = this.contentRef?.nativeElement?.closest('.cell') as HTMLElement | null;
    if (host && !host.contains(ev.target as Node)) {
      if (this.editing) this.commit();
      this.popoverOpen = false;
    }
  }

  isEmpty(v: any) { return v === null || v === undefined || v === ''; }

  badgeClassForPriority(val: string): string {
    const v = (val || '').toString().trim().toUpperCase();
    switch (v) {
      case 'H': return 'pri pri-high';
      case 'M': return 'pri pri-medium';
      case 'L': return 'pri pri-low';
      case 'U': return 'pri pri-urgent';
      default:  return 'pri';
    }
  }

  get isEditable(): boolean {
    if (this.keyPath === 'title') return true;
    if (this.keyPath === 'priority' || this.keyPath === 'priority_label') return true;
    if (this.keyPath === 'custom_fields.text_txt') return true;
    if (this.keyPath === 'custom_fields.number_num') return true;
    return false;
  }

  startEdit() {
    if (!this.isEditable || this.saving) return;
    this.editing = true;
    this.popoverOpen = false;

    if (this.keyPath === 'priority' || this.keyPath === 'priority_label') {
      this.draft = (this.value || '').toString().toUpperCase();
    } else {
      this.draft = this.value ?? '';
    }

    setTimeout(() => {
      const el = this.contentRef.nativeElement.querySelector('.editor');
      if (!el) return;

      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.focus();
        el.select();
      } else if (el instanceof HTMLSelectElement) {
        el.focus(); 
      } else {
        (el as HTMLElement).focus();
      }
    });
  }

  cancel() {
    this.editing = false;
    this.draft = null;
  }

  commit() {
    if (!this.editing || this.row?._id == null || !this.boardId) {
      this.cancel();
      return;
    }

    const normalizedDraft = (this.keyPath === 'custom_fields.number_num')
      ? (this.draft === '' ? null : Number(this.draft))
      : this.draft;

    if (String(normalizedDraft) === String(this.value ?? '')) {
      this.cancel();
      return;
    }

    this.saving = true;

    const prev = this.value;
    this.value = normalizedDraft;

    this.boardSvc.updateLead(this.boardId, this.row._id, this.keyPath, normalizedDraft)
      .pipe(finalize(() => { this.saving = false; }))
      .subscribe({
        next: () => {
          this.editing = false;
        },
        error: () => {
          this.value = prev;
          this.editing = false;
        }
      });
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') { event.preventDefault(); this.commit(); }
    else if (event.key === 'Escape') { event.preventDefault(); this.cancel(); }
  }

  togglePopover(ev: MouseEvent) { ev.stopPropagation(); this.popoverOpen = !this.popoverOpen; }

  private checkOverflow() {
    if (!this.contentRef) { this.isOverflow = false; return; }
    const el = this.contentRef.nativeElement;
    this.isOverflow = el.scrollWidth > el.clientWidth;
  }
}