import {ApplicationConfig, LOCALE_ID, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {routes} from './app.routes';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {httpErrorInterceptor} from './core/interceptors/http-error/http-error.interceptor';
import {tokenInterceptor} from './core/interceptors/token/token.interceptor';
import {registerLocaleData} from '@angular/common';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs);

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

    // Locale español
    {provide: LOCALE_ID, useValue: 'es'},
  ]
};
