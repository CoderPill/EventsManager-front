import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReservationsApi } from './api/reservations.api';

export interface CreateReservationRequest {
  eventId: number;
  quantity: number;
  buyerName: string;
  buyerEmail: string;
}

export interface CreateReservationResponse {
  id: number;
  eventId: number;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  status: number;
  reservationCode?: string;
  hasPenalty: boolean;
  creationDate: string;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private reservationsApi = inject(ReservationsApi);

  createReservation(payload: CreateReservationRequest): Observable<CreateReservationResponse> {
    return this.reservationsApi.create(payload);
  }
}
