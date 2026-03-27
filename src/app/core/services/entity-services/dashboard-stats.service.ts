import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api-service/api.service';
import { DashboardStats } from '../../../interfaces/stats-interface';

@Injectable({
  providedIn: 'root'
})
export class DashboardStatsService {

  private api = inject(ApiService);

  getStats(): Observable<DashboardStats> {
    return this.api.get<DashboardStats>('dashboard/stats');
  }
}
