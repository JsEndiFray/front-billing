import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';

import Swal from 'sweetalert2';
import {Router} from '@angular/router';
import {AuthService} from '../../../core/services/auth-service/auth.service';
import {HttpErrorResponse} from '@angular/common/http';
import {User} from '../../../interfaces/users-interface';
import {UserValidatorService} from '../../../core/services/validator-services/user-validator.service';

/**
 * Componente para registrar nuevos usuarios
 * Permite crear cuentas de usuario con validación
 */
@Component({
  selector: 'app-clients-user',
  imports: [
    FormsModule
  ],
  templateUrl: './users-register.component.html',
  styleUrl: './users-register.component.css'
})
export class UsersRegisterComponent {

  // Objeto que guarda los datos del nuevo usuario
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

  /**
   * Registra un nuevo usuario en el sistema
   * Valida datos antes de enviar al servidor
   */
  registerUser() {
    // Limpiar espacios y preparar datos
    const cleanUser = this.userValidatorService.cleanUserData(this.user)

    // Validar que todos los campos estén correctos
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

    // Convertir rol de español a inglés para el backend
    const backendRoles = this.userValidatorService.transformRoleToBackend(cleanUser.role);

    // Crear objeto con datos listos para enviar
    const newUser: User = {
      username: cleanUser.username,
      password: cleanUser.password,
      email: cleanUser.email,
      phone: cleanUser.phone,
      role: backendRoles
    }

    // Enviar datos al servidor para crear usuario
    this.authService.registerUser(newUser).subscribe({
      next: (data) => {
        if (data && data.length) {
          Swal.fire({
            title: "Se ha registrado correctamente.",
            icon: "success",
            draggable: true
          });
          this.router.navigate(['/dashboards/users/list'])
        }
      },
      error: (e: HttpErrorResponse) => {
        // Error manejado por interceptor
      },
    });
  };

  goBack() {
    this.router.navigate(['/dashboards/users/list'])
  }
}
