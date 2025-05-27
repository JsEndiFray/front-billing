import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';

import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {AuthService} from '../../../core/services/auth-service/auth.service';
import {HttpErrorResponse} from '@angular/common/http';
import {User} from '../../../interface/users-interface';
import {UserValidatorService} from '../../../core/services/validator-services/user-validator.service';


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
  user: User = {
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
    private userValidatorService: UserValidatorService,
  ) {
  }

  //Registros de los usuarios
  registerUser() {
    //Limpiar y transformar datos
    const cleanUser = this.userValidatorService.cleanUserData(this.user)
    // Validar campos requeridos y confirmacion de contraseñas
    const validation = this.userValidatorService.validateUser(cleanUser)
    if (!validation.isValid) {
      Swal.fire({
        title: 'Error!',
        text: validation.message,
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }
    //cambiar el nombre de español a ingles al backend
    const backendRoles = this.userValidatorService.transformRoleToBackend(cleanUser.role);

    //creamos el objeto para el registro al backend.
    const newUser: User = {
      username: cleanUser.username,
      password: cleanUser.password,
      email: cleanUser.email,
      phone: cleanUser.phone,
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



