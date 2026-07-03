import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard that allows navigation only when a user is logged in (any role).
 * Uses the `isLoggedIn` signal from AuthService via a functional guard.
 */
export function authGuard(): boolean | UrlTree {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() || router.createUrlTree(['/']);
}