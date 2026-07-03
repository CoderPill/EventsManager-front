import { Injectable, signal, computed, inject } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { LoginRequest } from '../models/login.request';
import { AuthApi } from './api/auth.api';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _token = signal<string | null>(sessionStorage.getItem('jwt'));
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  private authApi = inject(AuthApi);

  login(request: LoginRequest): Observable<string> {
    return this.authApi.login(request).pipe(
      tap(token => {
        sessionStorage.setItem('jwt', token);
        this._token.set(token);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('jwt');
    this._token.set(null);
  }
}
