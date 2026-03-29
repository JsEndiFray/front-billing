import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, filter, map, take, tap, throwError } from 'rxjs';
import { LoginResponse, User, UsersLogin } from '../../../interfaces/users-interface';
import { ApiService } from '../api-service/api.service';
import { Router } from '@angular/router';
import { UserActivityService } from './user-activity.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // ── Token en memoria (nunca en localStorage) ──────────────────────────────
  private accessToken: string | null = null;

  // ── Control de refresh concurrente ────────────────────────────────────────
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  // ── Señal de inicialización (guards esperan hasta que sea true) ───────────
  private readonly initializedSubject = new BehaviorSubject<boolean>(false);

  // ── Timer de renovación automática ───────────────────────────────────────
  private refreshTimer: number | null = null;

  constructor(
    private api: ApiService,
    private router: Router,
    private userActivityService: UserActivityService
  ) {
    // Suscribirse a timeout de inactividad
    this.userActivityService.timeout$.subscribe(() => this.logout());

    // Intentar restaurar sesión via cookie httpOnly al iniciar
    this.initializeSession();
  }

  /** Observable que resuelve true en cuanto la inicialización termina */
  waitForInit(): Observable<true> {
    return this.initializedSubject.pipe(
      filter((initialized): initialized is true => initialized),
      take(1)
    );
  }

  // ── Inicialización asíncrona ──────────────────────────────────────────────

  private initializeSession(): void {
    this.refreshAccessToken().subscribe({
      next: () => {
        this.userActivityService.startMonitoring();
        this.startTokenRefreshTimer();
        this.initializedSubject.next(true);
      },
      error: () => {
        // Sin sesión válida — guards redirigirán a /login
        this.initializedSubject.next(true);
      }
    });
  }

  // ── Validación de token en memoria ───────────────────────────────────────

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  // ── Timer de renovación automática ───────────────────────────────────────

  private startTokenRefreshTimer(): void {
    this.clearRefreshTimer();
    this.refreshTimer = window.setInterval(() => {
      this.refreshAccessToken().subscribe({
        next: () => console.log('Token renovado automáticamente'),
        error: () => this.logout()
      });
    }, 5 * 60 * 1000);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ── Renovación de token ───────────────────────────────────────────────────

  /**
   * Renueva el accessToken usando la cookie httpOnly (withCredentials via interceptor).
   * Garantiza un único refresh real cuando hay peticiones concurrentes.
   */
  refreshAccessToken(): Observable<string> {
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1)
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.api.post<Record<string, never>, LoginResponse>('auth/refresh-token', {}).pipe(
      map((response: LoginResponse) => {
        this.accessToken = response.accessToken;
        this.refreshTokenSubject.next(response.accessToken);
        this.isRefreshing = false;
        return response.accessToken;
      }),
      catchError((error) => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  // ── Limpieza de sesión ────────────────────────────────────────────────────

  private clearSession(): void {
    this.accessToken = null;
    localStorage.removeItem('userData');
    this.clearRefreshTimer();
    this.userActivityService.stopMonitoring();
  }

  // ── API pública ───────────────────────────────────────────────────────────

  registerUser(user: User): Observable<string> {
    return this.api.post('users', user);
  }

  login(user: UsersLogin): Observable<LoginResponse> {
    return this.api.post<UsersLogin, LoginResponse>('auth/login', user).pipe(
      tap((response: LoginResponse) => {
        this.accessToken = response.accessToken;
        localStorage.setItem('userData', JSON.stringify(response.user));
        this.startTokenRefreshTimer();
        this.userActivityService.startMonitoring();
      })
    );
  }

  logout(): void {
    this.clearSession();
    // Notificar al backend (revoca refresh token + borra cookie) — fire-and-forget
    this.api.post<Record<string, never>, void>('auth/logout', {}).subscribe({ error: () => {} });
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getUserData(): User | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null && this.isTokenValid(this.accessToken);
  }

  getCurrentUserRole(): string {
    const userData = localStorage.getItem('userData');
    if (!userData) return 'employee';
    try {
      const user = JSON.parse(userData);
      return user.role || 'employee';
    } catch {
      return 'employee';
    }
  }

  isAdmin(): boolean {
    return this.getCurrentUserRole() === 'admin';
  }
}
