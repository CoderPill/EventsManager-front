import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { EventsApi } from './api/events.api';

export interface OccupationReport {
  eventId: number;
  title: string;
  status: number;
  totalTicketsSold: number;
  totalTicketsAvailable: number;
  occupancyPercentage: number;
  totalRevenue: number;
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private eventsApi = inject(EventsApi);

  getOccupationReport(eventId: number): Observable<OccupationReport> {
    return this.eventsApi.getOccupationReport(eventId);
  }
}
