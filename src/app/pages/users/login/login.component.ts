import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../../../core/services/auth-service/auth.service';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {UsersLogin} from '../../../interface/users-interface';

/**
 * Componente de autenticación
 * Maneja login de usuarios y redirección a dashboard
 */

@Component({
  selector: 'app-login',
  imports: [
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  // Modelo del formulario
  user: UsersLogin = {
    username: '',
    password: '',
  }

  constructor(private router: Router, private authService: AuthService) {
  }

  /**
   * Procesa login con validación básica
   * Nota: AuthService maneja el guardado de tokens automáticamente
   */
  login() {
    // Validación básica de campos
    if (this.user.username == '' || this.user.password == '') {
      Swal.fire({
        title: 'Error!',
        text: 'Todo los campos son obligatorios.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    // Preparar datos para backend
    const user: UsersLogin = {
      username: this.user.username,
      password: this.user.password,
    }

    // Autenticar usuario
    this.authService.login(user).subscribe({
      next: (login) => {
        // TODO: El AuthService ya maneja tokens automáticamente
        // Este código duplica funcionalidad del servicio
        localStorage.setItem('token', login.accessToken);
        localStorage.setItem('refreshToken', login.refreshToken);

        localStorage.setItem('userData', JSON.stringify({
          id: login.user.id,
          username: login.user.username,
          role: login.user.role
        }));

        this.authService.activateSession();
        this.router.navigate(['/dashboard']);
      },
      error: (e: HttpErrorResponse) => {
        // Manejo de errores por interceptor
      }
    });
  }
}
