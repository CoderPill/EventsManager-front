import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { ApiClient } from './api-client';
import { environment } from '../../../../environments/environment';
import { EventDto } from '../../models/dto';
import { mapApiEvent } from '../../models/mappers';

function mapOccupationReport(raw: any): any {
  return {
    ...raw,
    status: typeof raw.status === 'number'
      ? raw.status
      : ({ 'Activo': 1, 'Cancelado': 2, 'Completado': 3 } as const)[raw.status as string] ?? 2,
  };
}

@Injectable({ providedIn: 'root' })
export class EventsApi extends ApiClient {
  constructor() {
    super(inject(HttpClient), environment.apiUrl);
  }

  getAll(): Observable<EventDto[]> {
    return this.get<EventDto[]>('/Events').pipe(
      map(events => events.map(mapApiEvent))
    );
  }

  getOccupationReport(eventId: number): Observable<any> {
    const params = new HttpParams().set('eventId', eventId.toString());
    return this.get<any>('/Events/occupationReport', params).pipe(
      map(mapOccupationReport)
    );
  }

  create(request: object): Observable<EventDto> {
    return this.post<EventDto>('/Events', request).pipe(
      map(mapApiEvent)
    );
  }
}
