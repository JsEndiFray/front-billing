import {inject, Injectable} from '@angular/core';
import {Observable, tap, throwError} from 'rxjs';
import {LoginResponse, User, UsersLogin} from '../../../interfaces/users-interface';
import {ApiService} from '../api-service/api.service';
import {Router} from '@angular/router';
import {UserActivityService} from '../user-services/user-activity.service';

/**
 * Servicio de autenticación con renovación automática de tokens
 * Maneja estado de sesión global y tokens JWT (access: 15min, refresh: 7 días)
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Timer para renovación automática cada 13 minutos
  private refreshTimer: number | null = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private userActivityService: UserActivityService
  ) {
    this.initializeSession();
  }

  /**
   * Obtiene UserActivityService de forma lazy para evitar dependencia circular
   */
  private getUserActivityService() {
    if (!this.userActivityService) {
      // Importación dinámica para evitar dependencia circular
      import('../user-services/user-activity.service').then(module => {
        const UserActivityService = module.UserActivityService;
        this.userActivityService = inject(UserActivityService);
      });
    }
    return this.userActivityService;
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
      this.startActivityMonitoring()
      this.startTokenRefreshTimer();
    }
  }

  /**
   * Inicia monitoreo de actividad del usuario
   */
  private startActivityMonitoring(): void {
    // Lazy loading para evitar dependencia circular
    setTimeout(() => {
      const activityService = this.getUserActivityService();
      if (activityService) {
        activityService.startMonitoring();
      }
    }, 100);
  }

  /**
   * Detiene monitoreo de actividad del usuario
   */
  private stopActivityMonitoring(): void {
    if (this.userActivityService) {
      this.userActivityService.stopMonitoring();
    }
  }

  /**
   * Inicia renovación automática cada 5 minutos
   */
  private startTokenRefreshTimer(): void {
    this.clearRefreshTimer();
    const refreshInterval = 5 * 60 * 1000; // 5 minutos

    this.refreshTimer = window.setInterval(() => {
      this.refreshAccessToken().subscribe({
        next: () => {
          console.log('Token renovado automáticamente');
        },
        error: (error) => {
          console.error('Error al renovar token:', error);
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
        this.startTokenRefreshTimer();
        this.startActivityMonitoring();
      })
    );
  }

  /**
   * Cierra sesión - limpia todo y redirige a login
   */
  logout(): void {
    this.clearTokens();
    this.clearRefreshTimer();
    this.stopActivityMonitoring();
    this.router.navigate(['/login']);
  }

  // Métodos utilitarios
  getUserData(): User | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
