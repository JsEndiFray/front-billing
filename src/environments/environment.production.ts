/**
 * 🚀 CONFIGURACIÓN DE PRODUCCIÓN
 *
 * Este archivo se usa cuando:
 * - Ejecutas: ng build (por defecto usa production)
 * - Ejecutas: ng build --configuration=production
 *
 * Características de producción:
 * - Código minificado
 * - Sin sourcemaps
 * - Optimizaciones activadas
 * - Logs reducidos
 */

export const environment = {
  production: true,  // true = modo producción (optimizado)
  apiUrl: 'https://tu-dominio-produccion.com'  // ⚠️ CAMBIAR por tu URL real

  // Ejemplos de URL de producción:
  // apiUrl: 'https://api.miapp.com'
  // apiUrl: 'https://miapp-backend.herokuapp.com'
  // apiUrl: 'https://backend.miempresa.es'
};
