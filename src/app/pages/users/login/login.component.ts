import {Component} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {AuthService} from '../../../core/services/auth-service/auth.service';
import Swal from 'sweetalert2';
import {HttpErrorResponse} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {UsersLogin} from '../../../interface/users-interface';


@Component({
  selector: 'app-login',
  imports: [
    RouterLink,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  user: UsersLogin = {
    username: '',
    password: '',
  }


  constructor(private router: Router, private authService: AuthService) {
  }

  login() {
    //validaciones
    if (this.user.username == '' || this.user.password == '') {
      Swal.fire({
        title: 'Error!',
        text: 'Todo los campos son obligatorios.',
        icon: 'error',
        confirmButtonText: 'Ok'
      });
      return;
    }

    //objeto para el backend del login
    const user: UsersLogin = {
      username: this.user.username,
      password: this.user.password,
    }
    //conexion al bakcen
    this.authService.login(user).subscribe({
      next: (response) => {
        //guardamos el token
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);

        //datos del usuario que inicia sesion
        localStorage.setItem('userData', JSON.stringify({
          id: response.data.user.id,
          username: response.data.user.username,
          role: response.data.user.role
        }));

        //activacion del cierre de sesion
        this.authService.activateSession();
        this.router.navigate(['/dashboard']);

      },
      error: (e: HttpErrorResponse) => {
      }
    });

  }

}
