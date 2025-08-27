import {Routes} from '@angular/router';

// ========================================
// IMPORTACIONES ORGANIZADAS POR MÓDULO
// ========================================

// Usuarios - Autenticación y gestión
import {LoginComponent} from './pages/users/login/login.component';
import {UsersRegisterComponent} from './pages/users/users-register/users-register.component';
import {UserListComponent} from './pages/users/user-list/user-list.component';
import {UserEditComponent} from './pages/users/user-edit/user-edit.component';

// Dashboard principal
import {DashboardComponent} from './pages/dashboards/dashboard/dashboard.component';
import {DashboardHomeComponent} from './pages/dashboards/dashboard-home/dashboard-home.component';
import {authGuard} from './core/guards/auth.guard';

// Clientes - Gestión de clientes del negocio
import {ClientsRegisterComponent} from './pages/clients/clients-register/clients-register.component';
import {ClientsListComponent} from './pages/clients/clients-list/clients-list.component';
import {ClientsEditComponent} from './pages/clients/clients-edit/clients-edit.component';

// Propietarios (Owners) - Gestión de propietarios de inmuebles
import {OwnersRegisterComponent} from './pages/owners/owners-register/owners-register.component';
import {OwnersListComponent} from './pages/owners/owners-list/owners-list.component';
import {OwnersEditComponent} from './pages/owners/owners-edit/owners-edit.component';

// Propiedades (Estates) - Gestión de inmuebles
import {EstatesRegisterComponent} from './pages/estates/estates-register/estates-register.component';
import {EstatesListComponent} from './pages/estates/estates-list/estates-list.component';
import {EstatesEditComponent} from './pages/estates/estates-edit/estates-edit.component';

// Porcentajes de propiedades (Estates-Owners) - Relaciones propiedad-propietario
import {EstateOwnersListComponent} from './pages/estate-owners/estate-owners-list/estate-owners-list.component';
import {EstateOwnersEditComponent} from './pages/estate-owners/estate-owners-edit/estate-owners-edit.component';

// Facturas emitidas(invoice-issued) - Sistema de facturación emitidas
import {
  InvoicesIssuedRegisterComponent
} from './pages/invoices/invoices-issued/invoices-issued-register/invoices-issued-register.component';
import {
  InvoicesIssuedListComponent
} from './pages/invoices/invoices-issued/invoices-issued-list/invoices-issued-list.component';
import {
  InvoicesIssuedEditComponent
} from './pages/invoices/invoices-issued/invoices-issued-edit/Invoices-Issued-Edit.Component';


// facturas recibidas(invoices-received) -  sistemas de facturas recibidas
import {
  InvoicesRegisterReceivedComponent
} from './pages/invoices/invoices-received/invoices-received-register/invoices-register-received.component';
import {
  InvoicesReceivedListComponent
} from './pages/invoices/invoices-received/invoices-received-list/invoices-received-list.component';
import {
  InvoicesReceivedEditComponent
} from './pages/invoices/invoices-received/invoices-received-edit/invoices-received-edit.component';


// facturas de gastos (internal-expenses) - Sistema de gastos internos
import {
  InvoicesExpensesRegisterComponent
} from './pages/invoices/invoices-expenses/invoices-expenses-register/invoices-expenses-register.component';
import {
  InvoicesExpensesListComponent
} from './pages/invoices/invoices-expenses/invoices-expenses-list/invoices-expenses-list.component';
import {
  InvoicesExpensesEditComponent
} from './pages/invoices/invoices-expenses/invoice-expenses-edit/invoices-expenses-edit.component';


// proveedores (suppliers) - sistema de proveedores
import {SuppliersRegisterComponent} from './pages/invoices/suppliers/suppliers-register/suppliers-register.component';
import {SuppliersListComponent} from './pages/invoices/suppliers/suppliers-list/suppliers-list.component';
import {SuppliersEditComponent} from './pages/invoices/suppliers/suppliers-edit/suppliers-edit.component';

// libro de iva(vat-book) sitema de iva
import {VatBookComponent} from './pages/vat-book/vat-book/vat-book.component';

// Empleados (Employee) - Sistema de empleados
import {EmployeeListComponent} from './pages/employee/employee-list/employee-list.component';
import {EmployeeEditComponent} from './pages/employee/employee-edit/employee-edit.component';
import {EmployeeRegisterComponent} from './pages/employee/employee-register/employee-register.component';



/**
 * Configuración de rutas para aplicación de gestión inmobiliaria
 *
 * ESTRUCTURA:
 * - Rutas públicas: login, register
 * - Rutas protegidas: dashboards/** (requiere autenticación)
 * - Módulos: usuarios, clientes, propietarios, propiedades, relaciones, facturas
 *
 * PATRONES:
 * - Cada módulo tiene: home, register/user, list, edit/:id
 * - Todas las rutas protegidas bajo /dashboards con authGuard
 * - Rutas anidadas con children para organización modular
 */
export const routes: Routes = [
  // ========================================
  // RUTAS PÚBLICAS (sin autenticación)
  // ========================================

  {
    path: 'login',
    component: LoginComponent,
    title: 'Login'
  },


  // ========================================
  // RUTAS PROTEGIDAS (requieren authGuard)
  // ========================================

  {
    path: 'dashboards',
    component: DashboardComponent,
    canActivate: [authGuard], // 🔒 Protege todas las rutas hijas
    title: 'Panel de Control',
    children: [

      //dashboard principal
      {
        path: '',
        component: DashboardHomeComponent,
        title: 'Dashboard Home'
      },

      // Módulo: Usuarios del sistema
      {
        path: 'users',
        children: [
          {path: 'register', component: UsersRegisterComponent, title: 'Registrar Usuario'},
          {path: 'list', component: UserListComponent, title: 'Listado de Usuarios'},
          {path: 'edit/:id', component: UserEditComponent, title: 'Editar Usuario'},

        ]
      },
      // Módulo: Clientes del negocio
      {
        path: 'clients',
        children: [
          {path: 'register', component: ClientsRegisterComponent, title: 'Registrar Cliente'},
          {path: 'list', component: ClientsListComponent, title: 'Listado de Clientes'},
          {path: 'edit/:id', component: ClientsEditComponent, title: 'Editar Cliente'},
        ]
      },

      // Módulo: Propietarios de inmuebles
      {
        path: 'owners',
        children: [
          {path: 'register', component: OwnersRegisterComponent, title: 'Registrar Propietario'},
          {path: 'list', component: OwnersListComponent, title: 'Listado de Propietarios'},
          {path: 'edit/:id', component: OwnersEditComponent, title: 'Editar Propietario'}
        ]
      },

      // Módulo: Propiedades inmobiliarias
      {
        path: 'estates',
        children: [
          {path: 'register', component: EstatesRegisterComponent, title: 'Registrar Propiedad'},
          {path: 'list', component: EstatesListComponent, title: 'Listado de Propiedades'},
          {path: 'edit/:id', component: EstatesEditComponent, title: 'Editar Propiedad'}
        ]
      },

      // Módulo: Relaciones propiedad-propietario (porcentajes)
      {
        path: 'estates-owners',
        children: [
          {path: 'list', component: EstateOwnersListComponent, title: 'Listado Porcentajes'},
          {path: 'edit/:id', component: EstateOwnersEditComponent, title: 'Editar Porcentaje'}
        ]
      },

      // Módulo: Sistema de Facturación Emitida
      {
        path: 'invoices-issued',
        children: [
          //{path: '', component: InvoicesIssuedHomeComponent, title: 'Facturas Emitidas'},
          {path: 'register', component: InvoicesIssuedRegisterComponent, title: 'Registrar Factura Emitida'},
          {path: 'list', component: InvoicesIssuedListComponent, title: 'Listado de Facturas Emitidas'},
          {path: 'edit/:id', component: InvoicesIssuedEditComponent, title: 'Editar Factura Emitida'}
        ]
      },
      // Módulo: Sistema de Facturación recibidas
      {
        path: 'invoices-received',
        children: [
          {path: 'register', component: InvoicesRegisterReceivedComponent, title: 'Registar Factura Recibida'},
          {path: 'list', component: InvoicesReceivedListComponent, title: 'Listado de Facturas Recibidas'},
          {path: 'edit/:id', component: InvoicesReceivedEditComponent, title: 'Editar Factura Recibida'}
        ]
      },
      //Módulo: sistemas de gastos internos
      {
        path: 'internal-expenses',
        children: [
          {path: 'register', component: InvoicesExpensesRegisterComponent, title: 'Registrar Factura de Gasto'},
          {path: `list`, component: InvoicesExpensesListComponent, title: 'Listado Facturas de Gastos'},
          {path: 'edit/:id', component: InvoicesExpensesEditComponent, title: 'Editar Factura de Gasto'},
        ]
      },
      //Módulo de proveedores
      {
        path: 'suppliers',
        children: [
          {path: 'register', component: SuppliersRegisterComponent, title: 'Registar Proeveedor'},
          {path: 'list', component: SuppliersListComponent, title: 'Listado de Proveedores'},
          {path: 'edit/id', component: SuppliersEditComponent, title: 'Editar Proveedor'}
        ]
      },
      // Módulo de libro del iva
      {
        path: 'books-vat',
        children:[
          {path: 'vat-book', component: VatBookComponent, title: 'Libro del Iva'}
        ]

      },
      // Módulo: Empleados
      {
        path: 'employee',
        children: [
          {path: 'register', component: EmployeeRegisterComponent, title: 'Registro de Empleados'},
          {path: 'list', component: EmployeeListComponent, title: 'Listado'},
          {path: 'edit/:id', component: EmployeeEditComponent, title: 'Editar'},

        ]
      },

    ]
  },

  // ========================================
  // RUTA POR DEFECTO Y WILDCARD
  // ========================================

  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

/**
 * OBSERVACIONES:
 *
 * ✅ BUENA ESTRUCTURA:
 * - Rutas organizadas por módulos
 * - Protección con authGuard en dashboards
 * - Títulos descriptivos para cada ruta
 * - Patrón consistente: home > register > list > edit
 *
 * ⚠️ INCONSISTENCIAS MENORES:
 * - users usa 'list' y 'edit/:id', otros usan 'user' para registro
 * - estates-owners y invoices usan 'register', otros usan 'user'
 *
 * 🔧 POSIBLES MEJORAS:
 * - Lazy loading para optimizar carga inicial
 * - Guards específicos por rol/módulo
 * - Breadcrumbs automáticos basados en títulos
 */
