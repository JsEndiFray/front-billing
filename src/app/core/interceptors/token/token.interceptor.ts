import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../../services/auth-services/auth.service';
import Swal from 'sweetalert2';

/**
 * Interceptor para manejo automático de tokens JWT
 * - Añade Authorization header a requests salientes
 * - Renueva tokens automáticamente en errores 401 (sin race conditions)
 * - Múltiples requests simultáneos con token expirado generan un SOLO refresh real;
 *   el resto espera el token nuevo via BehaviorSubject en AuthService
 * - Hace logout (desde AuthService) si la renovación falla
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const addToken = (request: typeof req, authToken: string) =>
    request.clone({ setHeaders: { Authorization: `Bearer ${authToken}` } });

  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const errorMessage = error.error;

        // El backend envió explícitamente que la sesión expiró:
        // mostrar aviso y esperar la confirmación del usuario antes de redirigir
        if (
          typeof errorMessage === 'string' &&
          (errorMessage.toLowerCase().includes('sesion') ||
            errorMessage.toLowerCase().includes('expirado'))
        ) {
          Swal.fire({
            icon: 'warning',
            title: 'Sesión Expirada',
            text: errorMessage,
            confirmButtonText: 'Ir a Login',
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => authService.logout());
          return throwError(() => error);
        }

        // Para rutas no-auth intentar renovar el token.
        // refreshAccessToken() garantiza que solo hay UN refresh real simultáneo;
        // las llamadas concurrentes reciben el nuevo token via BehaviorSubject.
        if (!req.url.includes('/auth/')) {
          return authService.refreshAccessToken().pipe(
            switchMap((newToken: string) => next(addToken(req, newToken))),
            catchError((refreshError) => {
              // refreshAccessToken() ya llamó a logout() — solo propagamos el error
              return throwError(() => refreshError);
            })
          );
        }
      }

      return throwError(() => error);
    })
  );
};
