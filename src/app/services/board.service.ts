import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Board, BoardColumn, BoardItem, CellType } from '../models/board.models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class BoardService {
    private readonly BASE_URL = environment.BASE_URL;
    private readonly QUERY_ENDPOINT = '/dashboard/lead/query';

    constructor(private http: HttpClient) { }

    getBoard(boardId: string): Observable<Board> {
        const url = `${this.BASE_URL}${this.QUERY_ENDPOINT}`;
        const body = {
            custom_column: { number_num: {} },
            search_params: { search_text: '' },
            sort_params: [{ sort_by: 'index', order: 'DSC' }],
            grouping_details: { group_by: 'none', max_group_size: 50, start_index: 0, sort_order: 'ASC' },
            dashboard_id: [boardId],
            bucket_type: ['NON_FINAL'],
            timezone_offset: -330
        };

        return this.http.post<any>(url, body).pipe(
            map(raw => this.normalizeBoard(raw))
        );
    }

    updateLead(dashId: string, leadId: string, keyPath: string, value: any) {
        const url = `${this.BASE_URL}/dashboard/${dashId}/lead/${leadId}`;
        const body = this.buildPatch(keyPath, value);

        return this.http.patch<any>(url, body).pipe(
            catchError(err => {
                console.error('updateLead failed', err);
                return throwError(() => err);
            })
        );
    }


    private buildPatch(keyPath: string, value: any): any {
        if (keyPath === 'title') return { title: value };

        if (keyPath === 'priority' || keyPath === 'priority_label') {
            const mapLabelToNum: Record<string, number> = { H: 4, U: 3, M: 2, L: 1 };
            const v = typeof value === 'number'
                ? value
                : mapLabelToNum[(value ?? '').toString().toUpperCase()] ?? 1;
            return { priority: v };
        }

        if (keyPath === 'custom_fields.text_txt') {
            return { custom_fields: { text_txt: value } };
        }

        if (keyPath === 'custom_fields.number_num') {
            const num = value === '' || value === null ? null : Number(value);
            return { custom_fields: { number_num: num } };
        }

        if (keyPath.startsWith('custom_fields.')) {
            const k = keyPath.split('.')[1];
            return { custom_fields: { [k]: value } };
        }

        return {};
    }

    private normalizeBoard(raw: any): Board {
        const rows: any[] = Array.isArray(raw?.leadResponse) ? raw.leadResponse : [];

        const items: BoardItem[] = rows.map(r => ({
            ...r,
            priority_label: this.priorityNumberToLabel(r.priority),
            create_date_fmt: this.formatEpoch(r.create_date),
            update_date_fmt: this.formatEpoch(r.update_date),
        }));

        const columns: BoardColumn[] = [
            { key: 'custom_fields.text_txt', header: 'Text', type: 'text', width: '360px' },
            { key: 'custom_fields.number_num', header: 'Number', type: 'number', width: '120px' },
            { key: 'custom_fields.url', header: 'Url', type: 'url', width: '280px' },
            { key: 'custom_fields.email_eml', header: 'Email', type: 'email', width: '240px' },
            { key: 'priority_label', header: 'Priority', type: 'priority', width: '100px' },
            { key: 'bucket_id', header: 'Bucket', type: 'text', width: '130px' },
        ];

        return { columns, items };
    }

    private priorityNumberToLabel(n: any): 'H' | 'U' | 'M' | 'L' | 'text' {
        const v = Number(n);
        switch (v) {
            case 4: return 'H';
            case 3: return 'U';
            case 2: return 'M';
            case 1: return 'L';
            default: return 'text' as any;
        }
    }

    private formatEpoch(ms: any): string {
        if (!ms || isNaN(Number(ms))) return '';
        const d = new Date(Number(ms));
        const dd = d.toLocaleString('en-GB', { day: '2-digit', month: 'short' });
        const hhmm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
        return `${dd} ${hhmm}`;
    }
}