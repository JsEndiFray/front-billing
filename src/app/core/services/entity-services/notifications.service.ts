import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { ApiService } from '../api-service/api.service';
import { AppNotification } from '../../../interfaces/stats-interface';

@Injectable({ providedIn: 'root' })
export class NotificationsService {

  private api = inject(ApiService);
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  getNotifications(): Observable<AppNotification[]> {
    return this.refresh$.pipe(
      switchMap(() => this.api.get<AppNotification[]>('notifications'))
    );
  }

  markAsRead(id: number): Observable<unknown> {
    return this.api.patch(`notifications/${id}/read`);
  }

  refresh(): void {
    this.refresh$.next();
  }
}
