import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, tap, throwError} from 'rxjs';
import {LoginResponse, User, UsersLogin} from '../../../interface/users-interface';
import {ApiService} from '../api-service/api.service';
import {Router} from '@angular/router';

/**
 * Servicio de autenticación con renovación automática de tokens
 * Maneja estado de sesión global y tokens JWT (access: 15min, refresh: 7 días)
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Estado de sesión observable
  private loggedIn = new BehaviorSubject<boolean>(this.hasValidSession());
  isLoggedIn$ = this.loggedIn.asObservable();

  // Timer para renovación automática cada 13 minutos
  private refreshTimer: number | null = null;

  constructor(
    private api: ApiService,
    private router: Router,
  ) {
    this.initializeSession();
  }

  /**
   * Verifica si hay sesión válida al inicializar
   */
  private hasValidSession(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      // Verificar expiración del JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;

      if (payload.exp < now) {
        this.clearTokens();
        return false;
      }
      return true;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  /**
   * Inicializa estado de sesión al cargar app
   */
  private initializeSession(): void {
    const hasSession = this.hasValidSession();

    if (hasSession) {
      this.activateSession();
      this.startTokenRefreshTimer();
    } else {
      this.deactivateSession();
    }
  }

  /**
   * Activa/desactiva estado de sesión
   */
  activateSession(): void {
    this.loggedIn.next(true);
  }

  deactivateSession(): void {
    this.loggedIn.next(false);
    this.clearRefreshTimer();
  }

  /**
   * Inicia renovación automática cada 13 minutos
   */
  private startTokenRefreshTimer(): void {
    this.clearRefreshTimer();
    const refreshInterval = 13 * 60 * 1000; // 13 minutos

    this.refreshTimer = window.setInterval(() => {
      this.refreshAccessToken().subscribe({
        next: () => {},
        error: (error) => {
          this.logout();
        }
      });
    }, refreshInterval);
  }

  /**
   * Limpia timer de renovación
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Renueva access token usando refresh token
   */
  refreshAccessToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.api.post<{ refreshToken: string }, LoginResponse>('auth/refresh-token', { refreshToken }).pipe(
      tap((response: LoginResponse) => {
        localStorage.setItem('token', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
      })
    );
  }

  /**
   * Limpia tokens del localStorage
   */
  private clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  }

  /**
   * Registra nuevo usuario
   */
  registerUser(user: User): Observable<string> {
    return this.api.post('users', user);
  }

  /**
   * Inicia sesión - guarda tokens y activa renovación automática
   */
  login(user: UsersLogin): Observable<LoginResponse> {
    return this.api.post<UsersLogin, LoginResponse>('auth/login', user).pipe(
      tap((response: LoginResponse) => {
        // Guardar tokens y datos
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('userData', JSON.stringify(response.user));

        // Activar sesión completa
        this.activateSession();
        this.startTokenRefreshTimer();
      })
    );
  }

  /**
   * Cierra sesión - limpia todo y redirige a login
   */
  logout(): void {
    this.clearTokens();
    this.deactivateSession();
    this.router.navigate(['/login']);
  }

  // Métodos utilitarios
  getUserData(): User | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated(): boolean {
    return this.loggedIn.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
