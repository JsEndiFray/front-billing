import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api-service/api.service';
import { Settings } from '../../../interfaces/stats-interface';

@Injectable({ providedIn: 'root' })
export class SettingsService {

  private api = inject(ApiService);

  getSettings(): Observable<Settings> {
    return this.api.get<Settings>('settings');
  }

  updateSettings(data: Settings): Observable<Settings> {
    return this.api.put<Settings>('settings', data);
  }
}
