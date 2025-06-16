import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, tap, throwError} from 'rxjs';
import {LoginResponse, User, UsersLogin} from '../../../interface/users-interface';
import {ApiService} from '../api-service/api.service';
import {Router} from '@angular/router';

/**
 * 🔐 SERVICIO DE AUTENTICACIÓN
 *
 * Responsabilidades principales:
 * - Manejar login/logout de usuarios
 * - Mantener estado de sesión activa/inactiva
 * - Renovar tokens automáticamente antes de que expiren
 * - Verificar validez de tokens existentes al inicializar
 *
 * Patrón: Singleton (providedIn: 'root')
 * Tokens: AccessToken (15min) + RefreshToken (7 días)
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // 📡 ESTADO CENTRAL DE LA APLICACIÓN
  // BehaviorSubject: Observable que mantiene el último valor emitido
  // Se inicializa verificando si ya hay una sesión válida guardada
  private loggedIn = new BehaviorSubject<boolean>(this.hasValidSession());

  // 👁️ OBSERVABLE PÚBLICO para que componentes escuchen cambios de estado
  // Los componentes se suscriben a esto para reaccionar a login/logout
  isLoggedIn$ = this.loggedIn.asObservable();

  // ⏰ TIMER para renovación automática de tokens
  // number = ID del timer en el navegador, null = no hay timer activo
  private refreshTimer: number | null = null;

  constructor(
    private api: ApiService,    // 🌐 Para hacer peticiones HTTP
    private router: Router,     // 🧭 Para navegar entre rutas
  ) {
    // 🚀 Al crear el servicio, inicializar estado de sesión
    this.initializeSession();
  }

  // ==========================================
  // 🔍 VERIFICACIÓN DE SESIÓN EXISTENTE
  // ==========================================

  /**
   * ✅ Verifica si hay una sesión válida al inicializar la app
   *
   * Chequea:
   * 1. Si existe token en localStorage
   * 2. Si el token no está expirado
   * 3. Si el token tiene formato válido
   *
   * @returns true si hay sesión válida, false si no
   */
  private hasValidSession(): boolean {
    // 📦 Buscar token en almacenamiento local del navegador
    const token = localStorage.getItem('token');
    if (!token) return false; // No hay token = no hay sesión

    try {
      // 🔓 DECODIFICAR TOKEN JWT
      // JWT tiene 3 partes separadas por puntos: header.payload.signature
      // Nos interesa el payload (parte del medio) que contiene los datos
      const payload = JSON.parse(atob(token.split('.')[1]));

      // ⏰ VERIFICAR EXPIRACIÓN
      // payload.exp = fecha de expiración en segundos (formato Unix)
      // Date.now() = milisegundos, dividimos por 1000 para convertir a segundos
      const now = Date.now() / 1000;

      if (payload.exp < now) {
        this.clearTokens();
        return false;
      }

      // ✅ Token existe y es válido
      return true;
    } catch (error) {
      // 🚨 Error al decodificar = token corrupto
      console.error('Token inválido:', error);
      this.clearTokens();
      return false;
    }
  }

  // ==========================================
  // 🚀 INICIALIZACIÓN Y GESTIÓN DE SESIÓN
  // ==========================================

  /**
   * 🎬 Inicializa el estado de sesión al cargar la aplicación
   *
   * Se ejecuta automáticamente en el constructor.
   * Decide si el usuario debe estar logueado o no al entrar a la app.
   */
  private initializeSession(): void {
    const hasSession = this.hasValidSession();

    if (hasSession) {
      this.activateSession();        // 📡 Notificar que está logueado
      this.startTokenRefreshTimer(); // ⏰ Iniciar renovación automática
    } else {
      this.deactivateSession();      // 📡 Notificar que NO está logueado
    }
  }

  /**
   * ✅ Activa el estado de sesión
   *
   * Notifica a toda la aplicación que el usuario está logueado.
   * Los componentes suscritos a isLoggedIn$ recibirán 'true'.
   */
  activateSession(): void {
    this.loggedIn.next(true);
  }

  /**
   * ❌ Desactiva el estado de sesión
   *
   * Notifica a toda la aplicación que el usuario NO está logueado.
   * También limpia el timer de renovación.
   */
  deactivateSession(): void {
    this.loggedIn.next(false);
    this.clearRefreshTimer();
  }

  // ==========================================
  // ⏰ RENOVACIÓN AUTOMÁTICA DE TOKENS
  // ==========================================

  /**
   * 🕐 Inicia el temporizador de renovación automática
   *
   * El access token expira en 15 minutos.
   * Este timer lo renueva cada 13 minutos (2 minutos antes de que expire).
   * Así el usuario nunca experimenta errores de "sesión expirada".
   */
  private startTokenRefreshTimer(): void {
    // 🧹 Limpiar timer anterior (por si acaso ya había uno)
    this.clearRefreshTimer();

    // ⏰ 13 minutos = 13 * 60 segundos * 1000 milisegundos
    const refreshInterval = 13 * 60 * 1000;

    // 🔄 Configurar renovación automática cada 13 minutos
    this.refreshTimer = window.setInterval(() => {
      this.refreshAccessToken().subscribe({
        next: () => {},
        error: (error) => {
          this.logout(); // 🚪 Cerrar sesión por seguridad
        }
      });
    }, refreshInterval);
  }

  /**
   * 🧹 Limpia el temporizador de renovación
   *
   * Se ejecuta al cerrar sesión o al crear un nuevo timer.
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer !== null) {
      window.clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * 🔄 Renueva el access token usando el refresh token
   *
   * El refresh token dura 7 días, permite obtener nuevos access tokens
   * sin que el usuario tenga que volver a hacer login.
   *
   * @returns Observable con la respuesta del servidor
   */
  refreshAccessToken(): Observable<LoginResponse> {
    // 🔑 Obtener refresh token (dura más que el access token)
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      // ❌ No hay refresh token = no se puede renovar
      return throwError(() => new Error('No refresh token available'));
    }

    // 🌐 Pedir nuevo access token al servidor
    return this.api.post<{ refreshToken: string }, LoginResponse>('auth/refresh-token', { refreshToken }).pipe(
      tap((response: LoginResponse) => {
        // 💾 Guardar nuevo access token
        localStorage.setItem('token', response.accessToken);

        // 💾 Actualizar refresh token si el servidor envía uno nuevo
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
      })
    );
  }

  // ==========================================
  // 🧹 GESTIÓN DE TOKENS
  // ==========================================

  /**
   * 🗑️ Limpia todos los tokens del almacenamiento local
   *
   * Se ejecuta al cerrar sesión o cuando hay tokens inválidos.
   */
  private clearTokens(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
  }

  // ==========================================
  // 🔐 AUTENTICACIÓN (LOGIN/LOGOUT)
  // ==========================================

  /**
   * 📝 Registra un nuevo usuario
   *
   * @param user Datos del usuario a registrar
   * @returns Observable con respuesta del servidor
   */
  registerUser(user: User): Observable<string> {
    return this.api.post('users', user);
  }

  /**
   * 🔑 Inicia sesión de usuario
   *
   * Proceso completo:
   * 1. Envía credenciales al servidor
   * 2. Recibe tokens y datos de usuario
   * 3. Guarda todo en localStorage
   * 4. Activa la sesión en la aplicación
   * 5. Inicia renovación automática
   *
   * @param user Credenciales de login (username/password)
   * @returns Observable con respuesta de login
   */
  login(user: UsersLogin): Observable<LoginResponse> {
    return this.api.post<UsersLogin, LoginResponse>('auth/login', user).pipe(
      tap((response: LoginResponse) => {
        // 💾 GUARDAR DATOS DE SESIÓN
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('userData', JSON.stringify(response.user));

        // 🚀 ACTIVAR SESIÓN COMPLETA
        this.activateSession();        // 📡 Notificar estado logueado
        this.startTokenRefreshTimer(); // ⏰ Iniciar renovación automática
      })
    );
  }

  /**
   * 🚪 Cierra sesión del usuario
   *
   * Proceso completo:
   * 1. Limpia todos los tokens
   * 2. Desactiva el estado de sesión
   * 3. Para la renovación automática
   * 4. Redirige al login
   */
  logout(): void {
    // 🧹 LIMPIAR TODO
    this.clearTokens();      // 🗑️ Borrar tokens
    this.deactivateSession(); // 📡 Notificar estado no logueado

    // 🧭 REDIRIGIR AL LOGIN
    this.router.navigate(['/login']);
  }

  // ==========================================
  // 📊 MÉTODOS UTILITARIOS
  // ==========================================

  /**
   * 👤 Obtiene los datos del usuario logueado
   *
   * @returns Datos del usuario o null si no hay sesión
   */
  getUserData(): User | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * ✅ Verifica si el usuario está autenticado
   *
   * @returns true si está logueado, false si no
   */
  isAuthenticated(): boolean {
    return this.loggedIn.value;
  }

  /**
   * 🎫 Obtiene el token de acceso actual
   *
   * @returns Token o null si no hay
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
