import { Routes } from '@angular/router';

//Usuarios
import { LoginComponent } from './pages/users/login/login.component';
import { UsersRegisterComponent } from './pages/users/users-register/users-register.component';
import {UsersHomeComponent} from './pages/users/users-home/users-home.component';

//Dashboard
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import {authGuard} from './core/guards/auth.guard';

//Clientes
import { ClientsHomeComponent } from './pages/clients/clients-home/clients-home.component';
import { ClientsRegisterComponent } from './pages/clients/clients-register/clients-register.component';
import { ClientsListComponent } from './pages/clients/clients-list/clients-list.component';
import { ClientsEditComponent } from './pages/clients/clients-edit/clients-edit.component';

//Propietarios (Owners)
import { OwnersHomeComponent } from './pages/owners/owners-home/owners-home.component';
import { OwnersRegisterComponent } from './pages/owners/owners-register/owners-register.component';
import { OwnersListComponent } from './pages/owners/owners-list/owners-list.component';
import { OwnersEditComponent } from './pages/owners/owners-edit/owners-edit.component';

//Propiedades (Estates)
import { EstatesHomeComponent } from './pages/estates/estates-home/estates-home.component';
import { EstatesRegisterComponent } from './pages/estates/estates-register/estates-register.component';
import { EstatesListComponent } from './pages/estates/estates-list/estates-list.component';
import { EstatesEditComponent } from './pages/estates/estates-edit/estates-edit.component';

//Porcentajes de propiedades (Ownership)
import { EstateOwnersHomeComponent } from './pages/estate-owners/estate-owners-home/estate-owners-home.component';
import { EstateOwnersRegisterComponent } from './pages/estate-owners/estate-owners-register/estate-owners-register.component';
import { EstateOwnersListComponent } from './pages/estate-owners/estate-owners-list/estate-owners-list.component';
import { EstateOwnersEditComponent } from './pages/estate-owners/estate-owners-edit/estate-owners-edit.component';

//Facturas (Bills)
import { BillsHomeComponent } from './pages/bills/bills-home/bills-home.component';
import { BillsRegisterComponent } from './pages/bills/bills-register/bills-register.component';
import { BillsListComponent } from './pages/bills/bills-list/bills-list.component';
import { BillsEditComponent } from './pages/bills/bills-edit/bills-edit.component';
import {UserListComponent} from './pages/users/user-list/user-list.component';
import {UserEditComponent} from './pages/users/user-edit/user-edit.component';



export const routes: Routes = [
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
  {
    path: 'dashboard',
    component: DashboardComponent, canActivate: [authGuard],
    title: 'Panel de Control',
    children: [
      //Usuarios
      {
        path: 'users',
        children: [
          {path: '',component: UsersHomeComponent, title: 'Usuarios'},
          {path: 'list', component: UserListComponent, title: 'Listado'},
          {path: 'edit/:id', component: UserEditComponent, title: 'Editar'},


        ]
      },
      // Clientes
      {
        path: 'clients',
        children: [
          { path: '', component: ClientsHomeComponent, title: 'Clientes' },
          { path: 'user', component: ClientsRegisterComponent, title: 'Registrar Cliente' },
          { path: 'list', component: ClientsListComponent, title: 'Listado Clientes' },
          { path: 'edit/:id', component: ClientsEditComponent, title: 'Editar Cliente' },
        ]
      },
      // Propietarios
      {
        path: 'owners',
        children: [
          { path: '', component: OwnersHomeComponent, title: 'Propietarios' },
          { path: 'user', component: OwnersRegisterComponent, title: 'Registrar Propietario' },
          { path: 'list', component: OwnersListComponent, title: 'Listado Propietarios' },
          { path: 'edit/:id', component: OwnersEditComponent, title: 'Editar Propietario' }
        ]
      },
      // Propiedades
      {
        path: 'estates',
        children: [
          { path: '', component: EstatesHomeComponent, title: 'Propiedades' },
          { path: 'user', component: EstatesRegisterComponent, title: 'Registrar Propiedad' },
          { path: 'list', component: EstatesListComponent, title: 'Listado Propiedades' },
          { path: 'edit/:id', component: EstatesEditComponent, title: 'Editar Propiedad' }
        ]
      },
      // Porcentajes de Propiedades
      {
        path: 'estates-owners',
        children: [
          { path: '', component: EstateOwnersHomeComponent, title: 'Propiedades - Propietarios' },
          { path: 'register', component: EstateOwnersRegisterComponent, title: 'Registrar Porcentaje' },
          { path: 'list', component: EstateOwnersListComponent, title: 'Listado Porcentajes' },
          { path: 'edit/:id', component: EstateOwnersEditComponent, title: 'Editar Porcentaje' }
        ]
      },
      // Facturas
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
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
