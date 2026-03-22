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
  private refreshTimer: number | null = null;
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private api: ApiService,
    private router: Router,
    private userActivityService: UserActivityService
  ) {
    this.initializeSession();
  }

  private hasValidSession(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp < Date.now() / 1000) {
        this.clearTokens();
        return false;
      }
      return true;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  private initializeSession(): void {
    if (this.hasValidSession()) {
      this.userActivityService.startMonitoring();
      this.startTokenRefreshTimer();
    }
  }

  private startTokenRefreshTimer(): void {
    this.clearRefreshTimer();
    this.refreshTimer = window.setInterval(() => {
      this.refreshAccessToken().subscribe({
        next: () => console.log('Token renovado automáticamente'),
        error: () => {} // logout ya gestionado dentro de refreshAccessToken
      });
    }, 5 * 60 * 1000);
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  refreshAccessToken(): Observable<string> {
    // Si ya hay un refresh en curso, encolar: esperar el token emitido por el primero
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1)
      );
    }

    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      this.logout();
      return throwError(() => new Error('No hay refresh token disponible'));
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null); // bloquear colas hasta recibir el nuevo token

    return this.api.post<{ refreshToken: string }, LoginResponse>(
      'auth/refresh-token',
      { refreshToken: storedRefreshToken }
    ).pipe(
      map((response: LoginResponse) => {
        localStorage.setItem('token', response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        this.refreshTokenSubject.next(response.accessToken); // desbloquear colas
        this.isRefreshing = false;
        return response.accessToken;
      }),
      catchError((error) => {
        this.isRefreshing = false;
        this.logout();
        return throwError(() => error);
      })
    );
  }

  private clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  }

  registerUser(user: User): Observable<string> {
    return this.api.post('users', user);
  }

  login(user: UsersLogin): Observable<LoginResponse> {
    return this.api.post<UsersLogin, LoginResponse>('auth/login', user).pipe(
      tap((response: LoginResponse) => {
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('userData', JSON.stringify(response.user));
        this.startTokenRefreshTimer();
        this.userActivityService.startMonitoring();
      })
    );
  }

  logout(): void {
    this.clearTokens();
    this.clearRefreshTimer();
    this.userActivityService.stopMonitoring();
    this.router.navigate(['/login']);
  }

  getUserData(): User | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return this.hasValidSession();
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
