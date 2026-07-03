import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiClient } from './api-client';
import { environment } from '../../../../environments/environment';
import { VenueDto } from '../../models/dto';

@Injectable({ providedIn: 'root' })
export class VenuesApi extends ApiClient {
  constructor() {
    super(inject(HttpClient), environment.apiUrl);
  }

  getAll(): Observable<VenueDto[]> {
    return this.get<VenueDto[]>('/Venues');
  }
}
