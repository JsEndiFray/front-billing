import { Routes } from '@angular/router';

// ========================================
// IMPORTACIONES ORGANIZADAS POR MÓDULO
// ========================================

// Usuarios - Autenticación y gestión
import { LoginComponent } from './pages/users/login/login.component';
import { UsersRegisterComponent } from './pages/users/users-register/users-register.component';
import {UsersHomeComponent} from './pages/users/users-home/users-home.component';

// Dashboard principal
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import {authGuard} from './core/guards/auth.guard';

// Clientes - Gestión de clientes del negocio
import { ClientsHomeComponent } from './pages/clients/clients-home/clients-home.component';
import { ClientsRegisterComponent } from './pages/clients/clients-register/clients-register.component';
import { ClientsListComponent } from './pages/clients/clients-list/clients-list.component';
import { ClientsEditComponent } from './pages/clients/clients-edit/clients-edit.component';

// Propietarios (Owners) - Gestión de propietarios de inmuebles
import { OwnersHomeComponent } from './pages/owners/owners-home/owners-home.component';
import { OwnersRegisterComponent } from './pages/owners/owners-register/owners-register.component';
import { OwnersListComponent } from './pages/owners/owners-list/owners-list.component';
import { OwnersEditComponent } from './pages/owners/owners-edit/owners-edit.component';

// Propiedades (Estates) - Gestión de inmuebles
import { EstatesHomeComponent } from './pages/estates/estates-home/estates-home.component';
import { EstatesRegisterComponent } from './pages/estates/estates-register/estates-register.component';
import { EstatesListComponent } from './pages/estates/estates-list/estates-list.component';
import { EstatesEditComponent } from './pages/estates/estates-edit/estates-edit.component';

// Porcentajes de propiedades (Estates-Owners) - Relaciones propiedad-propietario
import { EstateOwnersHomeComponent } from './pages/estate-owners/estate-owners-home/estate-owners-home.component';
import { EstateOwnersRegisterComponent } from './pages/estate-owners/estate-owners-register/estate-owners-register.component';
import { EstateOwnersListComponent } from './pages/estate-owners/estate-owners-list/estate-owners-list.component';
import { EstateOwnersEditComponent } from './pages/estate-owners/estate-owners-edit/estate-owners-edit.component';

// Facturas (Bills) - Sistema de facturación
import { BillsHomeComponent } from './pages/bills/bills-home/bills-home.component';
import { BillsRegisterComponent } from './pages/bills/bills-register/bills-register.component';
import { BillsListComponent } from './pages/bills/bills-list/bills-list.component';
import { BillsEditComponent } from './pages/bills/bills-edit/bills-edit.component';
import {UserListComponent} from './pages/users/user-list/user-list.component';
import {UserEditComponent} from './pages/users/user-edit/user-edit.component';

/**
 * Configuración de rutas para aplicación de gestión inmobiliaria
 *
 * ESTRUCTURA:
 * - Rutas públicas: login, register
 * - Rutas protegidas: dashboard/** (requiere autenticación)
 * - Módulos: usuarios, clientes, propietarios, propiedades, relaciones, facturas
 *
 * PATRONES:
 * - Cada módulo tiene: home, register/user, list, edit/:id
 * - Todas las rutas protegidas bajo /dashboard con authGuard
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
  {
    path: 'register',
    component: UsersRegisterComponent,
    title: 'Registro de Usuarios'
  },

  // ========================================
  // RUTAS PROTEGIDAS (requieren authGuard)
  // ========================================

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard], // 🔒 Protege todas las rutas hijas
    title: 'Panel de Control',
    children: [

      // Módulo: Usuarios del sistema
      {
        path: 'users',
        children: [
          {path: '', component: UsersHomeComponent, title: 'Usuarios'},
          {path: 'list', component: UserListComponent, title: 'Listado'},
          {path: 'edit/:id', component: UserEditComponent, title: 'Editar'},
        ]
      },

      // Módulo: Clientes del negocio
      {
        path: 'clients',
        children: [
          { path: '', component: ClientsHomeComponent, title: 'Clientes' },
          { path: 'user', component: ClientsRegisterComponent, title: 'Registrar Cliente' },
          { path: 'list', component: ClientsListComponent, title: 'Listado Clientes' },
          { path: 'edit/:id', component: ClientsEditComponent, title: 'Editar Cliente' },
        ]
      },

      // Módulo: Propietarios de inmuebles
      {
        path: 'owners',
        children: [
          { path: '', component: OwnersHomeComponent, title: 'Propietarios' },
          { path: 'user', component: OwnersRegisterComponent, title: 'Registrar Propietario' },
          { path: 'list', component: OwnersListComponent, title: 'Listado Propietarios' },
          { path: 'edit/:id', component: OwnersEditComponent, title: 'Editar Propietario' }
        ]
      },

      // Módulo: Propiedades inmobiliarias
      {
        path: 'estates',
        children: [
          { path: '', component: EstatesHomeComponent, title: 'Propiedades' },
          { path: 'user', component: EstatesRegisterComponent, title: 'Registrar Propiedad' },
          { path: 'list', component: EstatesListComponent, title: 'Listado Propiedades' },
          { path: 'edit/:id', component: EstatesEditComponent, title: 'Editar Propiedad' }
        ]
      },

      // Módulo: Relaciones propiedad-propietario (porcentajes)
      {
        path: 'estates-owners',
        children: [
          { path: '', component: EstateOwnersHomeComponent, title: 'Propiedades - Propietarios' },
          { path: 'register', component: EstateOwnersRegisterComponent, title: 'Registrar Porcentaje' },
          { path: 'list', component: EstateOwnersListComponent, title: 'Listado Porcentajes' },
          { path: 'edit/:id', component: EstateOwnersEditComponent, title: 'Editar Porcentaje' }
        ]
      },

      // Módulo: Sistema de facturación
      {
        path: 'bills',
        children: [
          { path: '', component: BillsHomeComponent, title: 'Facturas' },
          { path: 'register', component: BillsRegisterComponent, title: 'Registrar Factura' },
          { path: 'list', component: BillsListComponent, title: 'Listado Facturas' },
          { path: 'edit/:id', component: BillsEditComponent, title: 'Editar Factura' }
        ]
      }
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
 * - Protección con authGuard en dashboard
 * - Títulos descriptivos para cada ruta
 * - Patrón consistente: home > register > list > edit
 *
 * ⚠️ INCONSISTENCIAS MENORES:
 * - users usa 'list' y 'edit/:id', otros usan 'user' para registro
 * - estates-owners y bills usan 'register', otros usan 'user'
 *
 * 🔧 POSIBLES MEJORAS:
 * - Lazy loading para optimizar carga inicial
 * - Guards específicos por rol/módulo
 * - Breadcrumbs automáticos basados en títulos
 */
