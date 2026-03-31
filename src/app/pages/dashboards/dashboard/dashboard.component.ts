import { Component, DestroyRef, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth-services/auth.service';
import { NotificationsService } from '../../../core/services/entity-services/notifications.service';
import { getNotificationRoute, getNotificationSeverity } from '../../../core/mappers/notification-route.mapper';
import { AppNotification } from '../../../interfaces/stats-interface';
import { ThemeService } from '../../../core/services/shared-services/theme.service';

@Component({
  selector: 'app-dashboards',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationsService = inject(NotificationsService);
  private destroyRef = inject(DestroyRef);
  readonly themeService = inject(ThemeService);

  readonly getNotificationSeverity = getNotificationSeverity;

  sidebarCollapsed = false;
  currentPageTitle = 'Home';

  // Notificaciones
  readonly notifications = signal<AppNotification[]>([]);
  readonly showNotificationsDropdown = signal(false);
  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.read).length
  );

  private routeTitles: { [key: string]: string } = {
    '/dashboards': 'Home',
    '/dashboards/settings': 'Configuración',
    '/dashboards/clients/list': 'Clientes',
    '/dashboards/owners/list': 'Propietarios',
    '/dashboards/estates/list': 'Propiedades',
    '/dashboards/estates-owners/list': 'Porcentajes',
    '/dashboards/invoices-issued/list': 'Facturas Emitidas',
    '/dashboards/invoices-received/list': 'Facturas Recibidas',
    '/dashboards/users/list': 'Usuarios',
    '/dashboards/employee/list': 'Empleados',
  };

  ngOnInit(): void {
    this.themeService.initialize();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.urlAfterRedirects);
      });
    this.updatePageTitle(this.router.url);

    // Cargar notificaciones reactivamente
    this.notificationsService.getNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.notifications.set(data));
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotificationsDropdown.update(v => !v);
  }

  markAsRead(notification: AppNotification, event: MouseEvent): void {
    event.stopPropagation();
    this.showNotificationsDropdown.set(false);

    const route = getNotificationRoute(notification.type);

    if (!notification.read) {
      this.notificationsService.markAsRead(notification.id).subscribe({
        next: () => {
          this.notificationsService.refresh();
          this.router.navigate([route]);
        },
        error: () => {
          this.router.navigate([route]);
        }
      });
      return;
    }

    this.router.navigate([route]);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showNotificationsDropdown.set(false);
  }

  private updatePageTitle(url: string): void {
    this.currentPageTitle = this.routeTitles[url] || 'Dashboard';
  }
}
