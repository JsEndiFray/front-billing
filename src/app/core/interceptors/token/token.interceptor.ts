import {HttpInterceptorFn, HttpErrorResponse} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, switchMap, throwError} from 'rxjs';
import {AuthService} from '../../services/auth-service/auth.service';

/**
 * 🛡️ INTERCEPTOR DE TOKENS
 *
 * ¿Qué hace?
 * - Intercepta TODOS los requests HTTP de la aplicación
 * - Añade automáticamente el token de autorización si existe
 * - Maneja errores 401 (token expirado) renovando automáticamente
 * - Reintenta requests fallidos después de renovar token
 * - Cierra sesión si la renovación también falla
 *
 * ¿Cuándo se ejecuta?
 * - En CADA petición HTTP que haga la aplicación
 * - Tanto salientes (añadir token) como entrantes (manejar errores)
 *
 * Beneficios:
 * - El programador no tiene que añadir manualmente el token
 * - Usuario nunca ve errores de "sesión expirada"
 * - Renovación transparente e invisible
 *
 * @param req Request HTTP que va hacia el servidor
 * @param next Función para continuar con el siguiente interceptor o enviar request
 * @returns Observable con la respuesta del servidor
 */
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {

  // 🔌 INYECTAR DEPENDENCIAS
  // inject() es la forma moderna de obtener servicios en interceptores funcionales
  const authService = inject(AuthService);

  // 🔑 OBTENER TOKEN ACTUAL
  // Buscar en localStorage el token de acceso guardado
  const token = localStorage.getItem('token');

  // ==========================================
  // 🔧 FUNCIÓN HELPER PARA AÑADIR TOKEN
  // ==========================================

  /**
   * 🎫 Clona un request y le añade el header de autorización
   *
   * Los requests HTTP son inmutables en Angular, por eso hay que clonarlos
   * para modificarlos.
   *
   * @param request Request original
   * @param authToken Token a añadir
   * @returns Request clonado con header Authorization
   */
  const addToken = (request: typeof req, authToken: string) => {
    return request.clone({
      setHeaders: {
        // 🎫 Formato estándar: "Bearer" seguido del token
        // El servidor espera este formato específico
        Authorization: `Bearer ${authToken}`
      }
    });
  };

  // ==========================================
  // 📨 PROCESAMIENTO DEL REQUEST SALIENTE
  // ==========================================

  // 🎯 DECIDIR SI AÑADIR TOKEN O NO
  // Si hay token: clonar request y añadir Authorization header
  // Si no hay token: enviar request original (para login, registro, etc.)
  const authReq = token ? addToken(req, token) : req;

  // ==========================================
  // 📡 ENVIAR REQUEST Y MANEJAR RESPUESTA
  // ==========================================

  // 📤 Enviar request al servidor y procesar respuesta
  return next(authReq).pipe(
    // 🚨 CAPTURAR Y MANEJAR ERRORES HTTP
    catchError((error: HttpErrorResponse) => {

      // ==========================================
      // 🔄 MANEJO ESPECIAL DE ERROR 401
      // ==========================================

      // ✅ CONDICIONES para intentar renovación automática:
      // 1. Error 401 (No autorizado / Token expirado)
      // 2. NO es un endpoint de autenticación (evitar loops infinitos)
      if (error.status === 401 && !req.url.includes('/auth/')) {
        // 🔄 INTENTAR RENOVACIÓN DE TOKEN
        return authService.refreshAccessToken().pipe(
          // 🔀 CUANDO LA RENOVACIÓN SEA EXITOSA
          switchMap((refreshResponse) => {
            console.log('Token renovado, reintentando request original');

            // 🆕 OBTENER NUEVO TOKEN
            // El AuthService ya lo guardó en localStorage durante refreshAccessToken()
            const newToken = localStorage.getItem('token');

            // 🔁 PREPARAR REQUEST ORIGINAL CON NUEVO TOKEN
            // Usar el request original (req), no el que ya tenía el token viejo
            const retryReq = newToken ? addToken(req, newToken) : req;

            // 🚀 REINTENTAR REQUEST ORIGINAL
            // El usuario nunca se enteró de que el token expiró
            return next(retryReq);
          }),

          // 🚨 SI LA RENOVACIÓN TAMBIÉN FALLA
          catchError((refreshError) => {
            console.error('Error renovando token, cerrando sesión');

            // 🚪 CERRAR SESIÓN AUTOMÁTICAMENTE
            // Esto pasa cuando el refresh token también expiró (después de 7 días)
            // Es normal y esperado
            authService.logout();

            // 📢 PROPAGAR ERROR AL COMPONENTE
            // El componente puede manejar el error como quiera
            return throwError(() => refreshError);
          })
        );
      }

      // ==========================================
      // 🚨 OTROS ERRORES (NO 401)
      // ==========================================

      // 🔄 PASAR ERRORES SIN MODIFICAR
      // Errores como 500 (servidor), 404 (no encontrado), etc.
      // se pasan tal como están al componente
      return throwError(() => error);
    })
  );
};

/*
==========================================
📋 FLUJOS DE EJECUCIÓN POSIBLES:
==========================================

🟢 FLUJO NORMAL (Token válido):
1. Component hace request
2. Interceptor añade token
3. Servidor responde OK
4. Component recibe datos

🔄 FLUJO CON RENOVACIÓN (Token expirado):
1. Component hace request
2. Interceptor añade token (expirado)
3. Servidor responde 401
4. Interceptor renueva token automáticamente
5. Interceptor reintenta request con nuevo token
6. Servidor responde OK
7. Component recibe datos (sin saber que hubo renovación)

🚪 FLUJO CON LOGOUT (Refresh token expirado):
1. Component hace request
2. Interceptor añade token (expirado)
3. Servidor responde 401
4. Interceptor intenta renovar token
5. Servidor responde que refresh token también expiró
6. Interceptor ejecuta logout automático
7. Usuario es redirigido a login

🔵 FLUJO SIN TOKEN (Usuario no logueado):
1. Component hace request (ej: login)
2. Interceptor NO añade token (no hay)
3. Servidor responde según el endpoint
4. Component maneja respuesta

🟡 FLUJO CON OTROS ERRORES:
1. Component hace request
2. Interceptor añade token
3. Servidor responde error (500, 404, etc.)
4. Interceptor pasa error sin modificar
5. Component maneja el error
*/
