import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { publicGuard } from './core/guards/public.guard';

/**
 * Configuración de rutas con lazy loading.
 * - Rutas públicas: login (publicGuard)
 * - Rutas protegidas: dashboards/** (authGuard)
 * - Todos los componentes se cargan bajo demanda (loadComponent)
 *   para reducir el bundle inicial.
 */
export const routes: Routes = [

  // ── Rutas públicas ────────────────────────────────────────────────────────

  {
    path: 'login',
    loadComponent: () => import('./pages/users/login/login.component').then(m => m.LoginComponent),
    canActivate: [publicGuard],
    title: 'Login'
  },

  // ── Rutas protegidas ──────────────────────────────────────────────────────

  {
    path: 'dashboards',
    loadComponent: () => import('./pages/dashboards/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'Panel de Control',
    children: [

      // Dashboard principal
      {
        path: '',
        loadComponent: () => import('./pages/dashboards/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent),
        title: 'Dashboard Home'
      },

      // Módulo: Usuarios
      {
        path: 'users',
        children: [
          {
            path: 'register',
            loadComponent: () => import('./pages/users/users-register/users-register.component').then(m => m.UsersRegisterComponent),
            title: 'Registrar Usuario'
          },
          {
            path: 'list',
            loadComponent: () => import('./pages/users/user-list/user-list.component').then(m => m.UserListComponent),
            title: 'Listado de Usuarios'
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/users/user-edit/user-edit.component').then(m => m.UserEditComponent),
            title: 'Editar Usuario'
          }
        ]
      },

      // Módulo: Clientes
      {
        path: 'clients',
        children: [
          {
            path: 'register',
            loadComponent: () => import('./pages/clients/clients-register/clients-register.component').then(m => m.ClientsRegisterComponent),
            title: 'Registrar Cliente'
          },
          {
            path: 'list',
            loadComponent: () => import('./pages/clients/clients-list/clients-list.component').then(m => m.ClientsListComponent),
            title: 'Listado de Clientes'
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/clients/clients-edit/clients-edit.component').then(m => m.ClientsEditComponent),
            title: 'Editar Cliente'
          }
        ]
      },

      // Módulo: Propietarios
      {
        path: 'owners',
        children: [
          {
            path: 'register',
            loadComponent: () => import('./pages/owners/owners-register/owners-register.component').then(m => m.OwnersRegisterComponent),
            title: 'Registrar Propietario'
          },
          {
            path: 'list',
            loadComponent: () => import('./pages/owners/owners-list/owners-list.component').then(m => m.OwnersListComponent),
            title: 'Listado de Propietarios'
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/owners/owners-edit/owners-edit.component').then(m => m.OwnersEditComponent),
            title: 'Editar Propietario'
          }
        ]
      },

      // Módulo: Propiedades
      {
        path: 'estates',
        children: [
          {
            path: 'register',
            loadComponent: () => import('./pages/estates/estates-register/estates-register.component').then(m => m.EstatesRegisterComponent),
            title: 'Registrar Propiedad'
          },
          {
            path: 'list',
            loadComponent: () => import('./pages/estates/estates-list/estates-list.component').then(m => m.EstatesListComponent),
            title: 'Listado de Propiedades'
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/estates/estates-edit/estates-edit.component').then(m => m.EstatesEditComponent),
            title: 'Editar Propiedad'
          }
        ]
      },

      // Módulo: Relaciones propiedad-propietario
      {
        path: 'estates-owners',
        children: [
          {
            path: 'list',
            loadComponent: () => import('./pages/estate-owners/estate-owners-list/estate-owners-list.component').then(m => m.EstateOwnersListComponent),
            title: 'Listado Porcentajes'
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/estate-owners/estate-owners-edit/estate-owners-edit.component').then(m => m.EstateOwnersEditComponent),
            title: 'Editar Porcentaje'
          }
        ]
      },

      // Módulo: Facturas Emitidas
      {
        path: 'invoices-issued',
        children: [
          {
            path: 'register',
            loadComponent: () => import('./pages/invoices/invoices-issued/invoices-issued-register/invoices-issued-register.component').then(m => m.InvoicesIssuedRegisterComponent),
            title: 'Registrar Factura Emitida'
          },
          {
            path: 'list',
            loadComponent: () => import('./pages/invoices/invoices-issued/invoices-issued-list/invoices-issued-list.component').then(m => m.InvoicesIssuedListComponent),
            title: 'Listado de Facturas Emitidas'
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/invoices/invoices-issued/invoices-issued-edit/Invoices-Issued-Edit.Component').then(m => m.InvoicesIssuedEditComponent),
            title: 'Editar Factura Emitida'
          }
        ]
      },

      // Módulo: Facturas Recibidas
      {
        path: 'invoices-received',
        children: [
          {
            path: 'register',
            loadComponent: () => import('./pages/invoices/invoices-received/invoices-received-register/invoices-register-received.component').then(m => m.InvoicesRegisterReceivedComponent),
            title: 'Registrar Factura Recibida'
          },
          {
            path: 'list',
            loadComponent: () => import('./pages/invoices/invoices-received/invoices-received-list/invoices-received-list.component').then(m => m.InvoicesReceivedListComponent),
            title: 'Listado de Facturas Recibidas'
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/invoices/invoices-received/invoices-received-edit/invoices-received-edit.component').then(m => m.InvoicesReceivedEditComponent),
            title: 'Editar Factura Recibida'
          }
        ]
      },

      // Módulo: Gastos Internos
      {
        path: 'internal-expenses',
        children: [
          {
            path: 'register',
            loadComponent: () => import('./pages/invoices/invoices-expenses/invoices-expenses-register/invoices-expenses-register.component').then(m => m.InvoicesExpensesRegisterComponent),
            title: 'Registrar Factura de Gasto'
          },
          {
            path: 'list',
            loadComponent: () => import('./pages/invoices/invoices-expenses/invoices-expenses-list/invoices-expenses-list.component').then(m => m.InvoicesExpensesListComponent),
            title: 'Listado Facturas de Gastos'
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/invoices/invoices-expenses/invoice-expenses-edit/invoices-expenses-edit.component').then(m => m.InvoicesExpensesEditComponent),
            title: 'Editar Factura de Gasto'
          }
        ]
      },

      // Módulo: Proveedores
      {
        path: 'suppliers',
        children: [
          {
            path: 'register',
            loadComponent: () => import('./pages/invoices/suppliers/suppliers-register/suppliers-register.component').then(m => m.SuppliersRegisterComponent),
            title: 'Registrar Proveedor'
          },
          {
            path: 'list',
            loadComponent: () => import('./pages/invoices/suppliers/suppliers-list/suppliers-list.component').then(m => m.SuppliersListComponent),
            title: 'Listado de Proveedores'
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/invoices/suppliers/suppliers-edit/suppliers-edit.component').then(m => m.SuppliersEditComponent),
            title: 'Editar Proveedor'
          }
        ]
      },

      // Módulo: Libro del IVA
      {
        path: 'books-vat',
        children: [
          {
            path: 'vat-book',
            loadComponent: () => import('./pages/vat-book/vat-book.component').then(m => m.VatBookComponent),
            title: 'Libro del IVA'
          }
        ]
      },

      // Configuración
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Configuración'
      },

      // Módulo: Empleados
      {
        path: 'employee',
        children: [
          {
            path: 'register',
            loadComponent: () => import('./pages/employee/employee-register/employee-register.component').then(m => m.EmployeeRegisterComponent),
            title: 'Registro de Empleados'
          },
          {
            path: 'list',
            loadComponent: () => import('./pages/employee/employee-list/employee-list.component').then(m => m.EmployeeListComponent),
            title: 'Listado de Empleados'
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./pages/employee/employee-edit/employee-edit.component').then(m => m.EmployeeEditComponent),
            title: 'Editar Empleado'
          }
        ]
      }
    ]
  },

  // ── Ruta wildcard ─────────────────────────────────────────────────────────

  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
