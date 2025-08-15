import { Injectable, NgZone } from '@angular/core';
import { MqttService, IMqttMessage, IOnConnectEvent } from 'ngx-mqtt';
import {
  BehaviorSubject, Observable, Subject, from, defer, EMPTY,
  shareReplay, switchMap, tap, map, catchError
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { EmitterAuthService } from './emitter-auth.service';

export type BoardPatch =
  | { op: 'update'; id: string; changes: any }
  | { op: 'insert'; item: any }
  | { op: 'remove'; id: string };

@Injectable({ providedIn: 'root' })
export class LiveUpdatesService {
  private connected$ = new BehaviorSubject<boolean>(false);
  private patchesSubj = new Subject<BoardPatch>();
  readonly patches$ = this.patchesSubj.asObservable();

  private topicPrefix: string | null = null;

  constructor(
    private mqtt: MqttService,
    private keygen: EmitterAuthService,
    private zone: NgZone
  ) {
    this.mqtt.onConnect.subscribe(() => console.log('[MQTT] connected'));
    this.mqtt.onReconnect.subscribe(() => console.log('[MQTT] reconnecting…'));
    this.mqtt.onError.subscribe((e) => console.warn('[MQTT] error', e));
    this.mqtt.onClose.subscribe(() => console.log('[MQTT] closed'));
  }

  private trySubscribeAny(topics: string[]): Observable<IMqttMessage> {
    return defer(() => {
      let i = 0;
      const attempt = (): Observable<IMqttMessage> =>
       this.mqtt.observe(topics[i], { qos: 0 }).pipe(
              tap({
                subscribe: () => console.log('[MQTT] SUBSCRIBE →', topics[i]),
                next: () => console.log('[MQTT] SUBACK OK for', topics[i]),
              }),
              catchError(err => {
                console.warn(`[MQTT] SUBACK rejected for '${topics[i]}'`, err);
                i++;
                return attempt();
              })
            );
      return attempt();
    });
  }

  connect(boardId: string): Observable<void> {
    return from(this.keygen.getAuth(boardId)).pipe(
      tap(({ channel, token }) => {
        const base = channel.endsWith('/') ? channel : channel + '/';
        this.topicPrefix = base;

        this.mqtt.connect({
  hostname: environment.hostName,   
  port: 443,
  path: environment.path,          
  protocol: 'wss',
  keepalive: 30,
  clean: true,
  username: token,                 
  password: '',                   
  reconnectPeriod: 5000,
  clientId: 'web_' + Math.random().toString(16).slice(2),
});
      }),

      switchMap(() =>
        this.mqtt.onConnect.pipe(
          tap((_ev: IOnConnectEvent) => this.connected$.next(true)),
          switchMap(() => {
            const prefix = (this.topicPrefix ?? '').replace(/\/+$/, '');
            const candidates = [
              `${prefix}/events`,
              `${prefix}/updates`,
              `${prefix}/update`,
              `${prefix}/lead`,
              `${prefix}/leads`,
              `${prefix}/changes`,
              `${prefix}/data`,
              `${prefix}/broadcast`,
              `${prefix}`,
              `${prefix}/`
            ];
            console.log('[MQTT] subscribe candidates (exact):', candidates);
            return this.trySubscribeAny(candidates);
          }),
          tap((msg) => this.handleMessage(msg)),
          map(() => void 0)
        )
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  isConnected$(): Observable<boolean> { return this.connected$.asObservable(); }

  disconnect(): void {
    try { this.mqtt.disconnect(true); } catch {}
    this.connected$.next(false);
    this.topicPrefix = null;
  }

private handleMessage(msg: IMqttMessage) {
  this.zone.run(() => {
    let data: any;
    try { data = JSON.parse(msg.payload.toString()); } catch { return; }
    if (!data) return;

    switch (data.type) {
      case 'lead_updated': {
        const id = data.leadId ?? data.id ?? data._id;
        if (!id) return;

        if (data.changes && typeof data.changes === 'object') {
          this.patchesSubj.next({ op: 'update', id, changes: data.changes });
          return;
        }

        if (data.path && 'value' in data) {
          this.patchesSubj.next({ op: 'update', id, changes: { [data.path]: data.value } });
          return;
        }

        if (data.item && data.item._id) {
          this.patchesSubj.next({ op: 'update', id: data.item._id, changes: data.item });
        }
        break;
      }

      case 'lead_created':
        if (data.item) this.patchesSubj.next({ op: 'insert', item: data.item });
        break;

      case 'lead_deleted':
        if (data.leadId) this.patchesSubj.next({ op: 'remove', id: data.leadId });
        break;

      default:
        if (data.id && data.path && 'value' in data) {
          this.patchesSubj.next({ op: 'update', id: data.id, changes: { [data.path]: data.value } });
        }
        break;
    }
  });
}

  testPublish(payload: any) {
    if (!this.topicPrefix) return;
    const topic = this.topicPrefix.replace(/\/+$/, '') + '/events';
    this.mqtt.publish(topic, JSON.stringify(payload), { qos: 0, retain: false }).subscribe();
  }
}