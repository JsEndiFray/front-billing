import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth-services/auth.service';

export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.waitForInit().pipe(
    map(() => {
      if (authService.isAuthenticated()) return router.createUrlTree(['/dashboards']);
      return true;
    })
  );
};
