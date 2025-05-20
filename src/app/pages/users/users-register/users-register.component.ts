import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {usersRegister, usersRegisterDTO} from '../../../interface/users-interface';

import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {AuthService} from '../../../core/services/auth-service/auth.service';
import {HttpErrorResponse} from '@angular/common/http';


@Component({
  selector: 'app-clients-user',
  imports: [
    FormsModule
  ],
  templateUrl: './users-register.component.html',
  styleUrl: './users-register.component.css'
})
export class UsersRegisterComponent {
  // se inicializa para el formulario
  user: usersRegister = {
    id: null,
    username: '',
    password: '',
    confirm_password: '',
    email: '',
    phone: '',
    role: ''
  };

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {
  }

  //Registros de los usuarios
  registerUser() {
    // Validación del registro
    if (!this.user.username ||
      !this.user.password ||
      !this.user.email ||
      !this.user.phone) {
      Swal.fire({
        title: 'Error!',
        text: 'Todo los campos son obligatorios.',
        icon: 'error',
        confirmButtonText: 'Ok'
      })
      return;
    }
    //validacion password
    if (this.user.password !== this.user.confirm_password) {
      Swal.fire({
        title: 'Error!',
        text: 'Las contraseñas son distintas.',
        icon: 'error',
        confirmButtonText: 'Ok'
      })
      return;
    }
    // Comprobar si se ha seleccionado un rol
    if (!this.user.role || this.user.role === '') {
      Swal.fire({
        title: 'Error!',
        text: 'Debe seleccionar un rol.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    //cambiar el nombre de español a ingles al backend
    let backendRoles = '';
    if (this.user.role === 'empleado') {
      backendRoles = 'employee';
    } else if (this.user.role === 'administrador') {
      backendRoles = 'admin';
    } else {
      backendRoles = this.user.role;
    }

    //creamos el objeto para el registro al backend.
    const newUser: usersRegisterDTO = {
      username: this.user.username,
      password: this.user.password,
      email: this.user.email,
      phone: this.user.phone,
      role: backendRoles
    }
    //conexion al backend.
    this.authService.registerUser(newUser).subscribe({
      next: (data) => {
        Swal.fire({
          title: "Se ha registrado correctamente.",
          icon: "success",
          draggable: true
        });
        this.router.navigate(['/login']);
      },
      error: (e: HttpErrorResponse) => {
      },
    });
  };


}



