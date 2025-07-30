import {Routes} from '@angular/router';

// ========================================
// IMPORTACIONES ORGANIZADAS POR MÓDULO
// ========================================

// Usuarios - Autenticación y gestión
import {LoginComponent} from './pages/users/login/login.component';
import {UsersRegisterComponent} from './pages/users/users-register/users-register.component';
import {UsersHomeComponent} from './pages/users/users-home/users-home.component';
import {UserListComponent} from './pages/users/user-list/user-list.component';
import {UserEditComponent} from './pages/users/user-edit/user-edit.component';

// Dashboard principal
import {DashboardComponent} from './pages/dashboards/dashboard/dashboard.component';
import {DashboardHomeComponent} from './pages/dashboards/dashboard-home/dashboard-home.component';
import {authGuard} from './core/guards/auth.guard';

// Clientes - Gestión de clientes del negocio
import {ClientsHomeComponent} from './pages/clients/clients-home/clients-home.component';
import {ClientsRegisterComponent} from './pages/clients/clients-register/clients-register.component';
import {ClientsListComponent} from './pages/clients/clients-list/clients-list.component';
import {ClientsEditComponent} from './pages/clients/clients-edit/clients-edit.component';

// Propietarios (Owners) - Gestión de propietarios de inmuebles
import {OwnersHomeComponent} from './pages/owners/owners-home/owners-home.component';
import {OwnersRegisterComponent} from './pages/owners/owners-register/owners-register.component';
import {OwnersListComponent} from './pages/owners/owners-list/owners-list.component';
import {OwnersEditComponent} from './pages/owners/owners-edit/owners-edit.component';

// Propiedades (Estates) - Gestión de inmuebles
import {EstatesHomeComponent} from './pages/estates/estates-home/estates-home.component';
import {EstatesRegisterComponent} from './pages/estates/estates-register/estates-register.component';
import {EstatesListComponent} from './pages/estates/estates-list/estates-list.component';
import {EstatesEditComponent} from './pages/estates/estates-edit/estates-edit.component';

// Porcentajes de propiedades (Estates-Owners) - Relaciones propiedad-propietario
import {EstateOwnersHomeComponent} from './pages/estate-owners/estate-owners-home/estate-owners-home.component';
import {
  EstateOwnersRegisterComponent
} from './pages/estate-owners/estate-owners-register/estate-owners-register.component';
import {EstateOwnersListComponent} from './pages/estate-owners/estate-owners-list/estate-owners-list.component';
import {EstateOwnersEditComponent} from './pages/estate-owners/estate-owners-edit/estate-owners-edit.component';

// Facturas (Bills) - Sistema de facturación
//import { InvoicesIssuedHomeComponent } from './pages/invoices/invoices-issued/invoices-issued-home/invoices-issued-home.component'; // ASUMO que bills-home se renombra a invoices-issued-home
import { InvoicesIssuedRegisterComponent} from './pages/invoices/invoices-issued/invoices-issued-register/invoices-issued-register.component';
import { InvoicesIssuedListComponent} from './pages/invoices/invoices-issued/invoices-issued-list/invoices-issued-list.component';
import { InvoicesIssuedEditComponent} from './pages/invoices/invoices-issued/invoices-issued-edit/Invoices-Issued-Edit.Component';

// Empleados (Employee) - Sistema de empleados
import {EmployeeHomeComponent} from './pages/employee/employee-home/employee-home.component';
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
          {path: '', component: UsersHomeComponent, title: 'Usuarios'},
          {path: 'list', component: UserListComponent, title: 'Listado'},
          {path: 'edit/:id', component: UserEditComponent, title: 'Editar'},
          {path: 'register', component: UsersRegisterComponent, title: 'Registro de Usuarios'},
        ]
      },
      // Módulo: Clientes del negocio
      {
        path: 'clients',
        children: [
          {path: '', component: ClientsHomeComponent, title: 'Clientes'},
          {path: 'register', component: ClientsRegisterComponent, title: 'Registrar Cliente'},
          {path: 'list', component: ClientsListComponent, title: 'Listado Clientes'},
          {path: 'edit/:id', component: ClientsEditComponent, title: 'Editar Cliente'},
        ]
      },

      // Módulo: Propietarios de inmuebles
      {
        path: 'owners',
        children: [
          {path: '', component: OwnersHomeComponent, title: 'Propietarios'},
          {path: 'register', component: OwnersRegisterComponent, title: 'Registrar Propietario'},
          {path: 'list', component: OwnersListComponent, title: 'Listado Propietarios'},
          {path: 'edit/:id', component: OwnersEditComponent, title: 'Editar Propietario'}
        ]
      },

      // Módulo: Propiedades inmobiliarias
      {
        path: 'estates',
        children: [
          {path: '', component: EstatesHomeComponent, title: 'Propiedades'},
          {path: 'register', component: EstatesRegisterComponent, title: 'Registrar Propiedad'},
          {path: 'list', component: EstatesListComponent, title: 'Listado Propiedades'},
          {path: 'edit/:id', component: EstatesEditComponent, title: 'Editar Propiedad'}
        ]
      },

      // Módulo: Relaciones propiedad-propietario (porcentajes)
      {
        path: 'estates-owners',
        children: [
          {path: '', component: EstateOwnersHomeComponent, title: 'Propiedades - Propietarios'},
          {path: 'register', component: EstateOwnersRegisterComponent, title: 'Registrar Porcentaje'},
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
          {path: 'list', component: InvoicesIssuedListComponent, title: 'Listado Facturas Emitidas'},
          {path: 'edit/:id', component: InvoicesIssuedEditComponent, title: 'Editar Factura Emitida'}
        ]
      },
      // Módulo: Empleados
      {
        path: 'employee',
        children: [
          {path: '', component: EmployeeHomeComponent, title: 'Empleados'},
          {path: 'list', component: EmployeeListComponent, title: 'Listado'},
          {path: 'edit/:id', component: EmployeeEditComponent, title: 'Editar'},
          {path: 'register', component: EmployeeRegisterComponent, title: 'Registro de Empleados'},
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
