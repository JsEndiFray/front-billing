import { Component } from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {AuthService} from '../../../core/services/auth-service/auth.service';
import {filter} from 'rxjs';



@Component({
  selector: 'app-dashboards',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,

  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {


  sidebarCollapsed = false;
  currentPageTitle = 'Home';

  // Mapeo de rutas a títulos
  private routeTitles: { [key: string]: string } = {
    '/dashboards': 'Home',
    '/dashboards/clients/list': 'Clientes',
    '/dashboards/owners/list': 'Propietarios',
    '/dashboards/estates/list': 'Propiedades',
    '/dashboards/estates-owners/list': 'Porcentajes',
    //libro iva
    '/dashboards/invoices-issued/list': 'Facturas Emitidas',
    //facturas recibidas
    //proveedores
    //gastos internos
    '/dashboards/users/list': 'Usuarios',
    '/dashboards/employee/list': 'Empleados',
  };

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Escuchar cambios de ruta para actualizar breadcrumb
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.urlAfterRedirects);
      });

    // Establecer título inicial
    this.updatePageTitle(this.router.url);
  }

  /**
   * Toggle del sidebar
   */
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  /**
   * Logout del usuario
   */
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Actualiza el título de la página actual
   */
  private updatePageTitle(url: string): void {
    this.currentPageTitle = this.routeTitles[url] || 'Dashboard';
  }


}
