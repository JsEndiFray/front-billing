import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth-service/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Verificar si hay token en localStorage
  const token = localStorage.getItem('token');

  // Si hay token, permitir acceso a la ruta
  if (token) {
    // Opcional: Verificar si el token es válido/no ha expirado
    // Si utilizas JWT, puedes decodificarlo para verificar la expiración
    try {
      // Si usas JWT, puedes decodificar para verificar exp
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

      // Si no hay problemas con el token
      return true;
    } catch (error) {
      // Error al procesar el token, asumimos que es inválido
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      authService.deactivateSession();
      router.navigate(['/login']);
      return false;
    }
  }

  // No hay token, redirigir al login
  router.navigate(['/login']);
  return false;
};
