import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {catchError, throwError} from 'rxjs';
import Swal from 'sweetalert2';
import {ErrorResponse} from '../../../interface/error-interface';


export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      let message = 'Ha ocurrido fallo en el servidor';
      let title = 'Oops...';

      //verificamos los mensajes de errores
      if (e.error) {
        // Usar la interfaz para tipar la respuesta de error
        const errorResponse = e.error as ErrorResponse;

        if (errorResponse.msg) {
          message = errorResponse.msg;

          // Títulos según código HTTP
          if (e.status === 400) {
            title = 'Error de validación';
          } else if (e.status === 401) {
            title = 'No autorizado';
          } else if (e.status === 403) {
            title = 'Acceso denegado';
          } else if (e.status === 404) {
            title = 'No encontrado';
          } else if (e.status === 409) {
            title = 'Conflicto';
          } else if (e.status === 500) {
            title = 'Error del servidor';
          }

          // También podemos refinar el título usando el código de error
          if (errorResponse.errorCode) {
            // Extraer el prefijo del código de error
            const codePrefix = errorResponse.errorCode.split('_')[0];

            switch (codePrefix) {
              case 'USER':
                title = 'Error de usuario';

                // Personalizar mensaje para errores de duplicación de usuario
                if (errorResponse.errorCode === 'USER_DUPLICATE' && errorResponse.duplicated) {
                  switch (errorResponse.duplicated) {
                    case 'username':
                      message = 'Ya existe un usuario con este nombre de usuario. Por favor, elige otro.';
                      break;
                    case 'email':
                      message = 'Este correo electrónico ya está registrado. Por favor, utiliza otro correo.';
                      break;
                    case 'phone':
                      message = 'Este número de teléfono ya está registrado. Por favor, utiliza otro número.';
                      break;
                  }
                }
                break;

              case 'CLIENT':
                title = 'Error de cliente';

                // Personalizar mensaje para errores de duplicación de cliente
                if (errorResponse.errorCode === 'CLIENT_DUPLICATE' && errorResponse.duplicated) {
                  switch (errorResponse.duplicated) {
                    case 'nif':
                      message = 'Ya existe un cliente con este NIF/CIF. Por favor, verifica los datos.';
                      break;
                    case 'identification':
                      message = 'Ya existe un cliente con esta identificación. Por favor, verifica los datos.';
                      break;
                  }
                }
                break;

              case 'ESTATE':
                title = 'Error de inmueble';

                if (errorResponse.errorCode === 'ESTATE_DUPLICATE' && errorResponse.duplicated) {
                  switch (errorResponse.duplicated) {
                    case 'cadastral_reference':
                      message = 'Ya existe un inmueble con esta referencia catastral.';
                      break;
                  }
                }
                break;

              case 'BILL':
                title = 'Error de factura';

                if (errorResponse.errorCode === 'BILL_DUPLICATE' && errorResponse.duplicated) {
                  switch (errorResponse.duplicated) {
                    case 'bill_number':
                      message = 'Ya existe una factura con este número.';
                      break;
                  }
                }
                break;

              case 'OWNER':
                title = 'Error de propietario';

                if (errorResponse.errorCode === 'OWNER_DUPLICATE' && errorResponse.duplicated) {
                  switch (errorResponse.duplicated) {
                    case 'nif':
                      message = 'Ya existe un propietario con este NIF.';
                      break;
                  }
                }
                break;

              case 'GLOBAL':
                // Mantener título basado en HTTP status
                break;
            }
          }
        }
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
