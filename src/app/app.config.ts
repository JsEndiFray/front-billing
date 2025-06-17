import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {httpErrorInterceptor} from './core/interceptors/http-error/http-error.interceptor';
import {tokenInterceptor} from './core/interceptors/token/token.interceptor';

/**
 * Configuración principal de la aplicación
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Optimización de detección de cambios
    provideZoneChangeDetection({eventCoalescing: true}),

    // Sistema de rutas
    provideRouter(routes),

    // HTTP client con interceptors (token + manejo de errores)
    provideHttpClient(withInterceptors([tokenInterceptor, httpErrorInterceptor])),
  ]
};
