/**
 * 🛠️ CONFIGURACIÓN DE DESARROLLO
 *
 * Este archivo se usa cuando:
 * - Ejecutas: ng serve
 * - Ejecutas: ng build --configuration=development
 *
 * En Angular 15+ este es el environment por defecto cuando haces ng serve.
 */

export const environment = {
  production: false,  // false = modo desarrollo (con sourcemaps, logs, etc.)
  apiUrl: 'http://localhost:3600/api'  // Backend local de desarrollo
};
