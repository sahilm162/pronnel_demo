import { Injectable, NgZone } from '@angular/core';
import { MqttService, IMqttMessage } from 'ngx-mqtt';
import { BehaviorSubject, Observable, Subject, Subscription, firstValueFrom } from 'rxjs';
import { ungzip } from 'pako';
import { EmitterAuthService } from './emitter-auth.service';

@Injectable({
  providedIn: 'root'
})
export class LiveUpdatesService {

  private creds$ = new BehaviorSubject<any>(null);
  private destroy$ = new Subject<void>();
  private updates$ = new Subject<any>();

  public boardUpdates$: Observable<any> = this.updates$.asObservable();

  constructor(private mqtt: MqttService, private keygen: EmitterAuthService, private zone: NgZone) { }


  async connectForBoard(boardId: string): Promise<void> {

    const { channel, token } = await this.keygen.getAuth(boardId);
    this.creds$.next({ channel, token });

    this.mqttSubscription(channel, token).subscribe(() => {});

    this.mqtt.onMessage.subscribe((data) => {
      if ((data as IMqttMessage).payload) {
        const msg = data as IMqttMessage;
        const compressed = msg.payload as Uint8Array;
        const decompressed = ungzip(compressed, { to: 'string' });
        const messageObj = JSON.parse(decompressed);
        this.zone.run(() => this.updates$.next(messageObj));
      }
    })
  }

  mqttSubscription(channel: any, key: any): Observable<IMqttMessage> {
    return (this.mqtt.observe(key + '/' + channel))
  }

  disconnect(): void {
    this.destroy$.next();
    this.destroy$.complete();
    try { this.mqtt.disconnect(true); } catch { }
  }
}