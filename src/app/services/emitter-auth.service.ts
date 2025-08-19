import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface WsAuth { channel: string; token: string; }

@Injectable({ providedIn: 'root' })
export class EmitterAuthService {
  constructor(private http: HttpClient) {}

  async getAuth(boardId: string): Promise<WsAuth> {
    const url = `${environment.BASE_URL}/organisation/mqtt/keygen`;
    const body = {
      organisation_id: environment.ORGANIZATION_ID,
      dashboard_id: boardId,
    };

    const res: any = await firstValueFrom(this.http.post(url, body));
    if (!res?.channel || !res?.key) {
      throw new Error('Keygen response missing channel or key');
    }
    return { channel: res.channel, token: res.key };
  }

  async getEmitterCreds(boardId: string): Promise<WsAuth> {
    return this.getAuth(boardId);
  }
}