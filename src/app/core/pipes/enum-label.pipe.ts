import { Pipe, PipeTransform } from '@angular/core';
import { EventType, EventStatus, ReservationStatus, UserRole } from '../models/enums';

/**
 * Transforms a numeric enum value into a human‑readable label.
 * If the value is not recognised, returns 'Desconocido'.
 */
@Pipe({
  name: 'enumLabel',
  standalone: true,
  pure: true
})
export class EnumLabelPipe implements PipeTransform {
  transform(value: number, enumName: 'EventType' | 'EventStatus' | 'ReservationStatus' | 'UserRole'): string {
    switch (enumName) {
      case 'EventType':
        return EventType[value] ?? 'Desconocido';
      case 'EventStatus':
        return EventStatus[value] ?? 'Desconocido';
      case 'ReservationStatus':
        return ReservationStatus[value] ?? 'Desconocido';
      case 'UserRole':
        return UserRole[value] ?? 'Desconocido';
      default:
        return 'Desconocido';
    }
  }
}
