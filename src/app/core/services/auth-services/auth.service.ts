import { Injectable } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';
import { LoginResponse, User, UsersLogin } from '../../../interfaces/users-interface';
import { ApiService } from '../api-service/api.service';
import { Router } from '@angular/router';
import { UserActivityService } from './user-activity.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private refreshTimer: number | null = null;

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
