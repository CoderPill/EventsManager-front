import { Pipe, PipeTransform } from '@angular/core';
import { EventType, EventStatus, ReservationStatus, UserRole } from '../models/enums';

/**
 * Transforms a string label back into its numeric enum value.
 * Returns `null` if the label is not recognised.
 */
@Pipe({
  name: 'enumNumber',
  standalone: true,
  pure: true
})
export class EnumNumberPipe implements PipeTransform {
  transform(label: string, enumName: 'EventType' | 'EventStatus' | 'ReservationStatus' | 'UserRole'): number | null {
    const map = (enumObj: any) => {
      const entries = Object.entries(enumObj) as [string, number][];
      const found = entries.find(([key, val]) => key.toLowerCase() === label.toLowerCase());
      return found ? found[1] : null;
    };
    switch (enumName) {
      case 'EventType':
        return map(EventType);
      case 'EventStatus':
        return map(EventStatus);
      case 'ReservationStatus':
        return map(ReservationStatus);
      case 'UserRole':
        return map(UserRole);
      default:
        return null;
    }
  }
}
