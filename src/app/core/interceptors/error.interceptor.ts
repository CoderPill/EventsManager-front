import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { inject } from '@angular/core';
import { ApiError } from '../services/api/api-response.model';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Silent logout on 401: if token expired/invalid, clean up session
      if (error.status === 401) {
        if (auth.isLoggedIn()) {
          auth.logout();
        }
      }

      let apiError: ApiError;

      if (error.error?.isSuccess === false && Array.isArray(error.error.errors)) {
        apiError = new ApiError(error.error.errors, error.status);
      } else if (error.error?.message) {
        apiError = new ApiError([error.error.message], error.status);
      } else {
        apiError = new ApiError([error.message || 'Error interno del servidor'], error.status);
      }

      return throwError(() => apiError);
    })
  );
};
