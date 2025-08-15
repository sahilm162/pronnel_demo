import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout, tap } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface WsAuth { channel: string; token: string; }

@Injectable({ providedIn: 'root' })
export class EmitterAuthService {
  constructor(private http: HttpClient) {}

  private static findStringByKeys(obj: any, aliases: string[]): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (aliases.some(a => a.toLowerCase() === key.toLowerCase()) && typeof val === 'string' && val.length) {
        return val;
      }
      if (val && typeof val === 'object') {
        const hit = this.findStringByKeys(val, aliases);
        if (hit) return hit;
      }
      if (Array.isArray(val)) {
        for (const it of val) {
          const hit = this.findStringByKeys(it, aliases);
          if (hit) return hit;
        }
      }
    }
    return undefined;
  }

  async getAuth(boardId: string): Promise<WsAuth> {
    const url = `${environment.BASE_URL}/organisation/mqtt/keygen`;
    const body: any = {
      organisation_id: environment.ORGANIZATION_ID,
      dashboard_id: boardId,
    };

    const res: any = await firstValueFrom(
      this.http.post(url, body).pipe(
        timeout(8000),
        tap(r => {
          if (!(window as any).__mqtt_keygen_logged) {
            console.log('[Keygen] 200 OK raw response:', r);
            (window as any).__mqtt_keygen_logged = true;
          }
        })
      )
    );

    let channel =
      res?.channel ?? res?.topic ?? res?.mqtt_channel ?? res?.ws_channel ?? res?.data?.channel ?? res?.data?.topic;
    let token =
      res?.token ?? res?.access_token ?? res?.mqtt_token ?? res?.ws_token ?? res?.data?.token ?? res?.data?.access_token;

    if (!channel) channel = EmitterAuthService.findStringByKeys(res, ['channel', 'topic', 'mqtt_channel', 'ws_channel', 'topicName']);
    if (!token)   token   = EmitterAuthService.findStringByKeys(res, ['token', 'access_token', 'mqtt_token', 'ws_token', 'key']);

    if (!channel || !token) {
      throw new Error('Keygen response missing channel/token');
    }
    return { channel, token };
  }
}