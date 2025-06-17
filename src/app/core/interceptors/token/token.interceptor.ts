import {HttpInterceptorFn, HttpErrorResponse} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, switchMap, throwError} from 'rxjs';
import {AuthService} from '../../services/auth-service/auth.service';

/**
 * Interceptor para manejo automático de tokens JWT
 * - Añade Authorization header a requests salientes
 * - Renueva tokens automáticamente en errores 401
 * - Hace logout si renovación falla
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

  // Añadir token si existe
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Intentar renovación automática en error 401
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return authService.refreshAccessToken().pipe(
          switchMap((refreshResponse) => {
            // Reintentar request con nuevo token
            const newToken = localStorage.getItem('token');
            const retryReq = newToken ? addToken(req, newToken) : req;
            return next(retryReq);
          }),
          catchError((refreshError) => {
            // Renovación falló - cerrar sesión
            authService.logout();
            return throwError(() => refreshError);
          })
        );
      }

      // Otros errores - pasar sin modificar
      return throwError(() => error);
    })
  );
};
