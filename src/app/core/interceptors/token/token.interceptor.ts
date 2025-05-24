import { HttpInterceptorFn} from '@angular/common/http';


export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el token del localStorage
  const token = localStorage.getItem('token');


// Si hay token, clonamos la solicitud y añadimos el encabezado de autorización
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    // Interceptar la respuesta para manejar errores de autorización
    return next(authReq)
  };
  // Si no hay token, pasamos la solicitud original
  return next(req);
};

