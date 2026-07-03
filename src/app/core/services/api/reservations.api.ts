import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { ApiClient } from './api-client';
import { environment } from '../../../../environments/environment';
import { ReservationDto } from '../../models/dto';
import { mapApiReservation } from '../../models/mappers';

@Injectable({ providedIn: 'root' })
export class ReservationsApi extends ApiClient {
  constructor() {
    super(inject(HttpClient), environment.apiUrl);
  }

  getAll(): Observable<ReservationDto[]> {
    return this.get<ReservationDto[]>('/Reservations')
      .pipe(map(items => items.map(mapApiReservation)));
  }

  getByCode(buyerEmail: string, reservationCode: string): Observable<ReservationDto> {
    const params = new HttpParams()
      .set('BuyerEmail', buyerEmail)
      .set('ReservationCode', reservationCode);
    return this.get<ReservationDto>('/Reservations/getByReservationCode', params)
      .pipe(map(mapApiReservation));
  }

  create(request: object): Observable<ReservationDto> {
    return this.post<ReservationDto>('/Reservations', request)
      .pipe(map(mapApiReservation));
  }

  cancel(request: { buyerEmail: string; reservationCode: string }): Observable<void> {
    return this.put<void>('/Reservations/cancel', request);
  }

  confirm(request: { reservationId: number }): Observable<void> {
    return this.put<void>('/Reservations/confirm', request);
  }
}
