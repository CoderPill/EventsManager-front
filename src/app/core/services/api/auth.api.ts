import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiClient } from './api-client';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthApi extends ApiClient {
  constructor() {
    super(inject(HttpClient), environment.apiUrl);
  }

  login(request: { username: string; password: string }): Observable<string> {
    return this.post<string>('/Auth/login', request);
  }
}
