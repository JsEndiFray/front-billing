import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { DashboardStatsService } from '../../../core/services/entity-services/dashboard-stats.service';
import { DashboardStats } from '../../../interfaces/stats-interface';

@Component({
  selector: 'app-dashboard-home',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.css'
})
export class DashboardHomeComponent {

  private dashboardStatsService = inject(DashboardStatsService);

  readonly stats = toSignal<DashboardStats | null>(
    this.dashboardStatsService.getStats(),
    { initialValue: null }
  );
}
