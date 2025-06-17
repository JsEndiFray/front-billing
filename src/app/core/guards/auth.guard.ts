import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service/auth.service';

/**
 * Guard de autenticación para proteger rutas
 * Verifica token en localStorage y redirige a login si no existe
 */
export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Verificar si hay token en localStorage
  const token = localStorage.getItem('token');

  if (token) {
    // Token existe - verificar validez
    try {
      // TODO: Validación de expiración JWT (opcional)
      // const payload = JSON.parse(atob(token.split('.')[1]));
      // const tokenExpired = payload.exp < Date.now() / 1000;

      // if (tokenExpired) {
      //   // Token expirado, limpiar y redirigir
      //   localStorage.removeItem('token');
      //   localStorage.removeItem('refreshToken');
      //   authService.deactivateSession();
      //   router.navigate(['/login']);
      //   return false;
      // }

      return true; // Token válido
    } catch (error) {
      // Token inválido - limpiar sesión
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      authService.deactivateSession();
      router.navigate(['/login']);
      return false;
    }
  }

  // Sin token - redirigir a login
  router.navigate(['/login']);
  return false;
};
