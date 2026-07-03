import { Injectable } from '@angular/core';
import { DateProvider } from './date-provider';
import { toApiDateString } from '../utils/date-format';

@Injectable({ providedIn: 'root' })
export class SystemDateProvider extends DateProvider {
  getNow(): Date {
    return new Date();
  }

  toApiString(date: Date): string {
    return toApiDateString(date);
  }
}
