import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const bypassPaths = ['/api/Auth/login'];
  const requestPath = req.url.startsWith('http')
    ? new URL(req.url).pathname
    : req.url.split('?')[0];
  if (bypassPaths.some(path => requestPath === path)) {
    return next(req);
  }

  const token = sessionStorage.getItem('jwt');
  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }
  return next(req);
};
