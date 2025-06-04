import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {catchError, throwError} from 'rxjs';
import Swal from 'sweetalert2';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      let message = 'Ha ocurrido un error en el servidor';
      let title = 'Error';

      // Ahora el backend envía strings directos
      if (e.error && typeof e.error === 'string') {
        message = e.error;
      }

      // Títulos según código HTTP
      switch (e.status) {
        case 400:
          title = 'Error de validación';
          break;
        case 401:
          title = 'No autorizado';
          break;
        case 403:
          title = 'Acceso denegado';
          break;
        case 404:
          title = 'No encontrado';
          break;
        case 409:
          title = 'Conflicto';
          break;
        case 429:
          title = 'Demasiadas peticiones';
          break;
        case 500:
          title = 'Error del servidor';
          break;
        default:
          title = 'Error';
          break;
      }

      Swal.fire({
        icon: 'error',
        title: title,
        text: message
      });

      return throwError(() => new Error(message));
    })
  );
};
