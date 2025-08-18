// src/app/services/board.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Board, BoardColumn, BoardItem } from '../models/board.models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private readonly BASE_URL = environment.BASE_URL;
  private readonly QUERY_ENDPOINT = '/dashboard/lead/query';
  private readonly BUCKET_QUERY = '/dashboard/bucket/query';

  constructor(private http: HttpClient) {}

  private bucketCache = new Map<string, string>();

  getBoardFirstPage(boardId: string, size: number): Observable<Board> {
    const url = `${this.BASE_URL}${this.QUERY_ENDPOINT}`;
    const body = {
      custom_column: { number_num: {} },
      search_params: { search_text: '' },
      sort_params: [{ sort_by: 'index', order: 'DSC' }],
      grouping_details: {
        group_by: 'none',
        max_group_size: size,
        start_index: 0,
        sort_order: 'ASC'
      },
      dashboard_id: [boardId],
      bucket_type: ['NON_FINAL'],
      timezone_offset: -330
    };

    return this.http.post<any>(url, body).pipe(
      switchMap(raw => this.normalizeBoardWithBuckets(boardId, raw))
    );
  }

  getBoardPage(boardId: string, start: number, size: number): Observable<any[]> {
    const url = `${this.BASE_URL}${this.QUERY_ENDPOINT}`;
    const body = {
      custom_column: { number_num: {} },
      search_params: { search_text: '' },
      sort_params: [{ sort_by: 'index', order: 'DSC' }],
      grouping_details: {
        group_by: 'none',
        max_group_size: size,
        start_index: start,
        sort_order: 'ASC'
      },
      dashboard_id: [boardId],
      bucket_type: ['NON_FINAL'],
      timezone_offset: -330
    };

    return this.http.post<any>(url, body).pipe(
      switchMap(raw => this.enrichRowsWithBucketNames(boardId, raw)),
      map(rows => rows.map(r => this.enrichRowStatic(r)))
    );
  }

  updateLead(dashId: string, leadId: string, keyPath: string, value: any) {
    if (keyPath === 'bucket_name') {
      const id = this.normalizeToBucketId(value);
      if (!id) {
        console.error('[BoardService] updateLead: cannot resolve bucket id for bucket_name:', value);
        return throwError(() => new Error('Invalid bucket name'));
      }
      keyPath = 'bucket_id';
      value = id;
    }

    const url = `${this.BASE_URL}/dashboard/${dashId}/lead/${leadId}`;
    const body = this.buildPatch(keyPath, value);

    if (keyPath === 'bucket_id' && typeof value === 'string') {
      if (!this.bucketCache.has(value)) {
        this.bucketCache.set(value, this.bucketCache.get(value) ?? value);
      }
    }

    return this.http.patch<any>(url, body).pipe(
      catchError(err => {
        console.error('updateLead failed', err);
        return throwError(() => err);
      })
    );
  }

  getCachedBucketName(id: string | null | undefined): string | undefined {
    if (!id) return undefined;
    return this.bucketCache.get(String(id));
  }

  getCachedBucketIdByName(name: string | null | undefined): string | undefined {
    if (!name) return undefined;
    const needle = String(name).trim().toLowerCase();
    for (const [id, label] of this.bucketCache.entries()) {
      if ((label ?? '').toLowerCase() === needle) return id;
    }
    return undefined;
  }

  normalizeToBucketId(input: any): string | undefined {
    const val = (input ?? '').toString().trim();
    if (!val) return undefined;

    if (val.length >= 7 && /^[a-zA-Z0-9_-]+$/.test(val)) return val;

    return this.getCachedBucketIdByName(val);
  }

  private enrichRowsWithBucketNames(boardId: string, raw: any): Observable<any[]> {
    const rows: any[] = Array.isArray(raw?.leadResponse) ? raw.leadResponse : [];

    if (!rows.length) return of([]);

    const idsToFetch = Array.from(
      new Set(
        rows
          .map(r => r?.bucket_id)
          .filter((x: any): x is string => typeof x === 'string' && x.trim().length > 0)
      )
    ).filter(id => !this.bucketCache.has(id));

    if (idsToFetch.length === 0) {
      return of(
        rows.map(r => ({
          ...r,
          bucket_name: this.bucketCache.get(r.bucket_id || '') ?? r.bucket_id
        }))
      );
    }

    return this.fetchBucketNames(boardId, idsToFetch).pipe(
      map(mapper => {
        for (const [id, name] of Object.entries(mapper)) {
          this.bucketCache.set(id, name);
        }
        return rows.map(r => ({
          ...r,
          bucket_name: this.bucketCache.get(r.bucket_id || '') ?? r.bucket_id
        }));
      })
    );
  }

  private fetchBucketNames(boardId: string, bucketIds: string[]): Observable<Record<string, string>> {
    const url = `${this.BASE_URL}${this.BUCKET_QUERY}`;
    const body = {
      dashboard_id: [boardId],
      bucket_id: bucketIds.map(String)
    };

    return this.http.post<any>(url, body).pipe(
      map(resp => {
        let arr: any[] = [];
        if (Array.isArray(resp)) arr = resp;
        else if (Array.isArray(resp?.responseData)) arr = resp.responseData;
        else if (Array.isArray(resp?.bucketResponse)) arr = resp.bucketResponse;
        else if (Array.isArray(resp?.buckets)) arr = resp.buckets;

        const mapOut: Record<string, string> = {};
        for (const b of arr) {
          const id = (b?.bucket_id ?? b?._id ?? '').toString();
          const name = (b?.name ?? '').toString();
          if (id) mapOut[id] = name || id;
        }

        for (const requestedId of bucketIds) {
          const id = String(requestedId);
          if (!mapOut[id]) mapOut[id] = id;
        }

        return mapOut;
      }),
      catchError(err => {
        console.error('[BoardService] fetchBucketNames failed', err);
        const fallback: Record<string, string> = {};
        for (const id of bucketIds) fallback[String(id)] = String(id);
        return of(fallback);
      })
    );
  }

  private normalizeBoardWithBuckets(boardId: string, raw: any): Observable<Board> {
    return this.enrichRowsWithBucketNames(boardId, raw).pipe(
      map(rowsWithNames => {
        const items: BoardItem[] = rowsWithNames.map(r => this.enrichRowStatic(r));
        const columns: BoardColumn[] = [
          { key: 'custom_fields.text_txt',   header: 'Text',     type: 'text',     width: '360px' },
          { key: 'custom_fields.number_num', header: 'Number',   type: 'number',   width: '120px' },
          { key: 'custom_fields.url',        header: 'Url',      type: 'url',      width: '280px' },
          { key: 'custom_fields.email_eml',  header: 'Email',    type: 'email',    width: '240px' },
          { key: 'priority_label',           header: 'Priority', type: 'priority', width: '100px' },
          { key: 'bucket_name',              header: 'Bucket',   type: 'bucket',   width: '130px' },
        ];
        return { columns, items };
      })
    );
  }

  private enrichRowStatic(r: any): any {
    return {
      ...r,
      priority_label: this.priorityNumberToLabel(r.priority),
      create_date_fmt: this.formatEpoch(r.create_date),
      update_date_fmt: this.formatEpoch(r.update_date),
    };
  }


  private buildPatch(keyPath: string, value: any): any {
    if (keyPath === 'title') return { title: value };

    if (keyPath === 'priority' || keyPath === 'priority_label') {
      const mapLabelToNum: Record<string, number> = { H: 2, U: 3, M: 1, L: 0 };
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

    if (keyPath === 'bucket_id') {
      return { bucket_id: value };
    }

    if (keyPath.startsWith('custom_fields.')) {
      const k = keyPath.split('.')[1];
      return { custom_fields: { [k]: value } };
    }

    return {};
  }


  private priorityNumberToLabel(n: any): 'H' | 'U' | 'M' | 'L' | 'text' {
    const v = Number(n);
    switch (v) {
      case 4: return 'U';
      case 3: return 'H';
      case 2: return 'M';
      case 1: return 'L';
      default: return 'text' as any;
    }
  }

  getBucketsForBoard(boardId: string) {
  const url = `${this.BASE_URL}/dashboard/bucket/query`;
  const body = { dashboard_id: [boardId] };

  return this.http.post<any>(url, body).pipe(
    map(resp => {
      const arr: any[] =
        Array.isArray(resp?.responseData) ? resp.responseData :
        Array.isArray(resp?.bucketResponse) ? resp.bucketResponse :
        Array.isArray(resp?.buckets) ? resp.buckets : [];
      return arr.map(b => ({
        id: String(b?.bucket_id ?? b?._id ?? ''),
        name: String(b?.name ?? '')
      })).filter(x => x.id && x.name);
    })
  );
}

  private formatEpoch(ms: any): string {
    if (!ms || isNaN(Number(ms))) return '';
    const d = new Date(Number(ms));
    const dd = d.toLocaleString('en-GB', { day: '2-digit', month: 'short' });
    const hhmm = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${dd} ${hhmm}`;
  }
}