import {HttpInterceptorFn, HttpErrorResponse} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, switchMap, throwError} from 'rxjs';
import {AuthService} from '../../services/auth-services/auth.service';
import Swal from 'sweetalert2';

/**
 * Interceptor para manejo automático de tokens JWT
 * - Añade Authorization header a requests salientes
 * - Renueva tokens automáticamente en errores 401
 * - Hace logout si renovación falla
 * - Muestra mensaje de sesión expirada
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');

  // Función para añadir token a request
  const addToken = (request: typeof req, authToken: string) => {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${authToken}`
      }
    });
  };

  // Función para mostrar mensaje de sesión expirada
  const showSessionExpiredMessage = (error?: HttpErrorResponse) => {
    const message = error?.error || 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';

    Swal.fire({
      icon: 'warning',
      title: 'Sesión Expirada',
      text: message,
      confirmButtonText: 'Ir a Login',
      allowOutsideClick: false,
      allowEscapeKey: false
    });
  };

  // Añadir token si existe
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Verificar si el backend devolvió mensaje de sesión expirada
      if (error.status === 401) {
        const errorMessage = error.error;

        // Si el mensaje contiene "sesion" o "expirado", mostrar el mensaje del backend
        if (typeof errorMessage === 'string' &&
          (errorMessage.toLowerCase().includes('sesion') ||
            errorMessage.toLowerCase().includes('expirado'))) {
          showSessionExpiredMessage(error);
          authService.logout();
          return throwError(() => error);
        }

        // Para otros errores 401, intentar refresh (si no es ruta de auth)
        if (!req.url.includes('/auth/')) {
          return authService.refreshAccessToken().pipe(
            switchMap((refreshResponse) => {
              // Reintentar request con nuevo token
              const newToken = localStorage.getItem('token');
              const retryReq = newToken ? addToken(req, newToken) : req;
              return next(retryReq);
            }),
            catchError((refreshError) => {
              // Renovación falló - mostrar mensaje y cerrar sesión
              showSessionExpiredMessage(refreshError);
              authService.logout();
              return throwError(() => refreshError);
            })
          );
        }

        // Para rutas de auth con 401, solo mostrar mensaje
        showSessionExpiredMessage(error);
      }

      // Otros errores - pasar sin modificar
      return throwError(() => error);
    })
  );
};
