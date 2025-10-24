import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import {BreadcrumbData} from '../../../interfaces/dashboards-interface';


@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService {

  // FormGroup para manejar los datos del breadcrumb
  breadcrumbForm: FormGroup;

  // Subject para emitir cambios del breadcrumb
  private breadcrumbSubject = new BehaviorSubject<BreadcrumbData>({
    title: 'Home',
    url: '/dashboards'
  });

  // Mapeo de rutas a títulos e iconos
  private routeTitles: { [key: string]: BreadcrumbData } = {
    '/dashboards': {
      title: 'Home',
      url: '/dashboards',
      icon: '📊'
    },

    // Gestión de Clientes
    '/dashboards/clients/list': {
      title: 'Clientes',
      url: '/dashboards/clients/list',
      icon: '🤝'
    },

    // Gestión de Propietarios
    '/dashboards/owners/list': {
      title: 'Propietarios',
      url: '/dashboards/owners/list',
      icon: '👨‍💼'
    },
    '/dashboards/estates/list': {
      title: 'Propiedades',
      url: '/dashboards/estates/list',
      icon: '🏢'
    },
    '/dashboards/estates-owners/list': {
      title: 'Porcentajes',
      url: '/dashboards/estates-owners/list',
      icon: '📊'
    },

    // Libro de IVA
    '/dashboards/books-vat/vat-book': {
      title: 'Libro de IVA',
      url: '/dashboards/books-vat/vat-book',
      icon: '📚'
    },

    // Facturas
    '/dashboards/invoices-issued/list': {
      title: 'Facturas Emitidas',
      url: '/dashboards/invoices-issued/list',
      icon: '🧾'
    },
    '/dashboards/invoices-received/list': {
      title: 'Facturas Recibidas',
      url: '/dashboards/invoices-received/list',
      icon: '📥'
    },
    '/dashboards/invoices-received/register': {
      title: 'Registrar Factura Recibida',
      url: '/dashboards/invoices-received/register',
      icon: '➕'
    },
    '/dashboards/suppliers/list': {
      title: 'Proveedores',
      url: '/dashboards/suppliers/list',
      icon: '🏪'
    },
    '/dashboards/internal-expenses/list': {
      title: 'Gastos Internos',
      url: '/dashboards/internal-expenses/list',
      icon: '💸'
    },

    // Usuarios
    '/dashboards/users/list': {
      title: 'Usuarios',
      url: '/dashboards/users/list',
      icon: '👤'
    },
    '/dashboards/employee/list': {
      title: 'Empleados',
      url: '/dashboards/employee/list',
      icon: '👔'
    }
  };

  constructor(private fb: FormBuilder) {
    this.breadcrumbForm = this.fb.group({
      title: ['Home'],
      url: ['/dashboards'],
      icon: ['📊'],
      isVisible: [true]
    });

    // Suscribirse a cambios del form para emitir actualizaciones
    this.breadcrumbForm.valueChanges.subscribe(value => {
      if (value.isVisible) {
        this.breadcrumbSubject.next({
          title: value.title,
          url: value.url,
          icon: value.icon
        });
      }
    });
  }


  /**
   * Actualiza el breadcrumb basado en la URL actual
   */
  updateBreadcrumb(url: string): void {
    const breadcrumbData = this.getBreadcrumbData(url);

    this.breadcrumbForm.patchValue({
      title: breadcrumbData.title,
      url: breadcrumbData.url,
      icon: breadcrumbData.icon || '📄',
      isVisible: true
    });
  }

  /**
   * Obtiene los datos del breadcrumb para una URL específica
   */
  private getBreadcrumbData(url: string): BreadcrumbData {
    return this.routeTitles[url] || {
      title: 'Dashboard',
      url: '/dashboards',
      icon: '📊'
    };
  }

  /**
   * Observable para suscribirse a cambios del breadcrumb
   */
  getBreadcrumbData$(): Observable<BreadcrumbData> {
    return this.breadcrumbSubject.asObservable();
  }

  /**
   * Obtiene el título actual
   */
  getCurrentTitle(): string {
    return this.breadcrumbForm.get('title')?.value || 'Dashboard';
  }

  /**
   * Obtiene el icono actual
   */
  getCurrentIcon(): string {
    return this.breadcrumbForm.get('icon')?.value || '📊';
  }

  /**
   * Oculta el breadcrumb
   */
  hideBreadcrumb(): void {
    this.breadcrumbForm.patchValue({ isVisible: false });
  }

  /**
   * Muestra el breadcrumb
   */
  showBreadcrumb(): void {
    this.breadcrumbForm.patchValue({ isVisible: true });
  }

  /**
   * Verifica si el breadcrumb está visible
   */
  isBreadcrumbVisible(): boolean {
    return this.breadcrumbForm.get('isVisible')?.value || false;
  }

  /**
   * Añade una nueva ruta al mapeo (útil para rutas dinámicas)
   */
  addRoute(url: string, breadcrumbData: BreadcrumbData): void {
    this.routeTitles[url] = breadcrumbData;
  }

  /**
   * Obtiene todas las rutas disponibles
   */
  getAllRoutes(): { [key: string]: BreadcrumbData } {
    return { ...this.routeTitles };
  }
}
