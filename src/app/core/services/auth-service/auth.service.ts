import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, tap} from 'rxjs';
import {LoginResponse, Users, usersRegisterDTO} from '../../../interface/users-interface';
import {ApiService} from '../api-service/api.service';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loggedIn = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedIn.asObservable();

  constructor(
    private api: ApiService,
    private router: Router,
  ) {
  }

  //activar la sesion
  activateSession() {
    this.loggedIn.next(true);
  }

  //desactivar sesion
  deactivateSession() {
    this.loggedIn.next(false);
  }

//registro de usuarios
  registerUser(user: usersRegisterDTO): Observable<string> {
    return this.api.post('users', user);
  }

//login de usuarios
  login(user: Users): Observable<LoginResponse> {
    return this.api.post<Users, LoginResponse>('auth/login', user).pipe(
      tap((response: LoginResponse) => {
        localStorage.setItem('token', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      })
    )
  }

  //logout
  logout() {
    //Eliminar todos los datos de autenticación
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');

    //desactivar sesion
    this.deactivateSession();

    //ir al login
    this.router.navigate(['/login']);
  }


}
